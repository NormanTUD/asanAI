<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: From World to Model: Coherent Representation
description: A mathematically careful, beginner-friendly bridge from world, observation and representation to category theory, sheaves, higher coherence, model theory, and AI.
icon: 🧩
part: 4
order: 22
color: accent
topics: philosophy, math-i, math-ii, category-theory, sheaves, model-theory, ai, epistemology
-->

<div class="md">

How can many different, partial, transformed descriptions belong to one world without being literally identical?

The single guiding diagram of this chapter is:

$$
\boxed{
\begin{array}{c}
\text{world}\\ \downarrow\\ \text{interaction}\\ \downarrow\\ \text{data}\\ \downarrow\\ \text{representation}\\ \downarrow\\ \text{transformation}\\ \downarrow\\ \text{coherent integration}\\ \downarrow\\ \text{model}
\end{array}}
$$

The examples come from perception, science, and AI, but the real subject is more general: **how do finite observers construct a coherent model from partial and differently transformed access to one subject matter?**

The mathematical tools that become relevant include category theory, topology, sheaves, descent, homotopy theory, $\infty$-categories, model theory, probability, and machine learning. Throughout, one discipline matters:

$$
\boxed{\text{a useful analogy is not automatically a theorem.}}
$$

</div>

<div class="md">

## 1. The basic problem

A world $W$ contains some event. We do not receive $W$ itself; some interaction produces data $W\xrightarrow{O_i}D_i$. Different observers or instruments give different observation maps:

$$
W\xrightarrow{O_1}D_1,\quad W\xrightarrow{O_2}D_2,\quad W\xrightarrow{O_3}D_3,
$$

and the resulting datasets need not agree ($D_1\neq D_2$). A camera produces pixels, a microphone a waveform, a radar a signal, a human a perceptual representation and a linguistic report.

The scientific question is not "are these data literally the same?" but:

$$
\underbrace{\exists\, T\in\mathcal{T}:\; D_i \xrightarrow{T} D_j}_{\text{are the differences explained by a justified transformation?}}
$$

</div>

<div class="md">

## 2. One world, many channels — a concrete example

Consider a train passing a person on a platform. A single physical event produces several signal channels:

$$
\begin{array}{ccccc}
&&W\ (\text{train event})&&\\
&\swarrow&\downarrow&\searrow&\\
\text{light field}&&\text{sound field}&&\text{radar interaction}\\
\downarrow_{\text{eye}}&&\downarrow_{\text{ear}}&&\downarrow_{\text{antenna}}\\
\text{visual signal}&&\text{auditory signal}&&\text{measurement signal}\\
&\searrow&\downarrow&\swarrow&\\
&&\text{integrated model}&&
\end{array}
$$

At this level already, the representations are not identical. A visual signal, an acoustic waveform, and a radar measurement are different kinds of data. What makes them potentially informative about the same event is not equality, but the existence of well-understood relations between them.

But the transformation does not stop at the sensor. The same physical information can pass through several additional layers before it becomes a conscious perception, a linguistic report, or a scientific model:

$$
\begin{array}{c}
W\\ \downarrow{\scriptstyle\ \text{physical interaction}}\\ \{\text{light},\text{sound},\text{EM}\}\\ \downarrow{\scriptstyle\ \text{sensor/instrument}}\\ \text{neural / instrumental representation}\\ \downarrow{\scriptstyle\ \text{individual processing}}\\ \text{personal interpretation}\\ \downarrow{\scriptstyle\ \text{linguistic encoding}}\\ \text{linguistic representation}\\ \downarrow{\scriptstyle\ \text{cultural/historical context}}\\ \text{shared scientific or conceptual model}
\end{array}
$$

A mathematically useful way of representing this is to treat the different factors as labeled transformations. For a part of the world $W$, one observation channel is:

$$
W \xrightarrow{P} S \xrightarrow{I} D \xrightarrow{N} R \xrightarrow{L} T \xrightarrow{C} M,
$$

where $P$ is the physical process, $S$ the stimulus, $I$ the instrument interaction, $D$ the datum, $N$ observer processing, $R$ an internal representation, $L$ linguistic encoding, $T$ conceptual interpretation, $C$ contextual embedding, and $M$ the resulting model. These need not be linear; several are coupled or recursive, so a richer picture is a network:

$$
\begin{array}{ccccccc}
&&&W&&&\\
&&\swarrow&\downarrow&\searrow&&\\
&S_1&&S_2&&S_3&\\
&\downarrow{\scriptstyle I_1}&&\downarrow{\scriptstyle I_2}&&\downarrow{\scriptstyle I_3}&\\
D_{\text{vision}}&&D_{\text{audio}}&&D_{\text{radar}}&&\cdots\\
&\searrow{\scriptstyle N_a}&\downarrow{\scriptstyle N_b}&\swarrow{\scriptstyle N_c}&&&\\
&&R_{\text{obs}},\ R_{\text{instr}}&&&&\\
&&\downarrow{\scriptstyle L,C}&&&&\\
&&\text{global model } M&&&&
\end{array}
$$

The observer is not a passive endpoint. For observers $a,b$ we have $N_a:S\to R_a$ and $N_b:S\to R_b$ with $N_a\neq N_b$. This does not imply they have access to different worlds — only that access is mediated by different transformations. The same holds for instruments $I_1:S\to D_1$ and $I_2:S\to D_2$.

**Time as an additional index.** An observation is not just $D$ but $D_t$, with $t\mapsto D_t$. Different observations concern different windows $D_{[t_0,t_1]},\, D_{[t_1,t_2]}$, and overlapping windows relate by restriction $D_{[t_0,t_2]}\to D_{[t_0,t_1]}$. This is structurally close to the locality of sheaf theory. A dynamical transition $\Phi_{t_1,t_0}:X_{t_0}\to X_{t_1}$ relates states over time, so:

$$
\boxed{\text{different time} \neq \text{different underlying system}.}
$$

**Individual neurophysiology as a transformation.** With $R_a=N_a(D)$ and $R_b=N_b(D)$, even similar $D$ gives $R_a\neq R_b$. The categorical point is simple:

$$
\boxed{\text{different representation} \not\Rightarrow \text{different source}.}
$$

**Language as another representation map.** An internal representation $R$ is converted into a linguistic report $L:R\to\Sigma^\ast$ with $L(R)\neq R$. Different languages give $L_A:R\to\Sigma_A^\ast$ and $L_B:R\to\Sigma_B^\ast$, related by translation $\tau_{AB}:\Sigma_A^\ast\to\Sigma_B^\ast$.

**Culture and history as contextual structure.** Context is an index $c\in C$, so reports are $R_{c,t,a}$. Historical shifts are transformations $R_{c_1}\xrightarrow{T_{c_1c_2}} R_{c_2}$ between systems of categorization. The interesting question becomes: which structure survives $T_{c_1c_2}$?

**A context-indexed family.** Observations form a family $D_{a,t,c,i}$ indexed by observer, time, context, and channel:

$$
\begin{array}{ccccc}
&&W&&\\
&\swarrow&\downarrow&\searrow&\\
D_{a,t,c,1}&&D_{a,t,c,2}&&D_{a,t,c,3}\\
\downarrow&&\downarrow&&\downarrow\\
R_{a,t,c,1}&&R_{a,t,c,2}&&R_{a,t,c,3}\\
&\searrow&\downarrow&\swarrow&\\
&&M_{a,t,c}&&
\end{array}
$$

The global model is built not by pretending all representations are identical, but by determining which transformations between them are justified:

$$
\underbrace{W \to \{D_{a,t,c,i}\} \to \{R_{a,t,c,i}\} \to \{M_{a,t,c}\}}_{\text{one domain} \,\to\, \text{many transformations} \,\to\, \text{coherent integration}}.
$$

**The important distinction.** There are three fundamentally different sources of difference:

$$
\boxed{
\begin{array}{l}
\text{world difference: the underlying state actually differs}\\
\text{measurement difference: the observation channel differs}\\
\text{representation difference: the transformation of the data differs}
\end{array}}
$$

plus contextual dimensions: time, observer, instrument, culture, language, conceptual framework. A disagreement between reports therefore does not identify which level is responsible, and the whole task is to locate the discrepancy in one of

$$
W,\quad W\to D,\quad D\to R,\quad R\to L(R),\quad L(R)\to M.
$$

Only then does it make sense to ask whether the observations can be coherently glued. The inverse problem is:

$$
\boxed{\underbrace{\text{many transformed observations}}_{\text{partial, heterogeneous}}\ \longrightarrow\ \underbrace{\text{constraints on a common model}}_{\text{coherent global structure}}.}
$$

</div>

<div class="md">

## 3. Transformation is the missing concept

Given two representations $M_A, M_B$, the naive question "$M_A=M_B$?" is often wrong. Instead, ask for a justified transformation $T_{AB}:M_A\to M_B$, or map both into a common comparison space:

$$
\begin{array}{ccc}
M_A & \xrightarrow{\ T_A\ } & C \\
&& \uparrow{\scriptstyle T_B}\\
&& M_B
\end{array}
$$

A coordinate change does not create a new physical object; a camera's color response does not create a new scene; a translation does not create a new event. The transformation *is* part of the explanation:

$$
\boxed{\text{difference is informative if we know what produced the difference.}}
$$

</div>

<div class="md">

## 4. But an arbitrary transformation proves nothing

For any two finite sets of equal cardinality, some bijection $T:A\to B$ exists. So the claim $\exists T:A\to B$ is weak. The strong claim is $\exists T\in\mathcal{T}$, where $\mathcal T$ is a **constrained class of admissible transformations**: camera calibrations, coordinate changes, physical propagation laws, measured sensor responses, validated translations, statistically justified noise models.

$$
\boxed{\text{coherence needs constrained transitions, not arbitrary rescue maps.}}
$$

</div>

<div class="md">

## 5. Equality is only one notion of sameness

$$
\underbrace{x=y}_{\text{literal}}\ \ \underbrace{x\cong y}_{\text{iso}}\ \ \underbrace{x\simeq y}_{\text{equiv}}\ \ \underbrace{d(x,y)\le\varepsilon}_{\text{approx}}\ \ \underbrace{P(D_1,D_2\mid M)\text{ high}}_{\text{statistical}}
$$

These are not interchangeable. Category theory is useful precisely because it distinguishes them.

</div>

<div class="md">

## 6. Categories: worlds of transformations

A category has objects, morphisms, composition, identities: $A\xrightarrow{f}B\xrightarrow{g}C$ gives $g\circ f:A\to C$. A model pipeline is a composite:

$$
\underbrace{\text{world}}_{A}\xrightarrow{f}\underbrace{\text{sensor data}}_{B}\xrightarrow{g}\underbrace{\text{latent rep.}}_{C}\xrightarrow{h}\underbrace{\text{prediction}}_{D},\qquad h\circ g\circ f:A\to D.
$$

$$
\boxed{\text{category theory studies structured transformations and how they compose.}}
$$

</div>

<div class="md">

## 7. Locality

A topological space $X$ has open sets — think "regions of applicability." A cover $U=\bigcup_i U_i$ raises the question: **when do local descriptions on each $U_i$ come from one coherent description on $U$?** This is what sheaf theory formalizes.

</div>

<div class="md">

## 8. Sheaves: local data that can be glued

A presheaf $\mathcal F$ assigns data $\mathcal F(U)$ to each $U$ with restrictions $\rho_{UV}:\mathcal F(U)\to\mathcal F(V)$ for $V\subseteq U$. A **sheaf** additionally satisfies gluing: given local sections $s_i\in\mathcal F(U_i)$ agreeing on overlaps,

$$
s_i|_{U_i\cap U_j}=s_j|_{U_i\cap U_j},
$$

there exists a unique global $s\in\mathcal F(U)$ with $s|_{U_i}=s_i$. In one line:

$$
\boxed{\text{compatible local data} \Longrightarrow \text{global data}.}
$$

</div>

<div class="md">

## 9. Why ordinary equality can be too strict

Coordinate descriptions can be related by isomorphism; geometric objects by homotopy equivalence; paths by homotopies of their own. So the ordinary $s_i|_V=s_j|_V$ is often replaced by $s_i|_V\simeq s_j|_V$. An **$\infty$-sheaf** is not merely a sheaf with equalities replaced by paths — it is a sheaf-like object valued in an $\infty$-category where descent uses homotopy-coherent structure.

</div>

<div class="md">

## 10. Equalizers

Given parallel maps $f,g:X\rightrightarrows Y$, the equalizer $e:E\to X$ satisfies $f\circ e=g\circ e$ universally. In $\mathbf{Set}$, $E=\{x\in X\mid f(x)=g(x)\}$ — the part of the domain on which two maps agree. An equalizer is not a "path between values"; it selects agreement.

</div>

<div class="md">

## 11. Pullbacks: compatibility through a common target

$$
\begin{array}{ccc}
X\times_Z Y & \xrightarrow{\ \pi_X\ } & X\\
{\scriptstyle \pi_Y}\downarrow && \downarrow{\scriptstyle f}\\
Y & \xrightarrow{\ g\ } & Z
\end{array}\qquad \underbrace{X\times_Z Y = \{(x,y): f(x)=g(y)\}}_{\text{two representations, agreeing after sending them into a shared space}}
$$

For empirical modeling, $Z$ might be a calibrated measurement space or a shared latent representation.

</div>

<div class="md">

## 12. Higher coherence

For three representations with comparison maps

$$
A\xrightarrow{\phi_{AB}} B\xrightarrow{\phi_{BC}} C,\qquad A\xrightarrow{\phi_{AC}} C,
$$

strict coherence needs $\phi_{BC}\circ\phi_{AB}=\phi_{AC}$; homotopical coherence needs $\phi_{BC}\circ\phi_{AB}\simeq\phi_{AC}$, and the equivalence between these maps is itself structure. With more objects, those structures satisfy their own compatibility conditions:

$$
\text{objects}\to\text{morphisms}\to 2\text{-morphisms}\to 3\text{-morphisms}\to\cdots
$$

$$
\boxed{\text{relations can themselves have relations.}}
$$

</div>

<div class="md">

## 13. The observation chain

$$
\underbrace{W}_{\text{world}}\xrightarrow{p}\underbrace{S}_{\text{stimulus}}\xrightarrow{q}\underbrace{N}_{\text{processing}}\xrightarrow{r}\underbrace{P}_{\text{internal rep.}}\xrightarrow{t}\underbrace{R}_{\text{report}}
$$

Two observers may produce different $R_A, R_B$ from the same $W$ because differences may arise at any stage. A report is the *endpoint* of a transformation pipeline, not a transparent copy.

</div>

<div class="md">

## 14. Perception is a transformation, not a photograph

$$
\text{stimulus}\xrightarrow{\text{sensory}} \text{signal}\xrightarrow{\text{inference}} \text{percept}
$$

Different physiologies, attention, expectations, and contexts produce different percepts from related stimuli. Systematic distortions are informative because they are part of the causal story:

$$
\boxed{\text{do not treat the representation as identical to its input when the transformation is part of the causal story.}}
$$

</div>

<div class="md">

## 15. Anomalous reports as a modeling example

For an extraordinary report, separate: (1) the physical stimulus, if any; (2) the data actually entering the observer; (3) transformations before the report; (4) categories shaping the report; (5) independent corroboration; (6) relations to other data via justified transformations; (7) a global model. This avoids both "the report is extraordinary, therefore its extraordinary interpretation is true" and "the interpretation is unusual, therefore nothing interesting happened."

$$
\boxed{\text{separate datum, transformation, interpretation, explanation.}}
$$

</div>

<div class="md">

## 16. Anomaly does not mean failure

If $D_1,\ldots,D_{99}\leadsto M$ but $D_{100}$ does not fit, options include: $D_{100}$ is erroneous; $M$ is incomplete; the observation map is misunderstood; a new phenomenon is present.

$$
\boxed{\text{an anomaly is a constraint not yet integrated.}}
$$

</div>

<div class="md">

## 17. The common-domain hypothesis

The whole framework assumes: many observations relate because they arise within one sufficiently connected causal domain. Failure to glue is informative — the framework must permit $\boxed{\text{these data should not be glued.}}$

</div>

<div class="md">

## 18. Time and culture are also context

Context can be indexed as $C=(\text{place},\text{time},\text{observer},\text{instrument},\text{culture},\ldots)$. Instead of asking whether words match across periods, ask **what structure changes** and **what remains invariant**.

</div>

<div class="md">

## 19. Invariants

Given $A\xrightarrow{T}B$, what survives? Causal ordering, adjacency, symmetry, connectivity, statistical dependence, conservation laws, geometric relations.

$$
\boxed{\text{What survives a legitimate change of representation?}}
$$

</div>

<div class="md">

## 20. Model theory: from data to possible worlds

For a language $\mathcal L$ and theory $T$, a structure $M$ satisfies $T$ when $M\models T$. Observations add constraints: $T_{\text{data}}=T\cup\{O_1,\ldots,O_n\}$. Candidate models must satisfy $M\models T_{\text{data}}$.

$$
\boxed{\text{consistency constrains models; it does not identify reality.}}
$$

</div>

<div class="md">

## 21. Underdetermination

If $M_1\models T$ and $M_2\models T$ with $M_1\neq M_2$, the constraints do not distinguish them. The response is not arbitrary choice, but discriminating observation $O$ with $M_1\models O$ and $M_2\not\models O$.

$$
\boxed{\text{when several coherent models survive, look for observations that separate them.}}
$$

</div>

<div class="md">

## 22. Interpretations between models

A map $M\to N$ may preserve some structure while discarding other information — exactly what happens throughout science and AI. A physical simulation preserves some physical relations; a diagram preserves some geometric relations; a language description preserves some semantic relations; an embedding preserves some statistical or relational structure. The correct question is not "is this representation the world?" but:

$$
\boxed{\text{which structure of the world does this representation preserve, and what does it discard?}}
$$

</div>

<div class="md">

## 23. Approximate gluing for empirical data

Real data are noisy. Exact $s_i|_U=s_j|_U$ is unrealistic, so we use $d(s_i|_U,s_j|_U)\le\varepsilon$, a likelihood $P(D_1,\ldots,D_n\mid M)$, or an objective $M^\ast=\arg\min_M L(M;D_1,\ldots,D_n)$. These are not sheaf theory, but empirical analogues.

$$
\boxed{\text{sheaf gluing is exact math; statistical integration is a related strategy.}}
$$

</div>

<div class="md">

## 24. From sheaf theory to AI

A neural network is $x\xrightarrow{f_1}h_1\xrightarrow{f_2}h_2\to\cdots\xrightarrow{f_n}y$, each $h_i$ a representation after another transformation. For a Transformer:

$$
\text{tokens}\xrightarrow{\text{embed}}\text{embeddings}\xrightarrow{\text{attn+MLP}}\text{contextual reps}\xrightarrow{\text{unembed}}\text{logits}\xrightarrow{\text{softmax}}\text{probs}.
$$

Categorical intuition asks: what are the objects, morphisms, invariants, and what is discarded? But the architecture is not literally a sheaf.

</div>

<div class="md">

## 25. Embeddings

$E:V\to\mathbb R^d$ turns discrete symbols into geometric points. Distances, directions, and neighborhoods encode statistical regularities.

$$
\underbrace{\text{discrete symbols}}_{V} \xrightarrow{\ E\ } \underbrace{\text{geometric representation}}_{\mathbb R^d}
$$

$$
\boxed{\text{which relations among the symbols become represented geometrically?}}
$$

</div>

<div class="md">

## 26. Attention as learned relational structure

For hidden states $H$, self-attention uses $Q=HW_Q,\ K=HW_K,\ V=HW_V$, and computes

$$\mathrm{Attention}(Q,K,V) \;=\; \mathrm{softmax}\!\Big(\tfrac{QK^\top}{\sqrt{d_k}}\Big)V.
$$

The matrix $QK^\top$ contains learned compatibility scores between positions:

$$
\underbrace{QK^\top}_{\text{who attends to whom}} \xrightarrow{\ \text{softmax}\ } \underbrace{A}_{\text{relational weights}} \xrightarrow{\ \cdot V\ } \underbrace{\text{context-mixed representation}}_{\text{new }H}.
$$

$$
\boxed{\text{attention constructs context-dependent relations among representations.}}
$$

Structurally interesting, but attention weights are not semantic truth values and attention is not a categorical morphism in any technical sense. Analogy $\neq$ definition.

</div>

<div class="md">

## 27. Residual streams and composition

A Transformer layer is schematically $H_{\ell+1} = H_\ell + G_\ell(H_\ell)$, i.e.

$$
\underbrace{H_\ell}_{\text{prior representation}} \xrightarrow{\ +\,G_\ell\ } \underbrace{H_{\ell+1}}_{\text{updated representation}}.
$$

Residuals preserve access to earlier representations. Calling this "gluing" is a metaphor unless one specifies a topology and a sheaf; the correct statement is that the network composes parameterized functions with additive skip connections.

$$
\boxed{\text{many transformations can contribute to one coherent computational state.}}
$$

</div>

<div class="md">

## 28. Multimodal AI

$$
\begin{array}{ccc}
\text{image} & \xrightarrow{E_v} & M_{\text{vision}} \\
\text{text} & \xrightarrow{E_l} & M_{\text{language}} \\
\text{audio} & \xrightarrow{E_a} & M_{\text{audio}}
\end{array}
\qquad
\begin{array}{c}
M_{\text{vision}}\\ \searrow\\ M_{\text{shared}}\\ \nearrow\\ M_{\text{language}}
\end{array}
$$

The goal is not to erase modality-specific structure but to create enough shared structure that the modalities constrain one another — the general idea of **coherent difference**.

</div>

<div class="md">

## 29. Hallucination as a coherence problem

An AI can generate an internally coherent answer without adequate external constraint:

$$
D \xrightarrow{\ \text{model}\ } M_{\text{internal}} \quad\text{with}\quad \underbrace{M_{\text{internal}} \not\approx W}_{\text{coherent but ungrounded}}.
$$

$$
\boxed{\text{internal coherence} \neq \text{external validity}.}
$$

Reliable AI needs both internal consistency and external grounding — which is exactly what the sheaf/model-theoretic lens asks: which transitions connect internal state to independently constrained data?

</div>

<div class="md">

## 30. Training as constraint accumulation

A network learns parameters by

$$
\theta^\ast \;=\; \arg\min_\theta\, \mathcal L(\theta;D).
$$

$$
\underbrace{\text{many examples}}_{D} \xrightarrow{\ \nabla\mathcal L\ } \underbrace{\text{many constraints}}_{\text{on }\theta} \xrightarrow{\ \text{optim}\ } \underbrace{\text{one parameterized function}}_{f_{\theta^\ast}}.
$$

This resembles local-to-global integration but is optimization, not sheaf descent. The analogy is useful because it directs attention to overlapping constraints, invariants, generalization, and residuals.

</div>

<div class="md">

## 31. Generative models

With latent $z$ and observation $x$:

$$
\underbrace{z}_{\text{latent}} \xrightarrow{\ \text{decoder}\ } \underbrace{x}_{\text{observed}}, \qquad \underbrace{x_1,\ldots,x_n}_{\text{data}} \xrightarrow{\ \text{posterior}\ } \underbrace{P(z\mid x_1,\ldots,x_n)}_{\text{integrating latent hypothesis}}.
$$

$$
\boxed{\text{heterogeneous partial observations} \longrightarrow \text{latent structure that integrates them.}}
$$

Not sheaf theory — probabilistic inference — but the same structural silhouette.

</div>

<div class="md">

## 32. A hierarchy of compatibility

$$
\underbrace{s_i|_U=s_j|_U}_{\text{strict}} \ \Rightarrow\ \underbrace{s_i\cong s_j}_{\text{iso}} \ \Rightarrow\ \underbrace{s_i\simeq s_j}_{\text{homotopy}} \ \Rightarrow\ \underbrace{d(s_i,s_j)\le\varepsilon}_{\text{approx}} \ \Rightarrow\ \underbrace{P(D_i,D_j\mid M)\text{ high}}_{\text{stat}} \ \Rightarrow\ \underbrace{\exists M:M\models T_{\text{all}}}_{\text{model-theoretic}}.
$$

$$
\boxed{\text{never silently upgrade a weak relation into a stronger one.}}
$$

Correlation is not identity. A plausible transformation is not proof. Consistency is not truth. Equivalence is not literal equality.

</div>

<div class="md">

## 33. What a global model should accomplish

A good integrated model should (1) explain many independent observations, (2) use constrained transitions, (3) preserve known structural relations, (4) represent uncertainty, (5) expose assumptions, (6) tolerate noise without explaining everything away, (7) predict, (8) be falsifiable, (9) be comparable to alternatives, (10) preserve anomalies.

$$
\boxed{\text{global model} \;=\; \text{integration} + \text{constraints} + \text{predictive power} + \text{epistemic humility}.}
$$

</div>

<div class="md">

## 34. The danger of unlimited flexibility

If the admissible transformation class is $\mathcal T=\{\text{almost every map}\}$, then $\exists T\in\mathcal T$ has no discriminating power. A serious framework must make the transition structure *costly to invent*:

$$
\boxed{\text{more transformation freedom} \Longrightarrow \text{more evidence needed}.}
$$

This connects to model selection, Bayesian priors, complexity penalties, and Occam-style reasoning.

</div>

<div class="md">

## 35. The world is not the model

$$
\underbrace{W}_{\text{world}} \xrightarrow{\ \text{represent}\ } \underbrace{M}_{\text{model}}, \qquad M\neq W.
$$

Different models represent the same domain: $M_{\text{physics}},\ M_{\text{perception}},\ M_{\text{language}},\ M_{\text{economics}},\ M_{\text{AI}}$. No contradiction — the question is:

$$
\boxed{\text{how are the models related, and what do they preserve?}}
$$

</div>

<div class="md">

## 36. Finite observers and provisional globality

A finite observer cannot access every variable; a global model is always relative to available information:

$$
\underbrace{M_1 \xrightarrow{\ +D_2\ } M_2 \xrightarrow{\ +D_3\ } M_3 \xrightarrow{\ \cdots\ }}_{\text{revision as data arrive}}
$$

We should not demand $M=\text{complete reality}$; we should demand $M_t=$ *the best justified coherent model available at time $t$*.

</div>

<div class="md">

## 37. A practical algorithm for world-model building

Given complicated evidence:

1. record the raw datum $D$; 2. separate interpretation $I(D)$; 3. draw the chain $W\to D\to I$; 4. identify overlaps; 5. specify transition maps; 6. constrain them (why admissible?); 7. test which compatibility holds ($=,\cong,\simeq,\approx$, statistical); 8. search for global models; 9. preserve residuals; 10. seek discriminating evidence.

</div>

<div class="md">

## 38. A formal template

Let $\mathcal C$ be a category of contexts and $F:\mathcal C^{op}\to\mathcal V$. For $u:V\to U$, get restriction $F(u):F(U)\to F(V)$. Local sections $s_i\in F(U_i)$; ask when $\{s_i\}$ is compatible and glues to a global section.

$$
\underbrace{F(U_i)}_{\text{local}} \xrightarrow{\ F(u_{ij})\ } \underbrace{F(U_i\cap U_j)}_{\text{overlap}} \xleftarrow{\ F(u_{ji})\ } \underbrace{F(U_j)}_{\text{local}}
$$

Ordinary sheaf: equality on overlaps. Homotopy-valued: coherent equivalences. Empirical: error metric, likelihood, or loss.

</div>

<div class="md">

## 39. A model-theoretic template

With language $\mathcal L$ and theory $T$, add observations to get $T_D=T\cup\{O_1,\ldots,O_n\}$ and ask for models $M\models T_D$. Three outcomes:

$$
\underbrace{\nexists\,M:M\models T_D}_{\text{inconsistent}}, \qquad \underbrace{M_1,M_2\models T_D,\ M_1\neq M_2}_{\text{underdetermined}}, \qquad \underbrace{\text{narrow class of }M}_{\text{empirical discrimination needed}}.
$$

</div>

<div class="md">

## 40. The same pattern across mathematics and AI

$$
\boxed{
\begin{array}{c}
\text{distinction}\\ \downarrow\\ \text{relation}\\ \downarrow\\ \text{transformation}\\ \downarrow\\ \text{context / locality}\\ \downarrow\\ \text{compatibility}\\ \downarrow\\ \text{coherence}\\ \downarrow\\ \text{gluing / integration}\\ \downarrow\\ \text{global model}\\ \downarrow\\ \text{invariant / prediction}
\end{array}}
$$

Different theories occupy different parts of this chain:

$$
\begin{array}{c|c}
\text{Theory} & \text{Main contribution}\\
\hline
\text{Set theory} & \text{distinction}\\
\text{Type theory} & \text{structured objects and transformations}\\
\text{Category theory} & \text{morphisms and composition}\\
\text{Topology} & \text{locality}\\
\text{Sheaf theory} & \text{local-to-global gluing}\\
\text{Homotopy theory} & \text{equivalence and deformation}\\
\infty\text{-categories} & \text{higher coherence}\\
\text{Model theory} & \text{structures satisfying constraints}\\
\text{Probability} & \text{uncertain compatibility}\\
\text{Machine learning} & \text{learned representations and transformations}
\end{array}
$$

Not one hidden theory — different languages for related structural problems.

</div>

<div class="md">

## 41. The deepest connection to AI

$$
\boxed{
\begin{array}{c}
\text{input}\\ \downarrow\\ \text{representation}\\ \downarrow\\ \text{transformation}\\ \downarrow\\ \text{integration}\\ \downarrow\\ \text{prediction / action}
\end{array}}
$$

Ask: what does the representation preserve; what does it forget; which transformations connect different representations; which relations remain invariant; how are conflicts handled; how are modalities integrated; which internal structures are grounded externally; what happens outside the training distribution? A bridge from elementary category theory to modern AI without pretending a neural network is literally a categorical construction.

</div>

<div class="md">

## 42. The central epistemic distinction

$$
\boxed{\underbrace{D}_{\text{data}} \;\neq\; \underbrace{R(D)}_{\text{representation}} \;\neq\; \underbrace{M(R(D))}_{\text{model}}.}
$$

Data are produced by observation. Representations are transformations of data. Models organize representations and predict. The transitions between these levels are part of the causal and mathematical explanation, not philosophical decoration.

</div>

<div class="md">

## 43. The final picture

$$
\begin{array}{ccccc}
&&W&&\\
&\swarrow&\downarrow&\searrow&\\
D_A&&D_B&&D_C\\
\downarrow{\scriptstyle N_A}&&\downarrow{\scriptstyle N_B}&&\downarrow{\scriptstyle N_C}\\
M_A&\xrightarrow{T_{AB}}&M_B&\xleftarrow{T_{CB}}&M_C\\
&\searrow&\downarrow&\swarrow&\\
&&\underbrace{G}_{\text{global model}}&&
\end{array}
$$

The goal is not $M_A=M_B=M_C$. The goal is to determine whether differences can be related by justified transformations so the resulting structure participates in a coherent $G$. Strict setting: equality on overlaps. Categorical: universal constructions. Homotopical: equivalences and higher coherence. Model-theoretic: structures satisfying all constraints. Probabilistic: joint likelihood. ML: representations making heterogeneous observations jointly predictive.

Different mathematics. Same broad problem.

</div>

<div class="md">

## 44. One sentence to remember

$$
\boxed{\textbf{A coherent world model does not erase perspectival difference; it explains how different perspectives are related.}}
$$

More formally:

$$
\boxed{\underbrace{\text{difference}}_{\text{many views}} + \underbrace{\text{constrained transformation}}_{\text{justified maps}} + \underbrace{\text{coherence}}_{\text{fits together}} \Longrightarrow \underbrace{\text{integrated structure}}_{\text{global model}}.}
$$

And the safeguard:

$$
\boxed{\text{coherence is evidence for a model's structural adequacy, not a proof that the model is true.}}
$$

That distinction is what keeps the same framework useful for mathematics, science, perception, model theory, and AI without turning it into an unfalsifiable metaphor.

</div>

<div class="md">

## 45. Coda: what remains when representations change

If we strip away every specific formalism — categories, sheaves, $\infty$-groupoids, models, probability distributions, neural networks — what remains is a single working principle:

$$
\boxed{
\underbrace{W}_{\text{one domain}}
\ \longrightarrow\ 
\underbrace{\{R_i\}}_{\text{many representations}}
\ \longrightarrow\ 
\underbrace{\{T_{ij}\}}_{\text{justified transformations}}
\ \longrightarrow\ 
\underbrace{G}_{\text{coherent global structure}}.
}
$$

Everything in this chapter has been a way of making one of the four terms more precise:

$$
\begin{array}{c|c}
\text{Refining } W & \text{ontology, physics, causal structure}\\
\text{Refining } R_i & \text{perception, measurement, embeddings, language}\\
\text{Refining } T_{ij} & \text{category theory, sheaves, homotopy, translation}\\
\text{Refining } G & \text{model theory, probability, integrated learning}
\end{array}
$$

No single discipline owns the whole picture. Each supplies vocabulary for a different part of the same underlying problem.

</div>

<div class="md">

## 46. Closing summary

Three sentences suffice.

**First**, the world reaches us only through transformations, so different representations of one situation are the rule, not the exception:

$$
W \xrightarrow{\ O_i\ } D_i \xrightarrow{\ N_i\ } R_i.
$$

**Second**, coherence is possible when the differences among representations are explained by *constrained* transformations, not arbitrary rescue maps:

$$
\underbrace{\exists\, T_{ij}\in\mathcal T}_{\text{justified, not invented}}\ :\ R_i \to R_j.
$$

**Third**, an integrated model is a structure through which those constrained transformations become mutually compatible — provisionally, revisably, and without pretending that the model is the world:

$$
\boxed{
\underbrace{G}_{\text{model}}
\ \not=\ 
\underbrace{W}_{\text{world}},
\qquad
\text{but}
\qquad
\underbrace{G}_{\text{model}}
\ \text{is how }W\text{ becomes intelligible to a finite observer.}
}
$$

That is the whole idea of coherent representation.

</div>
