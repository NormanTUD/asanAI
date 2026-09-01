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

No inquirer touches its subject matter directly. A physicist never touches an electron; a mathematician never touches a group-in-itself; a listener never touches the sound source; a historian never touches the past. Each receives *transformed traces*: measurements, sense data, symbolic reports, proof scripts, embeddings, archival documents.

"How do we get past the traces to the thing?" has no operational meaning. The useful question is:

$$
\boxed{
\begin{aligned}
&\text{When does a collection of partial, differently-transformed traces}\\
&\text{deserve to be called a description of \emph{one} subject matter?}
\end{aligned}}
$$

The chapter's answer, in the vocabulary of *Coherent Difference*: **when the traces glue.**

$$
\underbrace{\text{gluing}}_{\text{local pieces fit on their overlaps}}
\;=\;
\underbrace{\text{descent}}_{\text{a unique global object exists that restricts to each piece}}.
$$

One discipline throughout: $\boxed{\text{a useful analogy is not a theorem.}}$

</div>

<div class="md">

## Three kinds of difference

Between "subject matter $W$" and "the trace $R$ I received" sit at least three independent sources of difference:

$$
\boxed{
\begin{aligned}
&\underbrace{W_1 \neq W_2}_{\text{the subjects actually differ}}\\[4pt]
&\underbrace{I_1 \neq I_2}_{\text{the channels/instruments differ}}\\[4pt]
&\underbrace{N_1 \neq N_2}_{\text{the post-processing differs}}
\end{aligned}}
$$

Two reports disagreeing does not, by itself, tell you which level is responsible. The whole task of coherent modeling is: *locate the difference at the right level*.

$$
\boxed{
\begin{aligned}
&\text{Two different representations}\\
&\text{do not imply two different subjects.}
\end{aligned}}
$$

</div>

<div class="md">

## Notions of sameness

Not everything called "the same" is the same *kind* of same. The vocabulary of *Coherent Difference* already gave us the hierarchy; here it is with examples from **sense data**, **measurement**, and **mathematics**:

$$
\underbrace{x=y}_{\text{literal}}\ \ 
\underbrace{x\cong y}_{\text{iso}}\ \ 
\underbrace{x\simeq y}_{\text{equiv}}\ \ 
\underbrace{d(x,y)\le\varepsilon}_{\text{approx}}\ \ 
\underbrace{P(D_1,D_2\mid M)\text{ high}}_{\text{statistical}}
$$

$$
\begin{array}{c|c|c|c}
\text{Relation} & \text{Sense data} & \text{Measurement} & \text{Mathematics}\\
\hline
x=y & \text{same photon on same rod} & \text{two clocks show same tick} & 2+2=4\\
x\cong y & \text{two indistinguishable coins} & \text{two calibrated meters, same reading} & \mathbb Z/6 \cong \mathbb Z/2\times\mathbb Z/3\\
x\simeq y & \text{flash + bang from one strike} & \text{two experiments, one phenomenon} & \text{cup}\simeq\text{donut}\\
d(x,y)\le\varepsilon & \text{20.01 vs 20.02 on thermometer} & \text{within tolerance} & \|f_n - f\|_\infty<\varepsilon\\
P\text{ high} & \text{eyewitness + CCTV agree} & \text{two studies reject same }H_0 & \text{Monte-Carlo agrees with theorem}
\end{array}
$$

In dependent type theory these are *literally different types*: $\mathsf{Id}_A(x,y)$, $\mathsf{Iso}(x,y)$, and under univalence $(x=_{\mathcal U} y)\simeq(x\simeq y)$. Silent upgrades between rows are the most common category error in "world model" talk.

$$
\boxed{
\begin{aligned}
&\text{Never silently strengthen a weaker}\\
&\text{sameness into a stronger one.}
\end{aligned}}
$$

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

For any two finite sets of equal size, *some* bijection exists. So "there is a transformation" is empty by itself. The real content is **a constrained class** $\mathcal T$, justified independently:

$$
\underbrace{\mathcal T}_{\text{admissible transitions}} \;\subseteq\; \underbrace{\mathrm{Hom}(R_i, R_j)}_{\text{all conceivable maps}}.
$$

What belongs in $\mathcal T$:

$$
\underbrace{\text{sensor calibration}}_{\text{measurement}}\ \ 
\underbrace{\text{coordinate change}}_{\text{geometry}}\ \ 
\underbrace{\text{physical law}}_{\text{propagation}}\ \ 
\underbrace{\text{proof-preserving translation}}_{\text{mathematics}}\ \ 
\underbrace{\text{validated decoder}}_{\text{ML}}\ \ 
\underbrace{\text{documented archival transmission}}_{\text{history}}
$$

$$
\boxed{
\begin{aligned}
&\text{More transformation freedom}\\
&\Rightarrow \text{ more evidence required.}
\end{aligned}}
$$

Simultaneously a **subcategory** constraint, a **Bayesian prior**, and an **Occam penalty** — three presentations of one restriction.

</div>

<div class="md">

## Contexts as a site

Following *Coherent Difference*, **context** is used in the widest possible sense: anything that can index data points is a "space". So a context is a tuple:

$$
\underbrace{c \in \mathcal C}_{\text{a context}} = 
(\underbrace{\text{place}}_{\text{where}},\ 
\underbrace{\text{time}}_{\text{when}},\ 
\underbrace{\text{observer}}_{\text{who}},\ 
\underbrace{\text{instrument}}_{\text{how}},\ 
\underbrace{\text{framework}}_{\text{in what terms}},\ 
\underbrace{\text{culture / era}}_{\text{in what tradition}}).
$$

Time is a context. Culture is a context. A historical period is a context. A conceptual framework is a context. A formal system is a context. Anything on the "space" list of *Coherent Difference* counts.

Morphisms in $\mathcal C$ are **refinements**: narrower time windows, tighter instruments, sub-frameworks, more specific coordinates.

A **cover** of a context $c$ is a family of sub-contexts $\{c_i \to c\}_{i \in I}$ that *together* determine $c$ via admissible transitions:

$$
\underbrace{\{c_i \to c\}_{i \in I}}_{\text{covering family}}\ :\ 
\underbrace{\text{admissible-}\mathcal T\text{-images of the }c_i\text{ jointly determine }c}_{\text{"no relevant feature of }c\text{ escapes all patches"}}.
$$

Everyday analogy: a set of overlapping photographs *covers* a room if every point of the room appears in at least one photograph. Formally, equipping $\mathcal C$ with a rule for which families count as covers is a **Grothendieck topology** $J$; the pair $(\mathcal C, J)$ is a **site** (as sketched in *Coherent Difference*).

A **representation scheme** is a presheaf:

$$
\underbrace{F}_{\text{rep. assignment}} : 
\underbrace{\mathcal C^{\mathrm{op}}}_{\text{contexts, arrows reversed}} 
\longrightarrow 
\underbrace{\mathcal V}_{\text{target category}}.
$$

$\mathcal V$ can be $\mathbf{Set}$, metric spaces, probability spaces, chain complexes, or $\infty$-groupoids — depending on how much homotopy is needed.

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
\underbrace{\mathrm{Eq}\!\Bigl(\;
\underbrace{\prod_{i\in I} F(c_i)}_{\text{a section on each patch}}
\;\xrightrightarrows[\;\text{restrict from }j\;]{\;\text{restrict from }i\;}\;
\underbrace{\prod_{i,j\in I} F(c_i \times_c c_j)}_{\text{a section on each pairwise overlap}}
\;\Bigr)}_{\text{the tuples that agree on every overlap}}
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

Five representations, five different categories. The site $\mathcal C$ contains their contexts; the cover of "the event" is $\{c_v, c_a, c_r, c_\ell, c_h\} \to c$; $\mathcal T$ contains sensor calibration, physical propagation (sound delay, Doppler), validated linguistic reporting, and archival transmission with error bounds. A global $G \in F(c)$ exists iff descent holds.

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

Three representations with pairwise transitions:

$$
A \xrightarrow{\phi_{AB}} B \xrightarrow{\phi_{BC}} C,\qquad A \xrightarrow{\phi_{AC}} C.
$$

- **Strict:** $\phi_{BC} \circ \phi_{AB} = \phi_{AC}$.
- **Homotopical:** a filler $\alpha_{ABC} : \phi_{BC}\phi_{AB} \Rightarrow \phi_{AC}$ (a 2-morphism).
- **Four representations:** a 3-morphism filling between the fillers.
- **And so on:** the Čech nerve of the cover, evaluated in $F$.

$$
\underbrace{\text{objects}}_{0\text{-cells}} \to 
\underbrace{\text{morphisms}}_{1\text{-cells}} \to 
\underbrace{2\text{-morphisms}}_{\text{relations of relations}} \to 
\underbrace{3\text{-morphisms}}_{\text{and so on}} \to \cdots
$$

$$
\boxed{
\begin{aligned}
&\text{Relations can themselves have relations.}\\
&\text{The tower is not decoration.}
\end{aligned}}
$$

An **$\infty$-sheaf** is a sheaf-like object in an $(\infty,1)$-topos: equality on overlaps is replaced by *coherent equivalence*, and coherence itself is data at every level.

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

For $T \in \mathcal T$, ask what is preserved:

$$
\underbrace{\text{causal order}}_{\text{before/after}}\ \ 
\underbrace{\text{adjacency}}_{\text{who touches whom}}\ \ 
\underbrace{\text{symmetry action}}_{\text{groups acting on the object}}\ \ 
\underbrace{\text{conservation laws}}_{\text{energy, charge, count}}\ \ 
\underbrace{\text{stat. dependence}}_{\text{correlations, information}}\ \ 
\underbrace{\text{homotopy type}}_{\text{shape up to deformation}}.
$$

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

$$
\underbrace{s_i|_U=s_j|_U}_{\text{strict: same on overlap}}\;\Rightarrow\;
\underbrace{s_i\cong s_j}_{\text{iso}}\;\Rightarrow\;
\underbrace{s_i\simeq s_j}_{\text{homotopy equiv.}}\;\Rightarrow\;
\underbrace{d(s_i,s_j)\le\varepsilon}_{\text{approx}}\;\Rightarrow\;
\underbrace{P(D_i,D_j\mid M)\text{ high}}_{\text{stat}}\;\Rightarrow\;
\underbrace{\exists M:M\models T_{\text{all}}}_{\text{model-theoretic consistency}}.
$$

Concrete examples in each column:

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
\begin{array}{ccccccccc}
&&\underbrace{W}_{\text{subject matter}}&&&&&\\
{}^{\,O_1}\!\swarrow&{}^{\,O_2}\!\downarrow&{}^{\,O_3}\!\searrow&\cdots&{}^{\,O_i}\!\downarrow&\cdots&\\
\underbrace{R_1}_{\text{view 1}}&&\underbrace{R_2}_{\text{view 2}}&&\underbrace{R_3}_{\text{view 3}}&\cdots&\underbrace{R_i}_{\text{view }i}&\cdots&\\
{}^{\,T_1}\!\searrow&{}^{\,T_2}\!\downarrow&{}^{\,T_3}\!\swarrow&\cdots&{}^{\,T_i}\!\downarrow&\cdots&\\
&&\underbrace{G=\varprojlim_{\,i\in I}F(R_i)}_{\text{coherent global model — limit over all views in } I}&&&&&\\
\end{array}
\qquad T_i\in\mathcal T,\ \ i\in I
$$

Read the dots as "any number of views". The cover $\{R_i\}_{i\in I}$ is indexed by an arbitrary set $I$ — three, a thousand, or uncountably many. The coherent global model $G$ is the limit of the whole diagram, not just of three patches. This is the picture the rest of the chapter unpacks.

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

Given complicated evidence, in any domain:

$$
\underbrace{D}_{\text{raw datum}}\ \to\ 
\underbrace{I(D)}_{\text{interpretation}}\ \to\ 
\underbrace{W\to D\to I}_{\text{draw the chain}}\ \to\ 
\underbrace{\text{overlaps}}_{\text{where do channels meet?}}\ \to\ 
\underbrace{T_{ij}\in\mathcal T}_{\text{admissible transitions}}
$$

$$
\to\ 
\underbrace{\text{which sameness?}}_{=,\ \cong,\ \simeq,\ \le\varepsilon,\ \text{stat.}}\ \to\ 
\underbrace{G}_{\text{candidate global model}}\ \to\ 
\underbrace{\text{residuals}}_{\text{preserved, not erased}}\ \to\ 
\underbrace{\text{next observation}}_{\text{discriminating evidence}}.
$$

$$
\boxed{\text{Anomalies are constraints not yet integrated, not defeats.}}
$$

</div>

<div class="md">

## Where each theory lives on one chain

$$
\boxed{
\begin{aligned}
&\underbrace{\text{distinction}}_{\text{sets, type theory}}\\
&\quad\downarrow\\
&\underbrace{\text{relation}}_{\text{graphs, typed identity}}\\
&\quad\downarrow\\
&\underbrace{\text{transformation}}_{\text{categories}}\\
&\quad\downarrow\\
&\underbrace{\text{locality}}_{\text{topology, sites}}\\
&\quad\downarrow\\
&\underbrace{\text{compatibility}}_{\text{sheaves}}\\
&\quad\downarrow\\
&\underbrace{\text{coherence}}_{\infty\text{-sheaves, HoTT}}\\
&\quad\downarrow\\
&\underbrace{\text{gluing}}_{\text{descent}}\\
&\quad\downarrow\\
&\underbrace{\text{globality}}_{\text{model theory, ML}}\\
&\quad\downarrow\\
&\underbrace{\text{invariance}}_{\text{what survives }\mathcal T}
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
