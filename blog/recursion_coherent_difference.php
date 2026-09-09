<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: "Recursion and the Shape of Coherent Difference"
description: Where recursion fits into the sheaf-theoretic picture — from the tower of higher coherence to the regress of licences, from Spencer-Brown's distinction to the Hegelian serpent.
icon: ♾
part: 4
order: 21
color: accent
topics: philosophy, math-i, math-ii, logic, proof-theory, topology
-->

<div class="md">
## The question

The two preceding chapters built a picture: global unity from local difference, glued by coherent transitions, with the sheaf condition as the formal heart. The picture is powerful — and *recursive at every level*. That recursion is not an accident. It is the structural reason the picture works, and the structural reason it has limits.
</div>

<div class="md">
## The tower

In \citetitle{coherent_difference}, the chain from Distinction to Invariance runs through Coherence, and at Coherence something happens that the earlier links did not demand: *the compatibility condition itself must be compatible*.

In a classical sheaf, two sections are equal on the overlap:

$$
s_{i}|_{U_{i} \cap U_{j}} \;=\; s_{j}|_{U_{i} \cap U_{j}}.
$$

Equality is binary. Nothing further to check. But in an $\infty$-sheaf, two sections are *equivalent* on the overlap:

$$
s_{i}|_{U_{i} \cap U_{j}} \;\simeq\; s_{j}|_{U_{i} \cap U_{j}},
$$

and the equivalence is witnessed by a homotopy $\alpha_{ij}$. Now the homotopies must cohere on triple overlaps:

$$
\alpha_{ij} \circ \alpha_{jk} \;\simeq\; \alpha_{ik},
$$

and *that* coherence is witnessed by a 2-morphism, which must cohere with other 2-morphisms on quadruple overlaps, and so on. The tower:

$$
\text{objects} \to \text{morphisms} \to \text{2-morphisms} \to \text{3-morphisms} \to \cdots
$$

is the *recursive unfolding of a single question*: "do these agree?" asked at successively higher levels. Each level applies the same operation — *test coherence* — to the output of the level below. The $\infty$-sheaf condition is not a finite list of axioms; it is a recursive scheme that generates an axiom at each dimension.

The Čech nerve makes this explicit. Given a cover $\{c_i \to c\}$, the nerve is a simplicial object: degree 0 lists patches, degree 1 lists pairwise overlaps, degree 2 lists triple overlaps, and so on. The face and degeneracy maps are combinatorial recipes for applying the same operation one level deeper. The sheaf condition is the requirement that the limit over the entire nerve — an infinite, recursively structured diagram — reproduces $F(c)$. A finite check would not suffice; the condition is inherently infinite.

**Relations can themselves have relations. The tower is not decoration.**
</div>

<div class="optional md" data-headline="Why the tower does not collapse">
Why not stop at some finite level? In many cases we can. If the target is $\mathbf{Set}$, all higher homotopies are trivial: nothing to check beyond pairwise equality, and the tower collapses. Sets are *0-truncated* types in HoTT: spaces whose only structure is their points.

The tower matters when the target is *not* sets. In $\infty$-groupoids, chain complexes, or spectra, higher cells carry genuine information. The winding number on $S^1$ lives at level 1. The anomaly in a gauge theory lives at level 2. The elements of $\pi_3(S^2) \cong \mathbb{Z}$ live at level 3. Truncating the recursion throws away real structure.

This is also what makes $\infty$-categories *strictly more general* than finitely-categorical ones. A 2-category has objects, morphisms, and 2-morphisms, and stops. An $(\infty,1)$-category has them all, with every $n$-morphism for $n \ge 2$ invertible. The recursion is bounded (all higher cells are equivalences) but not truncated. This bounded-but-infinite recursion is the technical heart of HoTT, where univalence says *identity itself is recursive*: to identify two types is to exhibit an equivalence, to identify two equivalences is to exhibit a homotopy, and so on.
</div>

<div class="md">
## The regress of licences

In \citetitle{coherent_world_models}, every admissible transition $T \in \mathcal{T}$ requires a *licence* — an independent justification that the comparison is worth making. But licences need grounding:

A *physical law* is a licence only relative to the idealised setup in which it was derived, and only approximately of the messy world we want to know about. *Calibration* is a comparison against a standard that must itself already be trustworthy.

Each licence is a transition, and each transition needs a licence. The justification of $T$ is itself a $T'$, which needs a $T''$, and so on. Sellars saw this clearly:

<div class="smart-quote" data-cite="sellars1956empiricism">
One seems forced to choose between the picture of an elephant which rests on a tortoise (What supports the tortoise?) and the picture of a great Hegelian serpent of knowledge with its tail in its mouth (Where does it begin?). Neither will do.
</div>

The foundationalist picture — an elephant on a tortoise — is *well-founded* recursion: it terminates in a base case. The Hegelian serpent — knowledge with its tail in its mouth — is *non-well-founded* recursion: no base case, no termination, no foundation.

\citetitle{coherent_world_models} occupies a middle ground. It does not posit a foundation (that would be foundationalism). It does not embrace the full serpent (that would be pure coherentism, which the chapter explicitly rejects). Instead, it treats the regress as *open-ended and self-correcting*: each licence can be re-justified, refined, or refused at any contact point where Tarski's condition fails. The recursion is *partial* — it runs as far as the current cover reaches — and *productive* — each cycle can widen the cover. The Hegelian serpent is not denied; it is *disciplined*.

$$
\boxed{
\begin{aligned}
&\text{The regress of licences is recursive.}\\
&\text{It does not terminate.}\\
&\text{It does not need to.}
\end{aligned}}
$$
</div>

<div class="md">
## Spencer-Brown's distinction as a fixed point

The most ancient site of recursion is the first link of the chain: Distinction.

Spencer-Brown begins *Laws of Form* with a single instruction — *Draw a distinction* — and a single axiom:

$$
\neg\neg\, x \;=\; x
$$

Apply the mark twice and you are back where you started. This is a *fixed-point equation*: the operation applied to itself returns the original state. In the language of recursion theory, the distinction is a *lazy fixed point* — it computes to *itself*, and the self-application is the whole content.

The same structure appears whenever a system refers to itself. The Liar — "this sentence is false" — is a distinction applied to its own output. The sentence asserts its own negation, $\neg\neg x = x$ says double negation is identity, so the Liar has no stable truth value. It is a *diverging* fixed point: the recursion does not terminate because it has no base case. Spencer-Brown's axiom *is* the assertion that the divergence resolves: the distinction *is* the base case, not because it sits outside the system, but because it creates the system.

\citeauthor{gunther1978idee} read this as the seed of a deeper problem. Classical logic, with its two-valued distinction (marked / unmarked), cannot handle systems that feed back on themselves. The Liar, the halting problem, Gödel's sentence, repeated play in the prisoners' dilemma: all are a distinction applied within the domain it creates. Gunther's proposal — *place-valued* logic, where the same distinction in different contexts yields different truth values — is an attempt to make the recursion *converge* by enriching what counts as a value. Whether or not one accepts the programme, the diagnosis is precise: **the recursive structure of self-reference demands a richer logic than the distinction alone provides**.

$$
\boxed{
\begin{aligned}
&\text{Distinction applied to itself}\\
&\text{is recursion without a base case.}\\
&\text{The base case is the act of distinguishing.}
\end{aligned}}
$$
</div>

<div class="md">
## Tarski's circle and the diagonal

Tarski's undefinability theorem — a language rich enough to express its own semantics cannot define its own truth predicate — is a *diagonal argument*, and every diagonal argument is a recursive construction.

Assume a truth predicate $\mathrm{Tr}(x)$ exists inside the language, then construct a sentence $\lambda$ that says "$\lambda$ is not true". If $\mathrm{Tr}(\lambda)$ holds, $\lambda$ is false — contradiction. If $\neg\mathrm{Tr}(\lambda)$ holds, $\lambda$ is true — contradiction. The sentence $\lambda$ is the *fixed point* of the operation "negate what you're currently evaluating", manufactured by diagonalization — itself the proof technique.

In \citetitle{coherent_world_models}, Tarski's Convention T is the *correspondence* leg of truth: a model is true iff, at every licensed contact point, its claims match the world. But the right-hand side — the "fact $p$" in the meta-language — is itself a trace, itself the output of an access function. The anchor of truth is *another model*, one level up:

$$
\underbrace{S}_{\text{claim in model}} \;\;\text{is true iff}\;\; \underbrace{p}_{\text{fact, itself a model}} \;\;\text{is true iff}\;\; \underbrace{p'}_{\text{fact about } p} \;\;\cdots
$$

The chapter's resolution — correspondence as *the limit of coherence under widening covers* — makes this recursion *converge*: the infinite tower collapses into a single condition (stays coherent as the cover grows) approximating the unreachable fixed point (correspondence with $W$ as such). The partial evaluations of the recursion form a Cauchy sequence whose limit is truth as a regulative ideal.

Gödel's incompleteness theorem is the recursion-theoretic twin. Any consistent formal system strong enough for arithmetic contains a sentence $G$ equivalent to "$G$ is not provable in this system". Two recursive ingredients: *Gödel numbering*, which encodes each formula as a number via primitive recursive functions, making syntax expressible inside arithmetic; and the *Diagonalization Lemma* (Fixed-Point Lemma), which takes any property $\varphi(x)$ and produces a sentence $\lambda$ such that the system proves $\lambda \leftrightarrow \varphi(\ulcorner\lambda\urcorner)$. The lemma builds a self-referencing sentence by a fixed-point trick structurally identical to the Y combinator. Applied to "is not provable", it yields $G$: true (if consistent) but unprovable — a fixed point of "not provable in this system" that the system cannot reach.

The sheaf parallel is structural. The system's proof-generating capacity, like the cover of a sheaf, cannot reach every point of the space it inhabits: $G$ is coherent on the current cover but undecidable from within. The out-of-cover query pathology of \citetitle{coherent_world_models} — where the query lies outside $c_{\mathrm{acc}}$ and no contact point exists — is the epistemic analogue: a claim the model cannot test, not because it is false, but because the cover does not reach far enough.
</div>

<div class="md">
## The type hierarchy: recursion as construction

In \citetitle{coherent_difference}, the passage from sets to types introduces a hierarchy:

$$
\text{term} \;\to\; \text{type} \;\to\; \text{type of types} \;\to\; \cdots
$$

Each level is built from the previous by one operation — "the type of all $X$ at this level" — applied to its own output. This is *not* a vicious circle; it is *well-founded* recursion, each level strictly above the last, terminating only if we impose a universe axiom.

In HoTT this becomes the universe tower $\mathcal{U}_0 : \mathcal{U}_1 : \mathcal{U}_2 : \cdots$, and univalence adds a recursive twist: the identity type of a universe *is* the equivalence type. Identity types in HoTT are inductive types — constructors (refl) and eliminators (the **J rule**, the recursor for identity): to prove something about all identifications $p : x = y$, it suffices to prove it for refl. Univalence then makes identity recursive: two types are equal iff they are equivalent, two equivalences are equal iff homotopic, and so on. Identity folds back on itself at every level — the categorical expression of Nagarjuna's *whatever is dependently originated, that we declare to be emptiness*: identity has no intrinsic content; it is constituted entirely by the recursive structure of its own higher manifestations.

The natural numbers object $\mathbb{N}$ is the canonical recursive type, and the reason recursion is required to build mathematics. Defined as an *initial algebra* for the successor functor $X \mapsto 1 + X$ — the universal object with a point $0$ and a function $s : \mathbb{N} \to \mathbb{N}$ — it satisfies the *recursion principle*: given any object $X$, point $x$, and endomorphism $f : X \to X$, there is a unique map $\mathbb{N} \to X$ sending $0$ to $x$ and commuting with $s$ and $f$. *This is mathematical induction*. Induction *is* the recursion principle of $\mathbb{N}$, and $\mathbb{N}$ is what recursion builds from a base case and a successor. Every other finitary object — integers, rationals, finite sets and trees — is built from $\mathbb{N}$ by further recursion. Without it, no natural numbers; without them, no mathematics.

$$
\boxed{
\begin{aligned}
&\text{Induction is the recursion principle}\\
&\text{of the natural numbers.}\\
&\text{Recursion builds the natural numbers.}\\
&\text{The natural numbers build mathematics.}
\end{aligned}}
$$
</div>

<div class="optional md" data-headline="Well-foundedness: where recursion is safe">
Recursion is not always well-behaved. A relation $R$ on a set $A$ is **well-founded** if there is no infinite descending chain $a_1 \mathrel{R} a_2 \mathrel{R} a_3 \mathrel{R} \cdots$ — equivalently, every nonempty subset has an $R$-minimal element. This is the formal justification of induction: prove the property for minimal elements, push up. In computer science it is the formal justification of *termination*.

The coherent difference chain — Distinction $\to \cdots \to$ Invariance — is *not* well-founded in this sense. Each link is defined in terms of the previous, but the chain does not terminate in a base case; it terminates in a *property* (Invariance) that feeds back into the practice of choosing new covers, reopening the chain from Distinction. It is a cycle, not a well-order. This is not a defect: the chain is a *discipline*, not a proof. It is not trying to compute a value; it is trying to organise a practice.

In *formal* systems, well-foundedness is non-negotiable. A recursive function that does not terminate is not a function. The natural numbers object is well-founded by construction. W-types (well-founded trees) formalize recursion with multiple constructors. And the *effective topos* — the universe of computable mathematics — is one in which every function is total, every recursion terminates, and the internal logic is intuitionistic: classical reasoning would admit non-constructive recursion (choice, which by Diaconescu's theorem implies excluded middle).

The sheaf relation: a sheaf on a *well-founded* site has a simpler gluing condition, because "compatible on overlaps" terminates. A sheaf on a *non-well-founded* site — arising in non-well-founded set theory, coalgebra, the semantics of concurrent processes — needs the full $\infty$-sheaf machinery, because compatibility must be checked along chains that do not terminate. \citetitle{coherent_world_models} presents the world as not well-founded: every observation leads to a further observation, every licence to a further licence. The sheaf condition on such a world is necessarily recursive and necessarily open-ended.
</div>

<div class="md">
## Proof theory: normalization as descent

The central recursive process of proof theory is *normalization* — the reduction of a proof to a canonical form. A natural-deduction proof can contain *detours*: an introduction immediately followed by an elimination on the same connective. Normalization removes them, step by step, until none remain. Each step produces a shorter proof; the procedure is applied to the result of the previous step. The *normalization theorem* says the process terminates.

The sheaf connection is structural. A proof in a dependent type theory is a *section* of a type family over a context (a site); normalization is the analogue of *descent* — it takes compatible local data (proof fragments in each context) and assembles them into a unique global section (the normal form). Girard's normalization theorem for System F — that every well-typed term has a normal form — states that this gluing succeeds; *strong normalization* — every reduction sequence terminates — states that descent is well-founded. Gentzen's cut-elimination theorem (*Hauptsatz*) is the same statement in sequent calculus: a cut is an intermediate formula introduced and then eliminated, and cut-elimination removes them recursively; the resulting cut-free proof is normal and satisfies the subformula property.

$$
\boxed{
\begin{aligned}
&\text{Normalization is descent for proofs.}\\
&\text{Strong normalization is its well-foundedness.}\\
&\text{Cut-elimination is the same descent,}\\
&\text{in the sequent-calculus formalism.}
\end{aligned}}
$$
</div>

<div class="md">
## Confluence: when recursion is order-independent

The Church–Rosser property — if $a \mathrel{R}^* b$ and $a \mathrel{R}^* c$, then some $d$ satisfies $b \mathrel{R}^* d$ and $c \mathrel{R}^* d$ — is a statement about *confluence* of recursive rewriting: two reduction paths from the same term can always be brought back together. The result of computation is independent of the order of rule application.

This is the computational analogue of the sheaf condition. When a recursive process is non-deterministic, confluence guarantees a unique answer: intermediate results (local sections) that are compatible (reduce to the same term from a common ancestor) glue into a unique global section (the normal form).

Newman's lemma is the sharpest statement: *terminating* + *locally confluent* $\Rightarrow$ *confluent*. Termination is well-foundedness; local confluence is the local compatibility condition; confluence is the global gluing property. The lemma says: if the local pieces fit together and the recursion terminates, the global section exists and is unique. This is descent for rewriting systems — one of the cleanest instances of the sheaf picture in mathematics.
</div>

<div class="md">
## Fixed points: where recursion meets topology

A *fixed point* of $f : X \to X$ is an $x$ with $f(x) = x$. The fixed-point theorems of topology — Brouwer, Kakutani, Lefschetz, Tarski — assert the *existence* of solutions to recursive equations: equations in which the unknown appears on both sides.

Brouwer: every continuous map from a compact convex set to itself has a fixed point. The theorem is non-constructive (it does not say *where*), and its proof is a topological recursion: the barycentric subdivision, applied repeatedly, converges to the fixed point.

The connection to coherent difference is direct. A fixed point is a *self-coherent section*: a section $s$ such that the transition map sends $s$ to itself. The sheaf condition says compatible local data glue; a fixed-point theorem says that under the right topological conditions, a section exists that is compatible *with itself* under the endomorphism. Both are instances of the same recursive structure: a system that refers to itself and finds a stable answer.

The Lawvere fixed-point theorem is the general form. In a cartesian closed category, if there is a surjection $A \to B^A$ (an object that "contains all its own endomorphisms"), then every endomorphism $f : B \to B$ has a fixed point. The proof is a diagonal argument — the same construction that produces the Liar and Gödel's sentence. The theorem: **if the category is rich enough to encode self-reference, then self-reference has fixed points**. Whether the fixed point is a *truth* (topological case, a stable solution) or a *paradox* (logical case, an undecidable sentence) depends on the internal logic — on what counts as a "point" and as "truth".

$$
\boxed{
\begin{aligned}
&\text{Lawvere: if a category is rich enough}\\
&\text{to encode self-reference,}\\
&\text{then self-reference has fixed points.}\\
&\text{The fixed point may be a truth or a paradox,}\\
&\text{depending on the internal logic.}
\end{aligned}}
$$
</div>

<div class="optional md" data-headline="The Y combinator: recursion without self-reference">
In the untyped lambda calculus, recursion is not a primitive. There is no `let rec` or `def f(x) = f(x-1) + 1` — only functions and application. How, then, do you define a recursive function?

The answer is the **Y combinator**: $Y = \lambda f. (\lambda x. f(x\,x))(\lambda x. f(x\,x))$. For any $g$, $Y\,g$ reduces to $g(Y\,g)$ — a term that "applies $g$ to itself". Y is a *fixed-point combinator*: it finds a $t$ with $g\,t = t$. It is the lambda-calculus implementation of Brouwer's theorem, with the "space" being the space of lambda terms and the continuity condition dropped — which is why its fixed point can diverge.

The point for recursion: self-reference is not a primitive ability but a *constructible* one, built from function abstraction and application. Any system with those two ingredients can construct its own recursion. The parallel with Spencer-Brown is exact: the distinction $\neg\neg x = x$ is the logical fixed point, Y the computational one. Both are a system that refers to itself and finds a stable answer — or does not.
</div>

<div class="md">
## The recursive structure of the chain itself

Return, finally, to the chain that opened \citetitle{coherent_difference}:

$$
\begin{aligned}
&\text{Distinction} \to \text{Relation} \to \text{Transformation} \to \text{Locality} \to \text{Compatibility} \to \text{Coherence} \to \text{Gluing} \to \text{Globality} \to \text{Invariance}
\end{aligned}
$$

Each link presupposes the previous: Relation presupposes Distinction, Transformation presupposes Relation, and so on. A *recursive construction* — each term the output of a function applied to the previous.

But the chain does not end at Invariance. Invariance feeds back into practice: once you have an invariant global object, you change your cover and start again. The chain is a *spiral*, the same structure revisited at a higher level of understanding — the Hegelian serpent, made operational.

The recursion is also the recursion of *understanding*. You grasp Distinction first, then Relation, then Transformation, and at each step *re-understand* the earlier links in light of the later ones. The backward pass from Invariance to Distinction is the hermeneutic circle: the part in terms of the whole, the whole in terms of the parts, deepening with each pass.

$$
\boxed{
\begin{aligned}
&\text{The chain is recursive.}\\
&\text{Understanding it is recursive.}\\
&\text{The recursion does not terminate}\\
&\text{because understanding does not terminate.}
\end{aligned}}
$$
</div>

<div class="md">
## What recursion tells us

**First:** the sheaf condition is not a single axiom but a recursive scheme, generating a new axiom at each dimension. The scheme does not terminate, which is why $\infty$-categories and HoTT are needed: the recursive structure of coherence is genuinely infinite.

**Second:** the regress of licences is not a defect but a feature. Every transition needs a licence; every licence needs a licence. The recursion does not terminate, but it is *productive* — each cycle can widen the cover. The Hegelian serpent is the right picture for a knowledge system that has no foundation yet is not arbitrary.

**Third:** self-reference — the recursion of a system applied to itself — is both the deepest source of power and of paradox. Spencer-Brown's distinction, Tarski's truth, Gödel's incompleteness, Lawvere's fixed-point theorem: all are systems rich enough to encode their own recursion. The consequences range from the foundational (truth is a regulative ideal, not an attainable state) to the practical (a model's honest range is limited by its cover — outside that range it can only fabricate).

$$
\boxed{
\begin{aligned}
&\text{Recursion is the structural principle}\\
&\text{that makes coherent difference work,}\\
&\text{that makes it have limits,}\\
&\text{and that makes the limits productive.}
\end{aligned}}
$$
</div>
