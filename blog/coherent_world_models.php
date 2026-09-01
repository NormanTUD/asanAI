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

A **cover** of a context $c$ is, in the most general sense, a family of sub-contexts $\{c_i \to c\}_{i \in I}$ whose images together contain everything relevant about $c$ — *no relevant feature of $c$ escapes all patches*. The everyday analogy: a set of overlapping photographs covers a room if every point of the room appears in at least one photograph. In a topological space, an **open cover** of an open set $U$ is a family $\{U_i\}$ of open sets whose union contains $U$. A **Grothendieck cover** generalises both: a family of morphisms $\{c_i \to c\}$ is a cover if it has been *designated* as covering by a rule on the category, called a Grothendieck topology.

In this chapter the cover is required to do one more job: every morphism $c_i \to c$ must lie in the designated class $\mathcal T$ of admissible transitions. We call such a cover **admissible**:

$$
\underbrace{\{c_i \xrightarrow{\,O_i\,} c\}_{i \in I}}_{\text{admissible covering family}}\ :\ 
\underbrace{\text{each }O_i\in\mathcal T}_{\text{morphisms are admissible}}\ ,\qquad
\underbrace{\text{admissible-}\mathcal T\text{-images of the }c_i\text{ jointly determine }c}_{\text{"no relevant feature of }c\text{ escapes all patches"}}.
$$

The adjective matters. Without the admissibility filter, *any* family of sub-contexts could be declared a "cover" and coherence would become vacuous. By restricting to admissible covers, we make the sheaf condition a *meaningful* question about the specific modelling context.

Equipping $\mathcal C$ with a rule for which families count as covers (one that closes under pullback and under composition) is a **Grothendieck topology** $J$; the pair $(\mathcal C, J)$ is a **site** (as sketched in *Coherent Difference*).

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

$$
\underbrace{\text{objects}}_{0\text{-cells}} \;\to\; 
\underbrace{\text{morphisms}}_{1\text{-cells}} \;\to\; 
\underbrace{2\text{-morphisms}}_{\text{morphisms between morphisms}} \;\to\; 
\underbrace{3\text{-morphisms}}_{\text{morphisms between }2\text{-morphisms}} \;\to\; \cdots
$$

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

$$
\begin{array}{c|c|c}
\text{Tradition} & \text{It checks that…} & \text{It ignores…}\\
\hline
\text{Correspondence (Tarski)} & \text{at each contact point, model}\leftrightarrow\text{world} & \text{the model's internal consistency}\\
\text{Coherence (Bradley / Blanshard)} & \text{the model's parts fit on overlaps} & \text{whether the parts fit the world}
\end{array}
$$

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

$$
\underbrace{1.\ \text{name every claim}}_{\text{make the implicit explicit}}
\;\;\to\;\;
\underbrace{2.\ \text{name every contact point}}_{\text{where could Tarski apply?}}
\;\;\to\;\;
\underbrace{3.\ \text{check calibration of each }T\in\mathcal T}_{\text{is the bridge justified?}}
\;\;\to\;\;
$$
$$
\underbrace{4.\ \text{check descent on every admissible cover}}_{\text{coherence: do the parts fit?}}
\;\;\to\;\;
\underbrace{5.\ \text{apply Tarski at every contact}}_{\text{iff: claim iff world}}
\;\;\to\;\;
\underbrace{6.\ \text{record residuals}}_{\text{what remains unexplained?}}
$$

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
