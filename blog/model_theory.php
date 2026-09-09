<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: "Model Theory: What a Model Is"
description: The precise sense in which a theory has a model — syntax and semantics, Tarski's recursive definition of truth-in-a-structure, completeness, compactness, Löwenheim–Skolem, and what a consistent theory can and cannot force a model to be.
icon: ⊨
part: 4
order: 23
color: accent
topics: philosophy, math-i, math-ii, logic, model-theory, proof-theory, category-theory, topology, type-theory, ai, epistemology
-->

<div class="md">
## The question

The word *model* has been load-bearing since \citetitle{coherent_difference}: a world model is the global section recovered by descent from compatible local data on a licensed cover; it is *true* where Tarski's if-and-only-if holds at a contact point and coherent where its local sections agree on overlaps. But logic has an older, fully exact sense of the same word, and it is the one that anchors all the others. It comes from **model theory** — not "the study of how to model things," but the mathematical discipline that studies the relation between a *theory* and the *structures that satisfy it*.

This chapter is a short, accurate account of that discipline: its vocabulary, its central theorems, and the single fact the course has been leaning on since \citetitle{coherent_world_models} — that a consistent first-order theory automatically *has* a model. That fact is the discipline's great gift and its great warning, delivered in the same breath. Consistency alone produces a structure the sentences are true in; but it produces *a* structure, not *the* structure, and nothing inside the logic can tell the chosen one from the impostors.

The destination, in one sentence:

$$
\boxed{
\begin{aligned}
&\textbf{Model theory is the study of the relation between}\\
&\textbf{a theory and its models. Consistency guarantees a}\\
&\textbf{model exists; it never guarantees which one is the point.}
\end{aligned}}
$$

Everything below earns that sentence.
</div>

<div class="md">
## Language, structure, theory, model

Model theory begins by fixing a **language** — the alphabet a theory is allowed to write in. A *first-order language* $L$ is given by its symbols: relation symbols, function symbols, and constants. From them, finitely many at a time, one builds *terms* and *formulas*; a formula with no free variables is a *sentence*.

A structure for the language is where the symbols get their meaning:

$$
M \;=\; \bigl(A;\; c^{M},\, f^{M},\, R^{M}\bigr):
$$

a nonempty set $A$ (the *domain*), an element $c^{M} \in A$ for each constant, a function $f^{M}: A^{k} \to A$ for each $k$-ary function symbol, and a relation $R^{M} \subseteq A^{k}$ for each $k$-ary relation symbol. The variables range over $A$.

A **theory** $T$ is a set of sentences of $L$. A **model** of $T$ is a structure that makes every sentence of $T$ true:

$$
M \models \sigma \quad \text{for every } \sigma \in T.
$$

The symbol $\models$ is read "satisfies." Note where the word *model* sits: the theory is the text, the model is the structure the text is true about. The etymology is apt — *model* comes from the Latin *modulus*, a measure or standard: the structure is what the theory measures up against.

Two questions organize the discipline:

1. **Classify the models.** Given a theory, which structures satisfy it? Which of them are isomorphic, and which differ only in ways the theory cannot see?
2. **Study the definable sets.** Inside a structure $M$, which subsets of $A^{n}$ can formulas name?

The second question has a structural echo of algebraic geometry. A formula $\varphi(x_{1},\dots,x_{n})$ defines in $M$ the set of its solutions:

$$
D_{\varphi}(M) \;=\; \{\, a \in A^{n} : M \models \varphi(a) \,\}.
$$

A *definable set* is a set of this form — the points at which the formula comes out true. For the theory of algebraically closed fields, the definable sets are exactly the constructible sets of algebraic geometry: the finite Boolean combinations of solution sets of polynomial equations, a fact that falls out of *quantifier elimination*, one of the discipline's oldest results. Model theory is, on this reading, algebraic geometry with polynomials promoted to first-order formulas — an analogy with real mathematical content, exploited throughout the subject (\citeauthor{hodges1993modeltheory}, \citetitle{hodges1993modeltheory}).
</div>

<div class="md">
## The Galois connection

For any structure $M$, collect everything true in it:

$$
\mathrm{Th}(M) \;=\; \{\, \sigma \text{ a sentence} : M \models \sigma \,\}.
$$

$\mathrm{Th}(M)$ is always a *complete* theory: for every sentence $\sigma$, exactly one of $\sigma$ and $\neg\sigma$ belongs to it. Between theories and structures there is a *Galois connection* — the same mathematical shape as the correspondence the world-model chapter built between models and claims. Writing $\mathrm{Mod}(T)$ for the class of models of $T$:

$$
T \;\subseteq\; \mathrm{Th}(M) \;\Longleftrightarrow\; M \in \mathrm{Mod}(T).
$$

Theory inclusion and model-class inclusion run in opposite directions:

$$
T_{1} \subseteq T_{2} \;\Longrightarrow\; \mathrm{Mod}(T_{2}) \subseteq \mathrm{Mod}(T_{1}).
$$

More axioms, fewer models. A structure $M$ is a model of $T$ precisely when the theory named $T$ is contained in the theory named $M$; the relation is symmetric in the way a correlation is, and the polarity is the same polarity the course already met at the level of single sentences: a model is true *of* a theory exactly when the theory is true *in* the model. Convention T, lifted from single claims to whole theories.
</div>

<div class="md">
## Truth is recursive

In \citetitle{recursion_coherent_difference}, the recursion principle was shown to be the engine of the whole structure: the tower of higher coherence is one operation applied to its own output. Tarski's 1933 definition of truth is a piece of the same machinery \citeauthor{tarski1935wahrheitsbegriff}\citeyear{tarski1935wahrheitsbegriff}\citetitle{tarski1935wahrheitsbegriff} (the standard English translation appears in \citetitle{tarski1956logic}; an accessible statement of the strategy is in \citetitle{hodges2007tarski}).

Truth-in-a-structure is *defined*, not assumed. For a formula $\varphi$ with free variables $x_{1}, \dots, x_{n}$, and an assignment $a = (a_{1},\dots,a_{n})$ of elements of $M$, the relation "$M \models \varphi(a)$" is built by recursion on the complexity of $\varphi$:

- **Atomics.** $M \models P(t_{1},\dots,t_{k})(a)$ iff the tuple of values of the terms is in the relation $P^{M}$.
- **Conjunction, negation.** $M \models (\varphi \wedge \psi)(a)$ iff both hold; $M \models \neg\varphi(a)$ iff the first does not.
- **Quantifiers.** $M \models \exists x\,\varphi(a)$ iff $M \models \varphi(a[m/x])$ for some element $m \in A$.

A *sentence* is true in $M$ — written $M \models \sigma$ — iff it is satisfied by the empty assignment. Nothing else. No hidden truth axiom: truth is a recursive definition over the construction of formulas, exactly as the recursion chapter would predict. The same recursion that builds the tower of coherence builds the relation $\models$ from the ground up.

And the diagonal argument reappears with it. Tarski's undefinability theorem — a diagonalization through the same material as Gödel's \citeauthor{godel1931incompleteness}\citeyear{godel1931incompleteness}\citetitle{godel1931incompleteness} — says that no formula of arithmetic can define the relation "this sentence is true in $\mathbb{N}$": the satisfaction relation of a structure rich enough to talk about itself slips entirely out of that structure's own reach. Every structure's truth is accessible from *outside*, by a higher-level structure — which is exactly the world-model chapter's conclusion that the anchor of the T-schema is another model one level up.

<div class="optional md" data-headline="Why this is not circular">
The recursion is not circular, and the reason is worth making explicit, because the name "circular" tends to get attached to any self-reference.

The definition of $M \models \varphi(a)$ recurses on the *structural complexity* of $\varphi$: the clauses for $\wedge$, $\neg$, $\exists$ call the same definition only on strictly smaller formulas. The process therefore terminates, at the atomic clauses, where satisfaction is settled directly — an atomic formula is checked against the structure's own relations and functions, with no appeal to truth-in-general.

The one genuine self-touch is diagonal: the language is allowed to name its own formulas and talk about them. But that is not circularity; it is what makes the undefinability theorem possible. If the definition of truth-in-a-structure were circular, it could not be a theorem of set theory — and it is. What "slips out" is only the attempt to internalize: no structure of that richness can define its own satisfaction. The recursion works; the system just cannot see beyond itself.
</div>
</div>

<div class="md">
## Three pillars

Three theorems carry the whole subject, and each is worth stating with full precision, because the course has been leaning on them informally and they deserve to be exact \citeauthor{hodges1993modeltheory}\citeyear{hodges1993modeltheory}\citetitle{hodges1993modeltheory}.

**Completeness** \cite[Gödel's dissertation, 1929, published in 1930]{godel1930completeness}. For a first-order theory $T$ and a sentence $\sigma$:

$$
T \text{ is consistent} \;\Longleftrightarrow\; T \text{ has a model},
\qquad
T \models \sigma \;\Longleftrightarrow\; T \vdash \sigma .
$$

"Satisfied in every model" and "provable" are the same relation. This is the syntax–semantics bridge, and the source of the famous consequence: a theory that no proof can refute always has some universe in which it is true.

**Compactness.** A first-order theory $T$ has a model if and only if *every finite subset* of $T$ has a model:

$$
T \text{ has a model} \;\Longleftrightarrow\; \text{every finite } T_{0} \subseteq T \text{ has a model}.
$$

**Löwenheim–Skolem** (downward form, in Skolem's 1920 generalization). A theory in a countable language has a model if and only if it has a model whose domain is at most countable. If countably many symbols can express the axioms at all, and any structure satisfies them, then a small structure does.

These three are not independent strands; they are one fabric, and the same construction proves all of them. Completeness is proved by building a model directly out of the *terms* of the language (a "term model," following Henkin's 1949 method of constants). That term model is at most countable when the language is countable — which is Löwenheim–Skolem — and checking the construction shows that a contradiction can only be derived from finitely many axioms — which is compactness, as a corollary of completeness plus the mundane fact that proofs are finite.

<div class="optional md" data-headline="Why the name 'compact'">
Two unrelated-looking finiteness properties share the name, and the model-theoretic one is worth its name twice.

First, the pedestrian route: proofs are finite. If some theory $T$ had no model, completeness would force $T$ to be inconsistent, so some proof derives $\bot$ from $T$. But a proof uses only finitely many axioms of $T$ — and that finite subset would then be inconsistent, hence (by the "every finite subset has a model" side) impossible. No model, no finite sub-cover: contradictions, like proofs, are finitely witnessed.

Second, the topological route. A *complete type* is a maximal consistent description of an element (or $n$-tuple) — a recipe for a point that no finite set of formulas rejects. The set $S_{n}(T)$ of complete $n$-types carries a natural topology, the Stone topology, whose basic open sets are the clopen cells $[\varphi] = \{ p : \varphi \in p \}$. In that space, the compactness theorem is nothing other than the statement that each type space is topologically compact — every open cover has a finite subcover. The two compacts are the same compact: model-theoretic compactness literally is the compactness of the space of possible elements. This is why a "recipe for a point" that is finitely consistent but not realized always gets realized somewhere else — in an elementary extension, by compactness — and never added as a piece of the original structure: the space is compact, but its points are not all here.
</div>

<div class="optional md" data-headline="The class of models, categorically">
Pushed one level up, the same facts take categorical dress. The models of a first-order theory, with *elementary embeddings* as morphisms, form an **accessible category**: every model is a filtered colimit of small sub-models, and the category is recoverable from a tiny subcategory by taking directed unions of chains. That closure under chains is exactly Löwenheim–Skolem and compactness put together — the categorically minded reader may see the whole of base model theory in the single phrase "the category of models is accessible" (Makkai–Paré, 1989; the programma is spelled out in their *Accessible Categories: The Foundations of Categorical Model Theory*). It is the same descent-flavored shape the course has been running all along: the global object is a limit of local data, and the local data are just the small, realizable pieces.
</div>
</div>

<div class="md">
## The impostors: nonstandard models

Compactness produces structures the theory never intended. Let $L$ be the language of arithmetic, add a fresh constant $c$, and add to $\mathrm{Th}(\mathbb{N})$ the infinite family of axioms

$$
c > 0,\ \ c > 1,\ \ c > 2,\ \ c > 3,\ \ \dots
$$

Every finite subset is satisfied in the standard model itself: pick $c$ to be a large enough ordinary number. By compactness, the whole set has a model $M$. In $M$, the element $c$ is bigger than every number the standard numerals name. No axiom says $c$ is "nonstandard" — but $c$ exists, and it is bigger than every element reachable by the language.

Now the surprising part, and the whole point. From inside $M$, the *boundary* between the standard elements and the rest cannot be drawn: if some formula $\varphi(x)$ held of exactly the standard elements, then — since $\varphi$ holds of all the standard numerals, a fact $\mathbb{N}$ itself certifies — the overspill lemma for a model of $\mathrm{Th}(\mathbb{N})$ forces $\varphi$ to hold of some nonstandard element as well. Contradiction. No formula defines the standard cut. The structure $M$ is perfectly coherent on its standard region, satisfies every theorem of true arithmetic, and has a further region of genuine elements it can never name.

This is precisely the situation of \citetitle{coherent_world_models}'s fifth pathology, *the out-of-cover query*: the model is coherent on its cover, Tarski passes at every in-cover contact point, and yet the region beyond $c_{\mathrm{acc}}$ — here, the nonstandard elements — is real, populated, and structurally invisible from within. In the world-model chapter the unlicensed region is $c_{\mathrm{acc}}$; in model theory it is any class the structure cannot define. Same shape, same reason: what a system cannot define from within, it cannot audit from within.

**Skolem's paradox** is the same fact worn on its head. $\mathsf{ZFC}$ — the theory intended to capture all of mathematics — has, if it is consistent, a countable model (Löwenheim–Skolem). Inside that model, the set the model calls "the uncountable set $\mathbb{R}$" is uncountable in the only sense the model can express: there is no bijection *inside the model* between it and the model's countable ordinals. From outside, we can exhibit such a bijection — but the bijection lives outside the model, is not an element of it, and so cannot be seen by it. A system that proves the existence of uncountable sets sits inside a countable universe, without contradiction, because the countability is not expressible in its own language. The honest range of the theory ends where its definability ends; compactness has already made sure there is room for the rest.
</div>

<div class="md">
## First-order logic is permissive

Put the three pillars together and one moral falls out: first-order theories are inefficient at pinning down a particular structure. A theory intending "mean the integers" or "mean the reals" never gets to say so. If the intended model is infinite, compactness and Löwenheim–Skolem between them supply non-isomorphic alternatives, and the theory is powerless to rule any of them out. Impostors are the rule, not the exception.

The precise theory of "when is a theory unambiguous" is the theory of *categoricity*. A theory $T$ is $\kappa$-categorical if it has exactly one model of cardinality $\kappa$, up to isomorphism. The rarity of the phenomenon was measured by Morley:

**Morley's theorem** \citeauthor{morley1965categoricity}\citeyear{morley1965categoricity}\citetitle{morley1965categoricity}: *if a complete countable first-order theory is $\kappa$-categorical for some uncountable $\kappa$, then it is $\lambda$-categorical for every uncountable $\lambda$.*

Categoricity, when it happens at all, is an all-or-nothing affair above the first threshold — and it is rare. The countable case is the exception to the exception: an $\aleph_{0}$-categorical theory is highly constrained (for each $n$, only finitely many $n$-types), and $\aleph_{0}$-categoricity never forces categoricity higher up. This is why the subject's energy went into classification: stable theories — where the number of types is controlled — admit a taxonomy, and the flagship tame class, the *o-minimal* structures (an ordered structure where every definable set is a finite union of points and intervals; the ordered reals are the original example), are everywhere in mathematics. But the discipline's own verdict stands: for a first-order theory to describe exactly one structure is a great rarity; generically a theory describes a whole zoo, and choosing which animal you meant is a fact no axiom can encode.
</div>

<div class="md">
## What this does to the course

In \citetitle{coherent_world_models}, "the model-existence machinery of first-order model theory does the work the external world would otherwise do: by completeness and compactness, a consistent first-order theory *has* a model." Model theory now lets the course see exactly how much that buys, and exactly where it stops.

**What consistency buys: everything internal.** If every contact point is internal — theorems, proofs, derivations — then a consistent theory is *true* in a precise sense: it has models, and so it is the truth about a domain it defines for itself. The model is not merely asserted to exist; it is *built* from the theory's own terms. This is the formal half of the world-model chapter's claim that consistency is a sufficient criterion of internal adequacy.

**What consistency does not buy: the external contact.** Nothing in the logic forces the physical world to be one of those models. Compactness guarantees existence; it makes no recommendation among the zoo. The *self-consistent fantasy* of \citetitle{coherent_world_models} is exactly a theory with models on which Tarski's if-and-only-if passes at no external contact point: internally coherent, semantically inhabited, and about nothing. In model-theory dress, the pathology reads: *consistency implies that a model exists; correspondence requires that the world be one of them — and no test inside the theory can run that check.* That is the sharpest two-line summary of the course's epistemology the discipline can supply:

$$
\boxed{
\begin{aligned}
&\textbf{Completeness and compactness: a consistent theory}\\
&\textbf{always has a model. Nothing forces the world to be}\\
&\textbf{among them. Tarski at the contact points is a check}\\
&\textbf{that no consistency argument can ever run.}
\end{aligned}}
$$

And the LLM case footnote itself in the same words. A trained model is not a structure satisfying axioms — it is a distribution over text — but the out-of-cover query is the same hole as a nonstandard cut: fluent, locally coherent, and with no formula inside that distinguishes it. The course has been saying this in three languages; model theory is the fourth, and here the sentence "a model exists" is a *theorem*. The impostors work for free — and the contact points are how you tell them apart.
</div>

<div class="md">
## The audit

The discipline of \citetitle{coherent_world_models} demands that a chapter run its own Tarski check at its load-bearing claims. Here is the inventory.

**Theorems.** The statements of completeness, compactness, and downward Löwenheim–Skolem; Morley's categoricity theorem; quantifier elimination for algebraically closed fields; the existence of nonstandard models and the overspill argument; Tarski's undefinability of truth. All are standard results, expressed in the vocabulary of \citetitle{hodges1993modeltheory}; the categoricity statement follows \citetitle{morley1965categoricity}, the completeness statement \citetitle{godel1930completeness}, the satisfaction recursion \citetitle{tarski1935wahrheitsbegriff}.

**Analogies.** The identification of compactness with a descent-like condition, and of definability boundaries with the world-model chapter's $c_{\mathrm{acc}}$: these are uses of the discipline's vocabulary, not results of it. They have real backbone — model-theoretic compactness genuinely is topological compactness of the type spaces, and overspill genuinely is a definability failure — but the walk from "the space of types is compact" to the course's epistemology is a walk the author takes with the reader, not a theorem.

**Readings.** That the model-theoretic notion of *model* is the formal anchor of the course's disciplined concept of a world model — that is this course's claim, offered as the organizing frame of Part 4. It is the one item in this chapter a reader is fully invited to reject; nothing else here is optional.
</div>