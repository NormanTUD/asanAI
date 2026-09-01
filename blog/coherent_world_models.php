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

## 0. The question

A finite observer never touches the world $W$ directly. She receives *transformed traces* of it — from many channels, at many times, in many formats (sense data, measurements, equations, proofs, cultural reports). When do such traces belong to *one* world, and what does "belong" mean?

The single claim of this chapter:

$$
\boxed{\textbf{Coherent representation} \;=\; \textbf{descent along a class of admissible transitions.}}
$$

Four words. The chapter is the unpacking.

$$
\underbrace{\text{descent}}_{\text{local pieces glue}}\ \ \underbrace{\text{along}}_{\text{via}}\ \ \underbrace{\text{admissible}}_{\text{constrained, justified}}\ \ \underbrace{\text{transitions}}_{\text{maps between representations}}
$$

*Discipline throughout:* $\boxed{\text{a useful analogy is not a theorem.}}$

</div>

<div class="md">

## 1. The observation chain

Every access to $W$ is a composite:

$$
\underbrace{W}_{\text{world}}
\xrightarrow{\;p\;}\underbrace{S}_{\text{stimulus}}
\xrightarrow{\;I\;}\underbrace{D}_{\text{datum}}
\xrightarrow{\;N\;}\underbrace{R}_{\text{internal rep.}}
\xrightarrow{\;L\;}\underbrace{\Sigma}_{\text{linguistic}}
\xrightarrow{\;C\;}\underbrace{M}_{\text{model}}
$$

Three kinds of difference must never be confused:

$$
\boxed{
\begin{aligned}
&\underbrace{W_1 \neq W_2}_{\text{world difference: sources actually differ}} \\
&\underbrace{I_1 \neq I_2}_{\text{channel difference: instruments/senses differ}} \\
&\underbrace{N_1 \neq N_2}_{\text{representation difference: post-processing differs}}
\end{aligned}}
$$

A disagreement between reports does not, by itself, tell you which level is responsible.

$$
\boxed{\text{different representation} \not\Rightarrow \text{different source.}}
$$

</div>

<div class="md">

## 2. A running example (carried throughout)

A train passes a platform. Channels:

$$
\begin{array}{ccccc}
&&W\ (\text{train event})&&\\
&\swarrow&\downarrow&\searrow&\\
\underbrace{R_v}_{\text{seen}}&&\underbrace{R_a}_{\text{heard}}&&\underbrace{R_r}_{\text{radar}}\\
&\searrow&\downarrow&\swarrow&\\
&&\underbrace{R_\ell}_{\text{spoken report}}&&\\
&&\downarrow&&\\
&&\underbrace{R_h}_{\text{archive, 100 yrs later}}&&
\end{array}
$$

These live in five different categories. Asking "are they equal?" is a type error. The right question: **do admissible transitions between them exist, and does their limit predict the next observation?**

The same shape holds for **mathematical data**: a group presented by generators-and-relations, by a Cayley table, by a permutation action, by a matrix representation. Different objects, one group — provided the transitions between presentations are admissible.

</div>

<div class="md">

## 3. Notions of sameness (with real-life examples)

$$
\underbrace{x=y}_{\text{literal}}\ \ 
\underbrace{x\cong y}_{\text{iso}}\ \ 
\underbrace{x\simeq y}_{\text{equiv}}\ \ 
\underbrace{d(x,y)\le\varepsilon}_{\text{approx}}\ \ 
\underbrace{P(D_1,D_2\mid M)\text{ high}}_{\text{statistical}}
$$

Made concrete:

$$
\begin{array}{c|c|c}
\text{Relation} & \text{Sense-data example} & \text{Math example}\\
\hline
x=y & \text{same photon hitting the same rod} & 2+2 = 4\\
x\cong y & \text{two identical coins} & \mathbb Z/6 \cong \mathbb Z/2 \times \mathbb Z/3\\
x\simeq y & \text{lightning + thunder from one strike} & \text{a coffee cup} \simeq \text{a donut}\\
d(x,y)\le\varepsilon & \text{two thermometers reading 20.01 vs 20.02} & \|f_n - f\|_\infty < \varepsilon\\
P(D_1,D_2\mid M)\text{ high} & \text{eyewitness + CCTV both report the car} & \text{two experiments both reject } H_0
\end{array}
$$

In dependent type theory these are *literally different types*: $\mathsf{Id}_A(x,y)$, $\mathsf{Iso}(x,y)$, and, under univalence, $(x =_{\mathcal U} y) \simeq (x \simeq y)$. Silent upgrades between rows are the single most common error in "world model" talk.

$$
\boxed{
\begin{aligned}
&\text{Never silently strengthen}\\
&\text{a weaker sameness into a stronger one.}
\end{aligned}}
$$

</div>

<div class="md">

## 4. Transformation is the missing concept

Given $R_A, R_B$, replace "$R_A = R_B$?" with either a transition $T_{AB}: R_A \to R_B$ or a common target $Z$:

$$
\begin{array}{ccc}
\underbrace{R_A}_{\text{one view}} & \xrightarrow{\;T_A\;} & \underbrace{Z}_{\text{calibrated common space}}\\
&& \uparrow{\scriptstyle T_B}\\
&& \underbrace{R_B}_{\text{another view}}
\end{array}
$$

A coordinate change does not make a new physics; a translation does not make a new event.

$$
\boxed{\text{Difference is informative when we know what produced it.}}
$$

</div>

<div class="md">

## 5. Admissible transitions

For any two finite sets of equal size *some* bijection exists. So "$\exists T$" alone is empty. The content is $\exists T \in \mathcal T$ for a **constrained class** $\mathcal T$: calibrations, coordinate changes, physical laws, sensor responses, validated translations, learned decoders with error bounds.

$$
\underbrace{\mathcal T}_{\text{admissible transitions}} \;\subseteq\; \underbrace{\text{Hom}(R_i, R_j)}_{\text{all maps}}
$$

$$
\boxed{
\begin{aligned}
&\text{More morphism freedom}\\
&\Rightarrow \text{more evidence needed.}
\end{aligned}}
$$

This is simultaneously: a *subcategory* condition, a *Bayesian prior*, and an *Occam penalty* — three presentations of one constraint.

</div>

<div class="md">

## 6. Contexts as a site — including time and culture

Let $\mathcal C$ be a category of **contexts**:

$$
\underbrace{c}_{\in\,\mathcal C} \;=\; (\underbrace{\text{place}}_{\text{where}},\ \underbrace{\text{time}}_{\text{when}},\ \underbrace{\text{observer}}_{\text{who}},\ \underbrace{\text{instrument}}_{\text{how}},\ \underbrace{\text{culture/framework}}_{\text{in what terms}}).
$$

"Space" here is used in the wide sense of the companion chapter *Coherent Difference*: anything that can index data points. Time is a context. Culture is a context. A historical period is a context. A conceptual framework is a context. Morphisms in $\mathcal C$ are **refinements** — narrower windows, tighter instruments, sub-frameworks.

A covering $\{c_i \to c\}$ in a Grothendieck topology $J$ means: the $c_i$ jointly determine $c$ via admissible transitions. Visual + acoustic + radar contexts cover the "train passes" context if their $\mathcal T$-images to a shared calibrated space are jointly surjective on relevant features.

A **representation scheme** is a presheaf

$$
\underbrace{F}_{\text{rep. assignment}} : \underbrace{\mathcal C^{\mathrm{op}}}_{\text{contexts}} \longrightarrow \underbrace{\mathcal V}_{\text{target}}.
$$

$\mathcal V$ can be sets, metric spaces, probability spaces, spectra, or $\infty$-groupoids — depending on how much homotopy is needed.

</div>

<div class="md">

## 7. Sheaves: coherence = descent

$F$ is a **sheaf** on $(\mathcal C, J)$ iff for every cover $\{c_i \to c\}$

$$
\underbrace{F(c)}_{\text{global section}}
\;\xrightarrow{\;\sim\;}\;
\underbrace{\varprojlim\Bigl(\;\prod_i F(c_i)\;\rightrightarrows\;\prod_{i,j} F(c_i \times_c c_j)\;\Bigr)}_{\text{compatible local sections glue uniquely}}.
$$

In plain English: **compatible local representations glue to a unique global one**. Three regimes, one shape:

$$
\begin{array}{c|c|c}
\text{Regime} & \mathcal V & \text{"Compatible" means}\\
\hline
\text{Strict} & \text{Set} & \text{equal on overlaps}\\
\text{Homotopical} & \infty\text{-groupoids} & \text{coherently equivalent}\\
\text{Empirical} & \text{prob. / metric} & \text{small residual under a loss}
\end{array}
$$

The empirical row is not a theorem of sheaf theory; it is the same **shape** — and pretending otherwise is exactly what this chapter warns against.

$$
\boxed{\text{compatible local data} \;\Longrightarrow\; \text{global data.}}
$$

</div>

<div class="md">

## 8. Equalizers: where two maps agree

Given $f, g : X \rightrightarrows Y$, the equalizer selects agreement:

$$
\underbrace{E}_{\text{agreement locus}}
\xrightarrow{\;e\;} X \underset{g}{\overset{f}{\rightrightarrows}} Y,
\qquad
\underbrace{E = \{x : f(x) = g(x)\}}_{\text{in Set}}.
$$

Two thermometers report the temperature; the equalizer is the times at which they agree exactly. (In an $(\infty,1)$-category the equalizer becomes a *space of paths of agreement* — same idea, more room.)

</div>

<div class="md">

## 9. Pullbacks: agreement through a common target

$$
\begin{array}{ccc}
\underbrace{X \times_Z Y}_{\text{pairs that agree in }Z} & \xrightarrow{\;\pi_X\;} & X\\
{\scriptstyle \pi_Y}\downarrow && \downarrow{\scriptstyle f}\\
Y & \xrightarrow{\;g\;} & \underbrace{Z}_{\text{shared calibrated space}}
\end{array}
$$

The pullback *is* the object of agreements. The eye-image and the radar-signal pull back over a calibrated position-space to give the pairs that could be the same train.

</div>

<div class="md">

## 10. Higher coherence

Three channels with pairwise transitions:

$$
A \xrightarrow{\phi_{AB}} B \xrightarrow{\phi_{BC}} C,\qquad A \xrightarrow{\phi_{AC}} C.
$$

- **Strict:** $\phi_{BC} \circ \phi_{AB} = \phi_{AC}$.
- **Homotopical:** a filler $\alpha_{ABC} : \phi_{BC}\phi_{AB} \Rightarrow \phi_{AC}$.
- **Four objects:** a filler between fillers.
- **And so on:** the Čech nerve of the cover, evaluated in $F$.

$$
\underbrace{\text{objects}}_{0} \to \underbrace{\text{morphisms}}_{1} \to \underbrace{2\text{-morphisms}}_{\text{relations of relations}} \to \underbrace{3\text{-morphisms}}_{\text{and so on}} \to \cdots
$$

$$
\boxed{
\begin{aligned}
&\text{Relations can themselves have relations.}\\
&\text{The tower is not decoration.}
\end{aligned}}
$$

An **$\infty$-sheaf** is a sheaf-like object in an $(\infty,1)$-topos: equality on overlaps is replaced by *coherent equivalence*, and coherence itself is data at every level (descent via hypercovers, effective epimorphisms).

*Physical example.* Lightning and thunder from one strike are not *equal* on their time-overlap; they are related by a *homotopy* whose parameter is the travel-time delay. An $\infty$-sheaf handles this exactly.

</div>

<div class="md">

## 11. The observer is part of the diagram

Perception is not a photograph:

$$
\underbrace{\text{stimulus}}_{S}\xrightarrow{\text{sensory}}\underbrace{\text{signal}}_{D}\xrightarrow{\text{inference}}\underbrace{\text{percept}}_{R}.
$$

Different physiologies, attentions, expectations, and languages give different $R$ from related $S$. Systematic distortions are informative *because* they are part of the causal story.

$$
\boxed{
\begin{aligned}
&\text{Do not identify the representation}\\
&\text{with its input when the transformation}\\
&\text{is part of the causal story.}
\end{aligned}}
$$

</div>

<div class="md">

## 12. Anomalies as unintegrated constraints

If $D_1,\dots,D_{99}$ fit model $M$ but $D_{100}$ does not, the options are:

$$
\underbrace{D_{100}\text{ erroneous}}_{\text{channel fault}}\ \ 
\underbrace{M\text{ incomplete}}_{\text{revise model}}\ \ 
\underbrace{\text{observation map misunderstood}}_{\text{revise }O_i}\ \ 
\underbrace{\text{new phenomenon}}_{\text{revise }W}.
$$

$$
\boxed{\text{An anomaly is a constraint not yet integrated.}}
$$

The framework must permit "these data should not be glued" — otherwise it is unfalsifiable.

</div>

<div class="md">

## 13. The global model

Given a cover $\{c_i \to c\}$ and channels $R_i \in F(c_i)$, a **global model** $G$ is:

$$
\underbrace{G \in F(c)}_{\text{global section}}
\qquad \text{with} \qquad
\underbrace{G|_{c_i} \simeq R_i}_{\text{via }T_i \in \mathcal T}.
$$

- **Existence** of $G$ = coherence.
- **Uniqueness** of $G$ = descent.
- **Neither** implies $G = W$.

$$
\boxed{
\begin{aligned}
&G \neq W,\\
&\text{but } G \text{ is how } W \text{ becomes intelligible.}
\end{aligned}}
$$

</div>

<div class="md">

## 14. Approximate descent (empirical data)

Real data are noisy. Replace strict equality on overlaps with a residual:

$$
\underbrace{\mathcal R(G)}_{\text{total residual}}
= \sum_i \underbrace{\mathrm{dist}\bigl(G|_{c_i},\,T_i(R_i)\bigr)}_{\text{local mismatch}},
\qquad
G^\ast = \arg\min_G \mathcal R(G).
$$

Gaussian residual → Bayesian posterior. Zero residual → sheaf descent. Learned $T_i$ → representation learning. Same shape, three targets $\mathcal V$.

</div>

<div class="md">

## 15. Model theory as a second projection

Fix a language $\mathcal L$ and theory $T$. Observations are axioms:

$$
\underbrace{T_D}_{\text{constrained theory}} = T \cup \{O_1,\dots,O_n\},\qquad
\underbrace{\mathrm{Mod}(T_D)}_{\text{category of structures}} = \{M : M \models T_D\}.
$$

Three outcomes:

$$
\underbrace{\varnothing}_{\text{inconsistent}}\ \ 
\underbrace{M_1 \not\cong M_2}_{\text{underdetermined}}\ \ 
\underbrace{\text{one iso class}}_{\text{determined}}.
$$

Underdetermination is not defeat: it names the discriminating observation $O$ with $M_1 \models O$, $M_2 \not\models O$.

$$
\boxed{
\begin{aligned}
&\text{When several coherent models survive,}\\
&\text{find observations that separate them.}
\end{aligned}}
$$

*Warning.* "Model" (Tarskian structure) and "model" (parameterized function in AI) are *different notions*. The bridge — both are presheaves on a suitable site — is a real statement, not a pun.

</div>

<div class="md">

## 16. Where AI actually enters

A neural network is a morphism in a category of **parametric maps** (Para, lenses, optics — pick your formalism). A Transformer layer

$$
\underbrace{H_{\ell+1} = H_\ell + G_\theta(H_\ell)}_{\text{residual update}}
$$

is a morphism with a coalgebra-like residual; multi-head attention

$$
\underbrace{\mathrm{Attn}(Q,K,V) = \mathrm{softmax}\bigl(\tfrac{QK^\top}{\sqrt{d_k}}\bigr)V}_{\text{learned relational mixing}}
$$

is a learned relational structure over positions. None of this makes a network a sheaf. What the framework *does* buy:

- **Embeddings** as functors from a discrete category of tokens to a metric $\mathcal V$.
- **Multimodal alignment** as (partial) descent over a cover by modalities:

$$
\begin{array}{ccc}
\text{image} & \xrightarrow{E_v} & M_{\text{shared}}\\
\text{text} & \xrightarrow{E_l} & M_{\text{shared}}\\
\text{audio} & \xrightarrow{E_a} & M_{\text{shared}}
\end{array}
$$

- **Training** as constraint accumulation: $\theta^\ast = \arg\min_\theta \mathcal L(\theta; D)$ — many overlapping constraints, one parameterized function.
- **Generative models** as posterior integration of heterogeneous partials:

$$
\underbrace{x_1,\dots,x_n}_{\text{data}} \xrightarrow{\text{posterior}} \underbrace{P(z \mid x_1,\dots,x_n)}_{\text{latent integrating them}}.
$$

- **Hallucination** = internal coherence without descent from a grounded cover:

$$
\underbrace{M_{\text{internal}}\text{ coherent}}_{\text{consistent with itself}} \not\Rightarrow \underbrace{M_{\text{internal}} \approx W}_{\text{grounded in the world}}.
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

## 17. Invariants: what survives a change of representation

For $T \in \mathcal T$, ask what is preserved:

$$
\underbrace{\text{causal order}}_{\text{before/after}}\ 
\underbrace{\text{adjacency}}_{\text{who touches whom}}\ 
\underbrace{\text{symmetry action}}_{\text{groups}}\ 
\underbrace{\text{conservation laws}}_{\text{energy, charge}}\ 
\underbrace{\text{stat. dependence}}_{\text{correlations}}\ 
\underbrace{\text{homotopy type}}_{\text{shape up to deformation}}.
$$

$$
\boxed{
\begin{aligned}
&\text{Speak only of what your}\\
&\text{admissible transitions preserve.}
\end{aligned}}
$$

A representation is judged not by whether it *is* the world but by *which structure* of the world it preserves and which it discards.

</div>

<div class="md">

## 18. The hierarchy — never upgrade silently

$$
\underbrace{s_i|_U=s_j|_U}_{\text{strict}}\;\Rightarrow\;
\underbrace{s_i\cong s_j}_{\text{iso}}\;\Rightarrow\;
\underbrace{s_i\simeq s_j}_{\text{homotopy}}\;\Rightarrow\;
\underbrace{d(s_i,s_j)\le\varepsilon}_{\text{approx}}\;\Rightarrow\;
\underbrace{P(D_i,D_j\mid M)\text{ high}}_{\text{stat}}\;\Rightarrow\;
\underbrace{\exists M:M\models T_{\text{all}}}_{\text{model-theoretic}}.
$$

Correlation is not identity. A plausible transformation is not a proof. Consistency is not truth.

</div>

<div class="md">

## 19. The one diagram

$$
\begin{array}{ccccc}
&&\underbrace{W}_{\text{world}}&&\\
&\swarrow&\downarrow&\searrow&\\
\underbrace{R_1}_{\text{view 1}}&&\underbrace{R_2}_{\text{view 2}}&&\underbrace{R_3}_{\text{view 3}}\\
&\searrow{\scriptstyle T_1}&\downarrow{\scriptstyle T_2}&\swarrow{\scriptstyle T_3}&\\
&&\underbrace{G = \varprojlim F}_{\text{coherent global model}}&&\qquad T_i \in \mathcal T
\end{array}
$$

Different mathematics, one shape:

$$
\begin{array}{c|c}
\text{Setting} & G \text{ is}\\
\hline
\text{Strict} & \text{a limit in Set}\\
\text{Homotopical} & \text{a limit in an }(\infty,1)\text{-topos}\\
\text{Model-theoretic} & \text{an object of }\mathrm{Mod}(T_D)\\
\text{Probabilistic} & \text{a posterior mode}\\
\text{ML} & \text{a learned latent making the }R_i\text{ jointly predictable}
\end{array}
$$

Different mathematics; one shape.

</div>

<div class="md">

## 20. What the framework forbids

$$
\boxed{
\begin{aligned}
&\text{1. Silent upgrade of a weak sameness}\\
&\quad\text{to a stronger one.}\\
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

## 21. A practical procedure

Given complicated evidence:

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

## 22. Where each theory lives on one chain

$$
\underbrace{\text{distinction}}_{\text{sets}}\to
\underbrace{\text{relation}}_{\text{graphs, types}}\to
\underbrace{\text{transformation}}_{\text{categories}}\to
\underbrace{\text{locality}}_{\text{topology}}\to
\underbrace{\text{compatibility}}_{\text{sheaves}}\to
\underbrace{\text{coherence}}_{\infty\text{-sheaves, HoTT}}\to
\underbrace{\text{gluing}}_{\text{descent}}\to
\underbrace{\text{globality}}_{\text{model theory, ML}}\to
\underbrace{\text{invariance}}_{\text{what survives }\mathcal T}
$$

$$
\begin{array}{c|c}
\text{Theory} & \text{Where it contributes}\\
\hline
\text{Set / type theory} & \text{distinction, typed sameness}\\
\text{Category theory} & \text{transformation, composition}\\
\text{Topology} & \text{locality without metric}\\
\text{Sheaf theory} & \text{compatibility}\to\text{gluing}\\
\infty\text{-categories, HoTT} & \text{higher coherence}\\
\text{Model theory} & \text{structures satisfying constraints}\\
\text{Probability} & \text{approximate compatibility}\\
\text{Machine learning} & \text{learned }R,\ T,\text{ and }G
\end{array}
$$

No single discipline owns the picture; each refines one term of

$$
\underbrace{W}_{\text{one domain}}\to
\underbrace{\{R_i\}}_{\text{many views}}\to
\underbrace{\{T_{ij}\in\mathcal T\}}_{\text{admissible transitions}}\to
\underbrace{G}_{\text{coherent whole}}.
$$

</div>

<div class="md">

## 23. Perspectival difference is not erased

$$
\boxed{
\begin{aligned}
&\text{Coherence relates perspectives.}\\
&\text{It does not flatten them.}
\end{aligned}}
$$

Two observers, two instruments, two cultures, two centuries: their reports need not coincide to be about one world. What is required is that the differences factor through admissible transitions.

$$
\underbrace{\text{difference}}_{\text{many views}}\ +\ 
\underbrace{\text{constrained }T}_{\text{justified maps}}\ +\ 
\underbrace{\text{coherence}}_{\text{fits on overlaps}}\ \Longrightarrow\ 
\underbrace{G}_{\text{global model}}.
$$

</div>

<div class="md">

## 24. Finite observers, provisional globality

$$
\underbrace{M_1}_{t_1}\xrightarrow{+D_2}\underbrace{M_2}_{t_2}\xrightarrow{+D_3}\underbrace{M_3}_{t_3}\xrightarrow{\cdots}
$$

$$
\boxed{
\begin{aligned}
&M_t\text{ is not "the complete world"}.\\
&M_t\text{ is the best justified coherent}\\
&\text{model available at time }t.
\end{aligned}}
$$

</div>

<div class="md">

## 25. One sentence

$$
\boxed{
\begin{aligned}
&\textbf{A world model is a section of a representation}\\
&\textbf{presheaf that descends along an admissible cover —}\\
&\textbf{provisionally, revisably, and never identical}\\
&\textbf{to the world it represents.}
\end{aligned}}
$$

Everything else — perception, language, physics, model theory, neural networks — is a choice of:

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
