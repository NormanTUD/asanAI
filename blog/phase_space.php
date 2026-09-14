<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: A Geometric and Topological Theory of Meaningful Language Spaces
description: The space of every possible utterance, the clusters and voids inside it, and the hierarchical structure and absence that geometry and topology may make precise.
icon: 🌌
part: 4
order: 4
color: accent
topics: geometry, math-iii, philosophy, language, frontier
-->

<div class="md">
## The question, and the object that answers it

Type a few random characters — `xq7z`, `aaaaaa`, `blorp blorp` — and you know at once that they are not language. They are strings, perfectly valid ones, but they carry no meaning. Now do the reverse: type a real sentence and you feel meaning *land*. The unsettling fact is that there is no bright line you can point to between the two. Almost every string that *could* exist is meaningless, and the meaningful ones are a vanishingly small part of the whole.

So the question this chapter pursues is a geometric one: **what is the shape of the part of the space of all possible utterances that actually supports structured, meaningful language?**

The object to begin with is *not* a model's output, and *not* the language anyone has ever spoken. It is a static, enormous space holding every possible linguistic object up to some length. This is a **conceptual research program**, not an established theory: where a statement is a guess rather than a result, it is flagged **[HYPOTHESIS]**, **[SPECULATION]**, or **[RESEARCH QUESTION]**.

**The tour.**

1. **The space** — $X_N$, everything that could be said, up to length $N$.
2. **Meaning as a field** — not a hard subset, but several overlapping "coherence" fields and their complements, the *voids*.
3. **The cosmic web** — clusters, filaments, walls, voids; and the conjecture that they are *hierarchical*.
4. **Voids are structured too** — voids of voids, and several distinct kinds.
5. **The tools** — geometry, topology (persistent homology), and scaling.
6. **The three spaces** — form $X$, meaning $S$, world $W$.
7. **Evidence, the research program, and the deepest hypothesis.**

$$
\boxed{
\begin{aligned}
&\text{Meaning is not a label stuck on a string.}\\
&\text{It may be a stable relational organization of a vast possibility space —}\\
&\text{with clusters, filaments, boundaries, holes, and voids, organized across scales.}
\end{aligned}
}
$$
</div>

<div class="md">
## 1. The space of all possible discourse

Let $V$ be an alphabet, vocabulary, or token set, and let $N$ be a maximum length. The **total possibility space** is

$$
X_N \;=\; \bigcup_{n=1}^{N} V^{n},
$$

every string of length $1,2,\dots,N$, all at once. Both $\texttt{a}$ and $\texttt{aaaaaaaaaaaaaaaa}$ are points of it, as is "The thought drinks the square Tuesday," as is pure gibberish. Nothing in the definition privileges meaning, grammar, or likelihood. It is a **space of possibilities**, not a space of observed language.

The size is the first thing to absorb. Since $|V^{n}| = |V|^{n}$, the count grows *exponentially* with length. For a vocabulary of $|V| = 10{,}000$, the number of possible $100$-token strings is $10{,}000^{100} = 10^{400}$ — a $1$ followed by four hundred zeros, some three hundred orders of magnitude past the atoms in the observable universe. And the overwhelming majority of those points will never take part in any structured discourse.

That is exactly what makes the question interesting:

$$
\boxed{
\text{What is the geometry and topology of the small part of } X_N \text{ that supports structured, meaningful language?}
}
$$
</div>

<div class="md">
## 2. Meaning is a field, not a hard subset

The naive move is to carve out a subset $M \subset X_N$ of "the meaningful strings." Conceptually fine — but too crude. Meaningfulness is not binary. A string can be syntactically well formed but semantically anomalous; interpretable but false; internally coherent yet disconnected from the world; ambiguous; metaphorical; meaningful only in a particular context.

So instead of a subset, use a *field* — a number on every point. The simplest is a single coherence score $\rho : X_N \to [0,1]$. But one scalar is probably not enough. A richer description assigns several fields at once:

$$
C(x) = \text{syntactic coherence}, \qquad
S(x) = \text{semantic coherence},
$$
$$
G(x) = \text{grounding / world-coupling}, \qquad
E(x) = \text{epistemic determination}.
$$

Each says a different thing about how "there" the point is, along a different axis. Now take the *complements* — how far the point is from full structure, on each axis:

$$
\boxed{
V(x) \;=\; \bigl(1-C(x),\; 1-S(x),\; 1-G(x),\; 1-E(x)\bigr).
}
$$

This **void vector** is the central object of the next few sections. Its purpose is not to claim that these four quantities are *the* right ones, but to make explicit that "void" can mean several different things at once — and that they need not line up.
</div>

<div class="md">
## 3. The cosmic-web intuition

A picture to hold onto is the **cosmic web**. Look at the universe at large scale and matter is not smeared uniformly: it forms clusters, threads (filaments), sheets (walls), and enormous underdense **voids** in between. The analogy is *not* literal — language is not a gravitational matter distribution. What we borrow is the *shape* of a sparse, structured distribution: a little stuff, arranged, in a lot of emptiness.

<figure style="max-width:760px; margin:1.5em auto; text-align:center;">
	<img src="cosmic_web.jpg" alt="The cosmic web: bright filaments and nodes of galaxies and dark matter threading through vast dark voids" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption class="md">A slice of the **cosmic web** — the large-scale structure of the universe: filaments and nodes of galaxies and dark matter, and the vast underdense voids between them. The shape we are borrowing, not the substance. \cite[Image: Structure of the Universe]{cosmic_web_image}</figcaption>
</figure>

Schematically, the linguistic possibility space might look like this — bright structure on a dark ground:

```text
VOID VOID VOID VOID VOID VOID

       ████
      ██████
     ███████
       │
       └────────────
                    ███
                  ███████
                    │
          █████████████
         ███████████████

VOID VOID VOID VOID VOID
```

The central conjecture is that the meaningful part of the space is not a bag of isolated islands. It may form a **hierarchy**:

$$
\boxed{
\text{point} \;\to\; \text{cluster} \;\to\; \text{cluster of clusters} \;\to\; \text{cluster of clusters of clusters} \;\to\; \cdots
}
$$

That is the notion of **hierarchical self-similarity** — the spine of the whole program.
</div>

<div class="md">
## 4. Hierarchical self-similarity

Use the word "fractal" carefully. The claim is *not* that language has exact mathematical self-similarity. It may instead have **statistical or multifractal self-similarity**.

Let $\mathcal{S}(r)$ denote the structural organization of language at scale $r$. A weak form of scale similarity is

$$
\mathcal{S}(r) \;\sim\; \mathcal{S}(\lambda r),
$$

where $\sim$ means *statistical or structural* similarity, not equality. The same *kind* of object can recur at different scales — point, cluster, cluster of clusters — while its detailed contents change. That is far more plausible than exact geometric self-similarity, and it is closer to how fractal ideas are actually used in complex systems.

And the hierarchy need not stop at the usual linguistic units (token → phrase → sentence → paragraph → discourse → document). More generally, structures can themselves become objects at the next level:

$$
A_{1} \;\to\; A_{2} \;\to\; A_{3} \;\to\; \cdots,
$$

where $A_{k+1}$ is not just a bigger pile of $A_k$, but a *structure whose elements are lower-level structures*. Two principles follow.

**Composition is not concatenation.** Putting two structures together creates *new relations* between them:

$$
A + B \;\longrightarrow\; C(A,B),
$$

where $C(A,B)$ carries relations that were present in neither $A$ nor $B$ alone. "DOG" + "RUN" can become the relational structure $\operatorname{AGENT}(\text{DOG},\,\text{RUN})$ — an agent–action relation that neither word carried on its own.

<div class="optional md" data-headline="The two principles (for the curious)">
Two rules do the work. The **recursive principle**: *structures are built from structures*. And the **compositional principle**: $A+B \to C(A,B)$, where the composite carries new relations. For language the crucial point is that composition does not merely concatenate points — it *creates relations*. A proof, a conversation, a poem: at each level the objects of the level below become the components of the level above.
</div>
</div>

<div class="md">
## 5. The voids are structured too

This is one of the central ideas: **a void is not "an area with few points."** A region can be dense with points and still be a semantic void, if the *right relations* are missing.

$$
\boxed{
\text{void} \;=\; \text{absence of a particular kind of structure, at a particular scale}.
}
$$

Consider "The thought drinks the square Tuesday." It has real syntactic structure — a subject, a verb, an object, a time. But it fails to settle into a stable ordinary interpretation. So

$$
\text{high syntactic structure} \;\not\Rightarrow\; \text{high semantic structure}.
$$

Voids can themselves be hierarchical — a nesting

$$
V_{0} \;\supset\; V_{1} \;\supset\; V_{2} \;\supset\; V_{3} \;\supset\; \cdots,
$$

conceptual rather than literal set-inclusion:

$$
\boxed{
\text{void} \;\to\; \text{void structure} \;\to\; \text{voids within voids}.
}
$$

And "void" splits into **four distinct kinds**, one per coherence field.

- **Syntactic void.** Not enough internal syntactic organization. "asdf qwer seven blue because table tomorrow." Here $C(x) \approx 0$. The most straightforward kind of void.
- **Semantic void.** Syntactically structured, but no stable semantic interpretation. "The thought drinks the square Tuesday." $C(x) \approx 1$ while $S(x) \ll 1$. Not empty in the geometric sense — substantial local structure, wrong higher-order relations.
- **Grounding void.** Internally coherent and semantically well specified, but no connection to the external world. $C(x)\approx 1,\; S(x)\approx 1,\; G(x)\approx 0$. A purely formal system is the limiting case: perfectly well-defined relations, symbols not interpreted as objects in the world.
- **Epistemic void.** A determinate meaning whose truth is not known. $S(x)\approx 1$ does *not* force $E(x)\approx 1$. A proposition can be meaningful and yet unresolved.
</div>

<div class="md">
## 6. The voids overlap

The four void fields can overlap, so the geometry is better drawn as a multidimensional field

$$
V(x) \;=\; \bigl(V_{\mathrm{syn}},\; V_{\mathrm{sem}},\; V_{\mathrm{ground}},\; V_{\mathrm{epi}}\bigr).
$$

A single point can be syntactically coherent, semantically coherent, weakly grounded, and epistemically unresolved — all at once. Or the opposite: incoherent on every axis. This yields a crucial insight:

$$
\boxed{
\text{the same geometric region can be a void with respect to one structure and a dense region with respect to another.}
}
$$

And the *deepest* void — the region that fails to participate in *any* strong structure — is not a single empty room. By raw combinatorics it is the overwhelming majority of $X_N$. **[HYPOTHESIS]** It is not homogeneous: it may be a *landscape* — completely unstructured void, syntactically structured but semantically empty regions, semantically structured but ungrounded regions, boundaries between semantic regions, and filaments through which distant regions become related. "The void" is a place with a map, not a blank.
</div>

<div class="md">
## 7. Boundaries may be more informative than interiors

Now move slowly across a short family of sentences and watch the structure degrade:

> The dog sleeps.
> The dog sleeps quickly.
> The dog sleeps quadratically.
> The dog quadratically seven.

At some point a *small* change in the string produces a *qualitative* change in structure. That suggests an important object: the **boundary** of a meaningful region,

$$
\partial M,
$$

the place where coherence changes rapidly.

<div class="optional md" data-headline="[HYPOTHESIS] The boundary (for the curious)">
The boundary between coherent and incoherent regions may carry *more* information about semantic organization than the interior of either. A **semantic phase transition** could occur when a small change in configuration causes a qualitative change in structural connectivity. If so, the most interesting place to look is not the middle of a cluster but its edge.
</div>

$$
\boxed{
\text{Boundaries, where structure changes rapidly, may be more informative than the interiors they separate.}
}
$$
</div>

<div class="md">
## 8. Clusters, filaments, walls, voids, boundaries — and metaphor

The cosmic-web picture, made precise. A linguistic configuration space might contain:

- **Clusters** — dense regions of closely related configurations.
- **Filaments** — narrow structures connecting otherwise distant clusters.
- **Walls** — higher-dimensional transition regions between large structures.
- **Voids** — regions lacking a particular type of relational structure.
- **Boundaries** — regions where structural properties change rapidly.

And the key conjecture: **these structures themselves occur hierarchically.** A cluster can be made of clusters; a filament can connect clusters of clusters; a void can contain smaller voids; a boundary can contain boundaries between finer structures.

**Metaphor as a possible filament.** "Time is a river." TIME and RIVER normally sit in very different semantic neighborhoods. A metaphor builds a relation between regions that are not ordinarily adjacent — a long-range bridge across the void:

```text
      TIME CLUSTER
       ███████
       ███████
          \
           \
            \   metaphorical bridge
             \
              \
           ███████
           ███████
        RIVER CLUSTER
```

<div class="optional md" data-headline="[SPECULATION] Metaphor (for the curious)">
Metaphor might be a mechanism that *creates or strengthens long-range connections between otherwise separated semantic regions*. That makes it structurally different from ordinary local similarity: it is a filament, not a neighbor. The structure-mapping account of metaphor \cite{gentner1983structuremapping} and the claim that metaphor is fundamental to ordinary thought rather than just to poetry \cite{lakoff1993metaphor} are the closest published relatives of this idea.
</div>
</div>

<div class="md">
## 9. A hierarchy of semantic structure

The hierarchy of *meaning* may run deeper than the hierarchy of *units*. Imagine

$$
\text{word} \;\to\; \text{concept} \;\to\; \text{relation} \;\to\; \text{proposition} \;\to\; \text{model} \;\to\; \text{world-model}.
$$

At each level, the objects of the previous level become components. This is a reading of hierarchical self-similarity:

$$
\boxed{
\text{local relational structures become the atoms of higher-order relational structures.}
}
$$

It is not a literal fractal geometry. It is a **recursive ontology of relations** — meaning is built by relations organizing relations.
</div>

<div class="md">
## 10. The tools: geometry and topology

Suppose a discourse is represented as a point cloud $P_T = \{x_1, \dots, x_k\}$ in some high-dimensional space, and for the moment we ignore order and just study the cloud.

The standard instrument is the **Vietoris–Rips filtration**. At a scale $\epsilon$, connect two points whenever their distance is below $\epsilon$:

$$
\operatorname{VR}(P_T, \epsilon), \qquad \epsilon \ge 0.
$$

As $\epsilon$ grows, points link up, triangles form, and larger shapes appear and disappear. **Persistent homology** \cite{edelsbrunner2002persistent} tracks those features — the numbers $H_0, H_1, H_2, \dots$ (components, loops, voids) — *across* scales \cite{hatcher} \cite{carlsson2009tda}. The output is not a 2D surface; it is a simplicial complex with potentially high-dimensional topology.

The multiscale signature of a discourse can be written schematically as

$$
\Phi(T) \;=\; \bigl(\, \beta_0(\epsilon),\; \beta_1(\epsilon),\; \beta_2(\epsilon),\; \dots \,\bigr)_{\epsilon},
$$

the Betti numbers as a function of scale. Two discourses can then be compared by a distance between their persistence structures,

$$
d_{\mathrm{topo}}(T_1, T_2) \;=\; d\bigl(\Phi(T_1),\, \Phi(T_2)\bigr),
$$

a stability-guaranteed notion of closeness \cite{cohensteiner2007}. The empirical question: **do semantically related structures have systematically related topological signatures?**

<div class="optional md" data-headline="Topology is a tool, not the theory (for the curious)">
Persistent homology is best seen as a *measurement instrument*, not the theory itself. The deeper hypothesis is that meaningful language has stable multiscale relational organization. Topology asks *which structures survive changes of scale*; fractal analysis asks *how structural complexity scales*; geometry asks *how structures are separated and clustered*; network analysis asks *which connect to which*; information geometry asks *how uncertainties are organized*. These are complementary lenses, and the theory is meant to survive any one of them.
</div>
</div>

<div class="md">
## 11. Scale, coarse-graining, and scaling laws

The hierarchy suggests a **coarse-graining** operation

$$
R : X_{r} \to X_{r+1}.
$$

At a fine scale you see tokens and local relations; at a coarser scale those structures *are* the units. Schematically, tokens → phrases → sentences → discourse. The crucial question:

$$
\boxed{
\text{What properties remain invariant under } R \, ?
}
$$

If some properties survive repeated coarse-graining, they are candidates for the fundamental large-scale structures of language.

<div class="optional md" data-headline="[SPECULATION] Semantic fixed points (for the curious)">
The strongest possibility: some semantic structures behave like *fixed points* under coarse-graining, $R(S) \approx S$ — not identical at every scale, but relationally recognizable. Candidates: agent–action, object–property, causal, temporal ordering, part–whole, identity, opposition, dependency. This is why renormalization-group ideas are a tempting conceptual analogy: irrelevant details get washed out, and what remains at large scale is the universal part.
</div>

**There is precedent that language scales.** Zipf's law,

$$
f(r) \sim r^{-\alpha},
$$

frequency against rank \cite{zipf1949human}, and Heaps' law, $V(N) \sim N^{\beta}$, vocabulary against text length, both say that language has *no single characteristic scale* — a few very large, very frequent structures and an enormous tail of small, rare ones:

```text
large structures     ████████
medium structures    ███ ██ █
small structures     · · · · · · · · · · · ·
```

Heavy-tailed structure of exactly this kind is the signature of a system with no preferred scale \cite{statisticsofextremes}. These results do not *prove* the semantic-space theory — they show that language has strong regularities across scales and that scaling analysis is a legitimate tool for it. The bridge is that language is best read as **scale-dependent statistical structure**, rather than merely *a list of vectors*.

**[HYPOTHESIS]** If the *clusters and voids* obey related heavy-tailed laws, that is evidence for hierarchical organization. Possible empirical forms:

$$
N_{\mathrm{void}}(r) \sim r^{-D},
$$

or, per void type,

$$
N_{\mathrm{syn}}(r) \sim r^{-D_{s}}, \qquad
N_{\mathrm{sem}}(r) \sim r^{-D_{m}}, \qquad
N_{\mathrm{ground}}(r) \sim r^{-D_{g}}.
$$

And a single exponent $D$ may not even suffice: a **multifractal spectrum** $D(q)$, as in multifractal analysis, lets different parts of the space scale differently — which fits the intuition that a proof, a conversation, a poem, and a random string have radically different internal structure.
</div>

<div class="md">
## 12. Form, meaning, world: the three spaces

Perhaps the most important distinction in the whole program: **the semantic space is not the linguistic space.**

Let $X$ be the space of linguistic *forms* and $S$ the space of semantic *structures*. There is a natural map

$$
\pi : X \to S.
$$

Different expressions map to the same or similar structure:

$$
x_1 = \text{"The dog chases the cat."}
\qquad\text{and}\qquad
x_2 = \text{"The cat is being chased by the dog."}
$$

correspond to closely related semantic structures. The **fiber** over a structure $s$,

$$
\pi^{-1}(s),
$$

is the collection of linguistic realizations of $s$. This motivates a fiber-bundle-like picture \cite{fiber_bundle_wiki}: $X$ is the *total space* of linguistic configurations, $S$ a semantic *base space*, $\pi$ the projection, and each fiber the set of ways one structure can be said — many points up top, fewer structures below:

```text
                        X = linguistic total space
              ┌──────────────────────────────┐
              │  • •       • •        •      │
              │ •    •   •     •   •        │
              │    •       •       •        │
              └──────────────────────────────┘
                  │       │        │
                  π       π        π
                  ↓       ↓        ↓
              ┌────────────────────────┐
              │ S = semantic structures│
              │   ●       ●       ●    │
              └────────────────────────┘
```

<div class="optional md" data-headline="The fiber picture (for the curious)">
A genuine fiber bundle requires more structure than is established here, so the careful word is "fiber-like." The point: semantics is not a *label* attached to points ($x \mapsto L(x)$). Two expressions are semantically related not because they wear the same tag, but because they *participate in corresponding relations*. That turns semantics from a classification problem into a *structural* one.
</div>

Now widen the picture to include the world:

$$
X \;\longrightarrow\; S \;\longleftrightarrow\; W,
$$

where $W$ is the space of possible world-states — the first arrow is *interpretation*, the second *truth / satisfaction*:

```text
   linguistic space X
          │  interpretation
          ▼
   semantic space S
          │  truth / satisfaction
          ▼
   world space W
```

This splits "meaningfulness" into two:

$$
\boxed{\text{internal coherence}} \qquad\text{and}\qquad \boxed{\text{world coupling / grounding}}.
$$

Language can have internal structure *independently* of whether it is grounded: a purely coherent formal system is a highly structured region that need not be empirically grounded.

**Tarski puts the external side in.** For "Snow is white," there is a difference between the expression, the proposition, and the state of affairs \cite{tarski1935wahrheitsbegriff}:

$$
\text{linguistic expression} \;\longrightarrow\; \text{proposition} \;\longrightarrow\; \text{world condition}.
$$

A Tarskian truth schema is what connects the truth of the quoted sentence with the corresponding fact or condition in the world — the bridge between the sentence and the state of affairs it describes. A theory of meaning based only on internal geometry is therefore incomplete if it wants to capture reference. Model theory gives the clean version \cite{hodges1993modeltheory} \cite{lewis_ci_1946mwo}: a proposition $s$ is represented by the set of worlds in which it is true,

$$
\llbracket s \rrbracket \;=\; \{\, w \in W \mid s \text{ is true in } w \,\},
$$

separating cleanly (1) the linguistic form, (2) the semantic structure, and (3) its interpretation across worlds.

**Consistency as a commuting diagram.** A meaningful representation should let different routes agree: transforming a linguistic object and then interpreting it should give the same result as interpreting it and then transforming the structure,

$$
\begin{array}{ccc}
X & \xrightarrow{\;f\;} & X'\\[3pt]
\downarrow\;\pi & & \downarrow\;\pi'\\[3pt]
S & \xrightarrow{\;g\;} & S'
\end{array}
\qquad\text{with}\qquad
\boxed{\;\pi' \circ f \;=\; g \circ \pi.\;}
$$

**[HYPOTHESIS]** A good semantic representation should exhibit many such approximate commutation properties.
</div>

<div class="md">
## 13. The landscape is a stack, not a single region

Once there are several structures, there is no single complement called "the meaningless space." One point can sit in

$$
\text{Syntax Cluster} \;\cap\; \text{Semantic Cluster} \;\cap\; \text{Grounding Void},
$$

another in

$$
\text{Syntax Void} \;\cap\; \text{Semantic Void} \;\cap\; \text{Grounding Void},
$$

and another in

$$
\text{Syntax Cluster} \;\cap\; \text{Semantic Cluster} \;\cap\; \text{Grounded Cluster}.
$$

There may be several *overlapping* cosmic webs, one per relational dimension. The strongest semantic region is the intersection

$$
M_{\mathrm{strong}} \;=\; C_{\mathrm{syn}} \;\cap\; C_{\mathrm{sem}} \;\cap\; C_{\mathrm{ground}} \;\cap\; C_{\mathrm{epi}},
$$

with weaker meanings living in the other overlaps.

The picture is therefore not one landscape but a **stack of coupled landscapes**:

```text
   syntactic landscape     clusters / voids / boundaries
            │
            ▼
   semantic landscape     clusters / voids / boundaries
            │
            ▼
   grounding landscape    clusters / voids / boundaries
            │
            ▼
   epistemic landscape    certainty / uncertainty / voids
```

**[HYPOTHESIS]** These landscapes may be *correlated*: strong syntax may make semantic structure more likely; grounding may impose extra constraints on it. The relationship need not be one-to-one.

And the strongest form of the whole hypothesis is not "language is fractal" but:

$$
\boxed{
\text{the organization of both structure and absence of structure may be multiscale and recursively organized.}
}
$$

A cluster zooms into smaller clusters plus smaller voids; a void zooms into structured sub-voids. A possible minimal recursive rule:

$$
\mathcal{R}_{k+1} \;=\; F(\mathcal{R}_{k},\mathcal{R}_{k},\dots),
\qquad
\mathcal{V}_{k+1} \;=\; G(\mathcal{V}_{k},\,\mathcal{R}_{k}),
$$

where the second says that voids at one level are determined not by absence of points but by the *failure of particular relations* among lower-level structures. That makes voids a first-class citizen of the theory, not an afterthought.
</div>

<div class="md">
## 14. What would count as evidence

The program earns its keep only if it is *falsifiable*. It gains support if one repeatedly observes some combination of:

1. **Scale-dependent clustering** — cluster organization persists across multiple resolutions.
2. **Power-law scaling** — cluster/void sizes follow robust scaling distributions.
3. **Nested structure** — large clusters systematically contain smaller cluster structures.
4. **Nested voids** — large void regions contain structured sub-voids.
5. **Stable boundaries** — coherence changes rapidly near reproducible semantic boundaries.
6. **Topological persistence** — some components, loops, or higher-dimensional holes persist across scales.
7. **Cross-representation invariance** — similar structures appear under substantially different representations.
8. **Semantic correspondence** — related objects show related multiscale structure even when surface forms differ.
9. **Grounding separation** — internally coherent but ungrounded structures are systematically distinguishable from grounded ones.

These are *research predictions*, not established results.

<div class="optional md" data-headline="[RESEARCH QUESTION] The methodological trap (for the curious)">
The big danger: the observed "topology" may just be the *representation* you chose. If points are embedded by a particular model, the geometry partly reflects that model's training and architecture. So always separate the **geometry of the representation** from the **geometry of the underlying phenomenon**. A strong theory predicts structures that *survive substantial changes in representation* — which is why the abstract formulation in terms of relations, coarse-graining, invariants, and maps between spaces may be more fundamental than any one embedding.
</div>
</div>

<div class="md">
## 15. The research program, and the deepest hypothesis

The program organizes into four levels.

**Level I — Combinatorial space.** Define $X_N = \bigcup_{n=1}^{N} V^{n}$. Ask how the space of possible configurations is structured.

**Level II — Relational landscape.** Identify syntactic, semantic, and pragmatic relations. Ask where the clusters, filaments, boundaries, and voids occur.

**Level III — Multiscale structure.** Introduce a scale $r$ or a coarse-graining $R$. Ask whether $\mathcal{S}(r) \sim \mathcal{S}(\lambda r)$ — whether hierarchical self-similarity exists.

**Level IV — Grounded semantics.** Introduce $X \to S \leftrightarrow W$. Ask how internal coherence and external reference interact. This is where a purely geometric theory of language runs into the classical philosophical problem of reference and truth.

**The central picture.** Start with the total space $X_N$; inside it,

$$
\boxed{
\text{points} \;\to\; \text{clusters} \;\to\; \text{clusters of clusters} \;\to\; \cdots
}
$$

and, in parallel,

$$
\boxed{
\text{voids} \;\to\; \text{structured voids} \;\to\; \text{voids within voids} \;\to\; \cdots
}
$$

across four relational dimensions — syntax, semantics, grounding, epistemics — that overlap; with $X \xrightarrow{\;\pi\;} S$ and $S \leftrightarrow W$; and with multiscale geometry and topology at every level.

$$
\boxed{
\begin{aligned}
&\textbf{Meaning may not be an extra label on linguistic objects.}\\
&\textbf{It may be a stable relational organization of the space of possible}\\
&\textbf{linguistic configurations — internal coherence giving one layer of}\\
&\textbf{structure, and coupling to the world giving another.}
\end{aligned}
}
$$

Meaning would then have both **intrinsic structure** and **extrinsic grounding**. A coherent formal system can occupy a highly structured region without being grounded; empirical language is constrained by *both*. The resulting geometry does not divide the universe into "meaningful" and "meaningless." It contains a hierarchy of **clusters, filaments, boundaries, holes, voids, and nested structures**, whose organization may itself be scale-dependent and possibly fractal.

<div class="optional md" data-headline="Open questions (the research frontier)">
- **Geometry:** is there a metric intrinsic to $X_N$? A representation-independent notion of distance? Is semantic similarity fundamentally geometric?
- **Topology:** which topological invariants correspond to meaningful distinctions? Do semantic structures carry persistent holes? What is the topology of the complement of coherent language?
- **Fractality:** do cluster and void sizes follow scale-free laws? Are there nested clusters and nested voids? Monofractal or multifractal? Are there scaling fixed points?
- **Composition:** what operation turns lower-level structures into higher-level ones? Does composition preserve topological invariants? Can a general coarse-graining $R$ be defined?
- **Grounding:** what mathematical object is world-coupling? Can grounding be a map $S \to W$? What separates a coherent-but-ungrounded structure from a grounded one?
- **Universality:** which properties survive changes of language, of representation — and which are specific to human language rather than to symbolic communication in general?
</div>

The most interesting version of the project is therefore not "run persistent homology on word embeddings" — that is one experiment. It is:

$$
\boxed{
\text{language as a multiscale structured landscape in a vast possibility space}
}
$$

with a recursive organization of presence, *and* a parallel organization of absence. But meaning may require more than internal structure. A complete theory must explain the relationship

$$
\boxed{
\text{form} \;\to\; \text{internal semantic structure} \;\to\; \text{world},
}
$$

so that **coherence is not confused with reference, and reference is not reduced to an arbitrary label.** That is exactly where the geometric–topological program and the classical semantic problem meet: the question of how a structured symbolic space becomes *about something*.
</div>
