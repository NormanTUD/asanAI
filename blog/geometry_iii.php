<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Shape of Holes: A Working Algebraic Topology
description: From Euler's bridges to the barcodes of embedded meaning: who turned shape into algebra, when, and why, with the exact sequences as they first appeared, and the persistent homologies that now read the shape of data.
icon: &#127849;
part: 1
order: 10
color: accent
topics: geometry, math-iii, history
-->

<div class="smart-quote" data-cite="eilenbergsteenrod1952">
In this way, a homology theory is an algebraic image of topology. The domain of a homology theory is the topologist's field of study. Its range is the field of study of the algebraist. Topological problems are converted into algebraic problems.
</div>

<div class="md">
## Why shape needs algebra

The chapters before this one gave you two ways to think about shape. [Geometry I](geometry_i) gave you the historic way, space as an object to measure, evolve, and embed. [Geometry II](geometry_ii) gave you the working way, the toolkit a machine actually uses: projections that squash data, matrices that rotate it, convolutions that slide over it. This chapter gives you the third and deepest way, **algebraic topology**, the part of mathematics that turns shape itself into algebra, groups, rings, and exact sequences, so that holes, loops, and connections become objects you can compute with the same arithmetic a computer already owns.

There is a famous joke that a topologist cannot tell a coffee cup from a doughnut: deform one into the other without tearing and they are the same shape, and both have exactly one hole. The joke is almost right, but it misses the point. Topology does not invalidate geometry; it looks at the same spaces from angles geometry alone cannot reach. Once you stop caring about distance, angle, and size, a large class of properties survives, and these are precisely the properties geometry on its own cannot see. Those properties are the **topological invariants**. Algebraic topology exists to make this precise: to count the holes, locate them, and compare two shapes by the algebra of their holes alone.

Why should a reader of a course about AI care about holes? Because the raw material of this book is **meaning**, and in the modern view meaning has a shape. A word is a point in a high-dimensional space, a concept is a cloud of points, and a relation between concepts is a tunnel or a wall inside that cloud. The [Embeddings](embeddinglab) chapter runs on this picture, and algebraic topology is the mathematics of the holes inside it. As we will see at the end, it is now being used, live, to inspect the geometry in which a transformer's thoughts actually live.

Like the history chapters, for each tool we ask the same four questions: what it is, who built it, when, and why.
</div>

<div class="md">
## The bridge that started it all

The seed is the oldest result in this story that is recognizably topological: **Euler's bridges of Königsberg** (1736) and, for a polyhedron, the formula (1752) \cite{eulerbridges} \cite{eulersolids},

$$\underbrace{V - E + F}_{\substack{\text{vertices, edges,}\\\text{faces}}} \;=\; \underbrace{2}_{\substack{\text{always, for a}\\\text{sphere-like solid}}}$$

Read it the way a topologist would. To decide whether you can cross each bridge exactly once, you keep only the **pattern of connections** and ignore distance, angle, and size. To compute the formula, you may stretch and squash the solid freely, and the number does not change. Both observations say the same thing: some properties of a shape survive deformation, and counting them is the start of topology.

Euler's formula is, in hindsight, the first homological statement ever made, the first Betti number of a simple shape, computed a century and a half before the name existed. Generalize it and the pattern becomes a hole counter. Take the alternating sum of the counts of the $k$-dimensional pieces of a shape; for a polyhedron that is exactly $V - E + F$, a number $\chi$ (read *chi*) that is always $2$ for a sphere-like solid, always $0$ for a doughnut, and always $-2$ for a double-doughnut. This $\chi$ is the **Euler characteristic**. **Enrico Betti** (1871) generalized the pattern to spaces of any dimension, counting the holes of each dimension, the counts that would later be named after him: the **Betti numbers**. The word *homology*, and the claim that you count holes by counting *cycles modulo boundaries*, came from the founder of the whole subject:

<figure>
	<img style="width: 100%" src="poincare.jpg" alt="Henri Poincaré (1854–1912), founder of algebraic topology" />
	<figcaption class="md">**Henri Poincaré (1854–1912)**. His 1895 *Analysis Situs* \cite{poincareanalysissitus} and its five follow-up papers founded algebraic topology: Betti numbers computed properly, the fundamental group, and, famously, the conjecture that bore his name until Perelman proved it with the Ricci flow \cite{perelmanpoincare}.</figcaption>
</figure>

The step from counting holes to the algebra of holes happened in 1925, in conversation. **Emmy Noether**, visiting a topology seminar at Brouwer's home in Blaricum in December 1925, pointed out that the Betti numbers should not be thought of as mere numbers. Each is the **rank** of a whole **abelian group**, the **homology group** $H_k$ \cite{mclarty2006noether}: the number $b_k$ counts the group's independent generators, but the group remembers more. From that moment holes stopped being tallies and became algebraic objects, structures a computer can add, compare, and compute with.
</div>

<div class="md">
## Chains, boundaries, and the boundary of a boundary is empty

To make homology a group you first need a machine that grinds a space into group elements. The standard build, due largely to **Poincaré**, **Brouwer**, **Čech**, and **Alexander** in the 1910s to 1930s, is *simplicial*:

1. **Triangulate.** Cut the shape into small pieces, vertices (0-simplices), edges (1-simplices), triangles (2-simplices), tetrahedra (3-simplices), and so on. This is exactly what a mesh generator does for graphics today.

2. **Build the chains.** A **chain** is a list of pieces you can add together. To make that addition honest you put the pieces into a **free abelian group** $C_k$: every element is a finite sum of the $k$-dimensional pieces with integer coefficients, and the only rules are the ordinary rules of integer arithmetic. A typical element of $C_1$ is a sum of edges with coefficients, like $3e_1 - 2e_2 + 5e_3$, three copies of one edge, minus two of another, plus five of a third.

3. **Apply the boundary operator.** The operator is written $\partial$, the *curly d* you also meet as the **partial derivative** $\partial f/\partial x$ in calculus. The sign was introduced by the Marquis de Condorcet in \citeyear{condorcet1770}; the modern $\partial/\mathrm{d}x$ form is **Legendre's** \cite{legendre1786}, and it was popularized after **Jacobi** reintroduced it in 1841 \cite{historyofmathematicalnotation}. It is often nicknamed *Jacobi's delta*. Read it as *"partial"* or *"the boundary of"*, and think of it as **"take the edge of."** That a calculus sign does topological work is no accident: a boundary is a kind of derivative, it records how a piece *ends*. To compute it, send each simplex to the signed sum of its lower-dimensional faces (an edge to its two endpoints, one $+$ and one $-$; a triangle to its three edges) and extend by linearity, so formally $\partial_k : C_k \to C_{k-1}$. The one equation that makes the whole subject work is

$$\underbrace{\partial_{k-1}\,\partial_{k}}_{\substack{\text{take the boundary,}\\\text{then take it again}}} \;=\; \underbrace{0}_{\substack{\text{the zero map:}\\\text{always nothing}}} \qquad\Longleftrightarrow\qquad \underbrace{\partial^{2}=0}_{\text{"the boundary of a boundary is empty"}}$$

**the boundary of a boundary is empty.** Walk around the edge of a triangle and you return to where you started; take the boundary of that loop and you get nothing. More concretely, run a loop around two adjacent triangles: the shared edge is counted twice with opposite signs and cancels. So the image of $\partial_k$ always lies inside the kernel of $\partial_{k-1}$: boundaries are cycles.

4. **Define the homology group.** Three more signs do the actual work here, so name them first. **$\ker$** (kernel, the German *Kern*, "core") of a map is the set of inputs the map **sends to zero**, the information it forgets. **$\operatorname{im}$** (image, the German *Bild*, "picture") is the set of outputs the map **actually reaches**. And the slash in $A/B$ is a **quotient**: collapse the sub-object $B$ to a single point, so two things differing by an element of $B$ count as the same; read it *"mod"* or *"modulo."* With those in hand, the $k$-cycles that are *not* boundaries, the genuine $k$-dimensional holes, are the closed cycles *modulo* the ones that already bound a solid piece. So declare

$$\boxed{\; \underbrace{H_{k}(X)}_{\substack{\text{the }k\text{-th hole group: cycles}\\\text{that enclose no solid fill}}} \;=\; \underbrace{\ker \partial_{k}}_{\substack{\text{closed }k\text{-chains,}\\\text{cycles that close up}}} \;/\; \underbrace{\operatorname{im}\,\partial_{k+1}}_{\substack{\text{boundaries: cycles}\\\text{that are the edge of a fill}}} \; }$$

The rank of $H_k$ is the $k$-th **Betti number** $b_k$, the number of independent holes of dimension $k$. For the torus (the coffee cup or doughnut) a direct computation gives the whole story. (The answers live in **$\mathbb{Z}$**, the blackboard-bold integers; the bold face is the house convention for famous number systems, so you will also meet $\mathbb{R}$ for the reals and $\mathbb{Q}$ for the rationals. And $\mathbb{Z}^{2}$ means pairs of integers added component-wise.) It says:

$$H_{0}=\underbrace{\mathbb{Z}}_{\text{one connected piece}}, \qquad H_{1}=\underbrace{\mathbb{Z}^{2}}_{\substack{\text{two independent loops:}\\\text{the "one hole" of the joke}}}, \qquad H_{2}=\underbrace{\mathbb{Z}}_{\text{the inner cavity}}$$

so $b_{0}=1$ (one connected piece), $b_{1}=2$ (two independent loops), and $b_{2}=1$ (one cavity). That $b_{1}=2$ is the "one hole" of the joke made precise: the coffee cup and the doughnut have the same homology groups, which is exactly why no topologist can tell them apart \cite{hatcher}.

The modern reformulation of Euler's observation is the **Euler–Poincaré formula**, and it is the moment the whole edifice clicks:

$$\underbrace{\chi(X)}_{\substack{\text{the Euler characteristic:}\\\text{the same number no matter}\\\text{the triangulation}}} \;=\; \sum_{k\ge 0} \underbrace{(-1)^{k}}_{\substack{\text{alternating}\\\text{plus-minus sign}}} \; \underbrace{\operatorname{rank}\,H_{k}(X)}_{\substack{\text{the }k\text{-th Betti number }b_k:\\\text{independent }k\text{-dim holes}}} ,$$

i.e. the hole-counting characteristic is the *alternating sum* of the **ranks** of the homology groups. (For a finitely generated abelian group the *rank* is the number of its independent, or free, generators; for the homology groups this is exactly the Betti number.) The result depends only on how many holes of each dimension a shape has, not on how it was cut up. This is why the same $\chi$ keeps appearing across geometry: in the Gauss–Bonnet theorem, $\iint_{M} K\,dA = 2\pi\chi$ (the integral signs are introduced in [Math III](math_iii)), it reads as *curvature*, and in the de Rham and Chern–Weil theorems it reads as *integral geometry* \cite{derham1931}.

**Why did "cycles modulo boundaries" take a century to invent?** Because it requires the idea that a *set* of shapes could form an algebraic group, an identification of structure with algebra that only the twentieth century practiced. Noether's remark in 1925 was the switch, and Poincaré's 1895 paper supplied the intuition; everything between was notation struggling to catch up \cite{poincareanalysissitus}.
</div>

<div class="md">
## Homotopy: the deformation you are allowed to make

Before going further we need the other pillar algebraic topology stands on: not what shapes *are* (homology) but what they can be *turned into* (homotopy). Two continuous maps $f, g : X \to Y$ are **homotopic** if you can slide one into the other without ever breaking it: there is a continuous family $f_t$ with $f_0 = f$ and $f_1 = g$. Two spaces have the **same homotopy type** if maps go both ways whose compositions are homotopic to the identity, so you can continuously inflate and deflate one into the other.

Homotopy is the precise version of "don't tear, don't glue": deformation under the rule that connected things stay connected. A disk shrinks to a point, and a solid ball shrinks to a point, but a circle does not and a sphere does not. The "how many times can one loop wind around a hole" count is the seed of the **fundamental group**.

<figure>
	<img style="width: 100%" src="konigsberg_bridges.png" alt="Euler's diagram of the seven bridges of Königsberg" />
	<figcaption class="md">Euler's 1736 diagram of the seven bridges of Königsberg. The insight, keep only the *pattern of connections* and discard distances, is the founding act of topology, and the negative answer ("no tour crosses each bridge exactly once") the first theorem of the subject \cite{eulerbridges}.</figcaption>
</figure>

The fundamental group $\pi_{1}(X,x)$, read *pi-one of X at x*, collects the loops in $X$ based at a point $x \in X$ (the $\in$, read *"in,"* means "$x$ is an element of $X$"), up to homotopy, with concatenation as the group operation. (The $\pi$ is the Greek letter pi; the subscript $1$ records that we probe **1-dimensional** holes with **1-dimensional** things, loops. Higher $\pi_n$ use $n$-spheres to probe $n$-dimensional holes, and appear below.) **Poincaré** invented it in 1895 as the algebraic window into spaces \cite{poincareanalysissitus}. Its most distinctive feature is that it is not generally commutative: going around loop $A$ then $B$ can differ from $B$ then $A$ in a space with enough crossing loops. That non-commutativity makes $\pi_1$ strictly richer than the (abelian) homology groups, and it is why, as we will see in the Math III HoTT lab, modern type theory treats *proofs of equality as paths*: the structure of points and paths between them carries the meaning of the space \cite{hottbook} \cite{youvan2024}.
</div>

<div class="md">
## Exact sequences: the ledger of shape

Now the central bookkeeping device, the tool that made the subject read as one connected account rather than a pile of invariants: the **exact sequence**. A sequence of groups and maps

$$\cdots \to A_{k+1} \xrightarrow{\,f_{k+1}\,} A_{k} \xrightarrow{\,f_{k}\,} A_{k-1} \to \cdots$$

is **exact at $A_k$** if the image of $f_{k+1}$ equals the kernel of $f_k$, i.e. everything killed by $f_k$ came from exactly one step back. An **exact sequence** is one exact at every term. Its two extremities deserve names; a *short* exact sequence is

$$0 \longrightarrow A \longrightarrow B \longrightarrow C \longrightarrow 0,$$

which simply says $A$ injects into $B$ and $C$ is the quotient $B/A$; the $0$ at each end says nothing extra conspires (no leftover kernel or cokernel).

The deep discovery, and it took mathematics by surprise, is that **almost every interesting computation in topology is an exact sequence**: the homotopy groups of a fibration, the homology of the pieces of a space, the cohomology ring of a pair, each sits in a long exact sequence relating it to its neighbours. The name is due to **Eilenberg and Steenrod**; as Mac Lane recounted, the *occurrence* of these sequences had been noticed by **Hurewicz** in 1941, but Eilenberg and Steenrod recognized them as the backbone of the subject and gave them the word "exact" \cite{eilenbergmaclane1942} \cite{eilenbergsteenrod1952} \cite{maclane1998categories}.

**Why does exactness matter so much?** Because an exact sequence is a full accounting ledger: if you know $H_k(A)$, $H_k(B)$, and the maps, the exact sequence hands you $H_k(C)$ for free. The skill of getting answers this way is *diagram chasing* (German *Diagrammjägerei*), the professional reflex every algebraic topologist had to master.
</div>

<div class="md">
## Mayer–Vietoris: computing a space from its parts

The first and most famous exact sequence answers a practical question: if you know the homology of two overlapping halves of a space, and of their overlap, do you know the homology of the whole? Yes, via a long exact sequence. Stating it uses three signs. **$\cup$** (*union*) puts the two spaces together: $X = A \cup B$ is everything in $A$ or in $B$. **$\cap$** (*cap*) is the overlap: $A \cap B$ is what the two pieces share. Peano gave both their glyphs in 1895, in the same project that gave set theory its $\in$; the shapes are self-evident, one opens to *contain*, the other pinches to the *common* middle. **$\oplus$** (*direct sum*, loosely *"plus"*) glues two algebraic objects side by side as independent pieces, so an element of $G \oplus H$ is a pair $(g,h)$ added component-wise, like the $x$- and $y$-axes of $\mathbb{R} \oplus \mathbb{R}$ meeting only at the origin. In the sequence below, $H_k(A) \oplus H_k(B)$ lines up every $k$-hole of $A$ next to every $k$-hole of $B$. For a space $X = A \cup B$ with overlap $A \cap B$:

$$\cdots \to H_{k}(A\cap B) \to H_{k}(A)\oplus H_{k}(B) \to H_{k}(X) \to H_{k-1}(A\cap B) \to \cdots$$

This is the **Mayer–Vietoris sequence**, the divide-and-conquer algorithm of algebraic topology: split, compute the parts, glue the answers. Without it, computing the homology of a torus by hand is a chore; with it, it is two lines.

<div class="optional md" data-headline="Two Austrians and an Einstein connection">
The theorem has two inventors, both Austrian, and their story shows how small the mathematical world was in the 1920s. **Walther Mayer** (no relation to the Robert Mayer of energy) took **Leopold Vietoris**'s topology lectures in 1926–27, and later wrote of him: *"I was introduced to topology by my colleague Vietoris, whose lectures in 1926–7 I attended at the local university."* Mayer proved the result for *Betti numbers* in 1929; Vietoris then upgraded it the next year to the full *homology groups* of a space split into overlapping pieces \cite{mayer1929} \cite{vietoris1930}. The exact-sequence version we use today, the ledger form, came later, with Eilenberg and Steenrod.

After fleeing the Nazis, Mayer went to Princeton and became **Albert Einstein's** personal assistant for five years, computing the mathematics of unified field theories while the homology sequence he had written in Vienna sat unused in the journals. Vietoris holds a record almost impossible to beat: born in 1891, he published into his nineties and died in 2002 at 110 \cite{vietorisbio2002} \cite{vietoris1930}.
</div>

So the shape of the story so far: **homology groups count holes, exact sequences let you compute them from pieces, and homotopy tells you what "same shape" means.** Each tool was invented because a concrete computation, bridges, polyhedra, fibred spaces, gluing, would not let go otherwise.
</div>

<div class="md">
## Seifert–van Kampen: the fundamental group by gluing

Mayer–Vietoris computes *homology* (abelian, well-behaved). The **Seifert–van Kampen theorem** does the same job for the *fundamental group*, which is non-abelian and much less well-behaved, and so needs a different gluing sign. Where homology glued with $\oplus$ (independent coordinates), the loop group glues with $*$ (read *"star"*), the **free product**: take the loops of $A$ and of $B$ and allow any word alternating between them, $a_1 b_1 a_2 b_2 \dots$, with *no rule at all* for how an $A$-loop meets a $B$-loop. "Free" means exactly that, the two families of generators stay independent, so the result is usually far bigger and non-commutative. But the two halves share the overlap $A \cap B$, so a loop living in that overlap should be counted **once, not twice**. The **amalgamated free product** $*_{F}$ does precisely this: it is the free product $G * H$ with one extra instruction, the copy of the subgroup $F$ inside $G$ and the copy inside $H$ are declared to be the same loops. If $X = A \cup B$ with open, path-connected $A, B$ whose intersection is also path-connected, then the fundamental group of $X$ is

$$\underbrace{\pi_{1}(X)}_{\substack{\text{loops in the}\\\text{whole space}}} \;=\; \underbrace{\pi_{1}(A)}_{\text{loops in one half}} \;*\;_{\,\underbrace{\pi_{1}(A\cap B)}_{\substack{\text{the shared loops:}\\\text{the thing we glue along}}}}\; \underbrace{\pi_{1}(B)}_{\text{loops in the other half}}$$

"generators from the two halves, one relation from the overlap". The figure-eight (two circles tied at a point) has $\pi_{1} = \mathbb{Z} * \mathbb{Z}$, the free group on two generators; the torus, built from a square, gives $\pi_{1} = \mathbb{Z}^{2}$ (two commuting loops); a sphere, glued from two disks, gives $\pi_{1} = 0$ (simply connected). It is a machine for building fundamental groups out of smaller ones, and its history is gently tangled:

* **Seifert** (1931) proved a version for the closed 3-manifolds he was constructing, in a paper literally about building manifolds by gluing \cite{seifert1931}.
* **van Kampen** (1933) then published the general theorem \cite{vankampen1933}.
* The catch: **van Kampen's original hypotheses were too loose**; as stated the theorem is false without path-connectedness. It took a generation of corrections, culminating in the groupoid formulation by **Ronald Brown** (1967), to nail the right hypotheses \cite{brown1967}.

Why does this matter for us? Because the groupoid version of the theorem is one of the first results *formalized inside homotopy type theory*. In HoTT, types are spaces and paths are proofs, so van Kampen becomes a theorem about how propositions glue, carrying the "amalgamate over the overlap" logic into the structure of proof itself \cite{hottbook} \cite{youvan2024}.
</div>

<div class="md">
## Covering spaces: the fundamental group as symmetry

There is a second, geometric way to understand $\pi_{1}(X)$, the one that makes the fundamental group feel like a **symmetry group** rather than an inventory of loops. A **covering space** $\tilde{X} \xrightarrow{\;p\;} X$ is a local homeomorphism that looks, over every small neighbourhood of $X$, like a stack of identical sheets. The universal example: the real line covers the circle by wrapping (each point of the line maps to a point of the circle), and the plane covers the torus in a doubly-periodic grid.

The beautiful fact, essentially due to **Poincaré** and made formal by the covering space theory of the 1920s to 1930s, is that $\pi_{1}(X,x)$ acts on the sheets by *permuting them* as you walk a loop, and that **the conjugacy classes of subgroups of $\pi_{1}(X)$ classify all covering spaces**. Write it as a dictionary:

$$\{\text{coverings of }X\} \quad\longleftrightarrow\quad \{\text{subgroups of }\pi_{1}(X)\}$$

This is a Galois correspondence, the same shape of theorem as in Galois theory, where subgroups of a Galois group classify field extensions. The man who made *universal coverings* a tool for building a space with a prescribed fundamental group, the $K(G,1)$ spaces, was **Witold Hurewicz** (1935) \cite{hurewicz1935}. If you want a space whose $\pi_1$ is exactly a prescribed group $G$, covering theory tells you how to build it; this is how the Eilenberg–Mac Lane spaces $K(\pi,n)$, the atoms of homotopy theory, were engineered \cite{eilenberglane1945}.
</div>

<div class="md">
## Higher homotopy groups: the serpent swallowing its tail

The fundamental group scans 1-dimensional holes with loops. In 1935 **Hurewicz** generalized *upwards*: let maps from the sphere $S^{n}$ into $X$, up to homotopy, form the group $\pi_{n}(X)$. This opened the door and immediately revealed two things.

**First**, homology and homotopy are cousins, and the statement is written with the sign $\cong$ (read *"con"*, short for *"isomorphic to"*): a wavy line on an equals sign, meaning **the same structure, up to a renaming of the elements**. It is *not* $=$: two groups can be isomorphic without any element of one literally being an element of the other; there just exists a perfect structure-preserving bijection, with a structure-preserving inverse. The word is older than algebra: *isomorphism* was coined in 1819 by the chemist Eilhard Mitscherlich for crystals that share a *shape* but differ in composition, and the sign descends from Leibniz's 1698 tilde for congruent triangles. So read every $\cong$ as "treat these as identical for all structural purposes." The **Hurewicz isomorphism theorem**: for a simply connected space ($\pi_{1} = 0$, every closed loop shrinks to a point), the first *nonzero* homotopy group agrees with the first nonzero homology group, $\pi_{n}(X) \cong H_{n}(X)$ for the first surviving dimension $n$; and in general $\pi_{1}$ abelianizes to $H_{1}$ \cite{hurewicz1935}.

**Second**, the higher homotopy groups are *wild*, far more complicated than homology. Where homology groups are computable and countable, the groups $\pi_{n}(S^{k})$ are, a century later, still largely mysterious. The initial shock came with **Hopf**'s 1931 computation $\pi_{3}(S^{2}) = \mathbb{Z}$, the discovery that a map from a 3-sphere to a 2-sphere could wrap around a "hole" it had no business having \cite{hopf1931fibration}.

The first structural results came from **Freudenthal** (1937), who proved the **suspension theorem**: as you suspend loops to higher dimensions, the homotopy groups begin to *stabilize*, so for large dimension $\pi_{n+k}(S^{k})$ stops changing, giving the **stable homotopy groups of spheres** \cite{freudenthal1937}. Then came **Serre** (1951–1953), who, using **Leray's spectral sequences**, proved the famous **finiteness theorem**: all stable homotopy groups of spheres are *finite*, with exactly two exceptions per dimension, the infinite-cyclic ones $\pi_{n}(S^{n}) = \mathbb{Z}$ (the "same size" degree) and $\pi_{4m-1}(S^{2m}) = \mathbb{Z} \oplus \text{finite}$ (the "Hopf-like" cases) \cite{serre1951} \cite{serre1953}.

<div class="optional md" data-headline="The shock of Serre's theorem">
As \citeauthor{serre1953} liked to recall, his 1951 thesis caused a sensation because people did not even *know* that the homotopy groups of spheres are finitely generated; before spectral sequences they had no way to compute except brute-force geometric construction. Serre's theorem replaced a world of unknown garbage with a single elegant sentence: it is all *finite*, except the two infinite families. From that day algebraic topology stopped being a collection of hand-built invariants and became a theory with a structure theorem, the kind of sentence that makes mathematicians call a field "done" \cite{serre1951}.
</div>
</div>

<div class="md">
## CW complexes: Whitehead's LEGO of spaces

All this machinery computes best on one class of spaces above all others: **CW complexes**, invented and named by **J.H.C. Whitehead** in his 1949 paper *Combinatorial Homotopy I* \cite{whitehead1949}. The idea is simple and utterly powerful. Build spaces out of *cells*: take points (0-cells), glue on circle segments (1-cells), glue on disks (2-cells), glue on balls (3-cells), and so on. The letters stand for the two conditions that make the whole thing work: **C** = *closure-finite* (each cell's closure meets finitely many others) and **W** = *weak topology* (a set is open exactly when it meets each cell in an open set).

Almost every space that matters, from the sphere to the torus to any manifold, is a CW complex, and on CW complexes everything in this chapter becomes *computable*: the cellular chain complex is a finite, explicit object, so its homology is (in principle) computable by counting. Whitehead's payoff was a theorem so strong it carries his name: a weak homotopy equivalence (a map inducing isomorphisms on all homotopy groups) between CW complexes is a **homotopy equivalence**, the spaces are genuinely, deformatibly the same \cite{whitehead1949}.
</div>

<div class="md">
## Categories, functors, and natural equivalences

In 1945 two men, working in very different mathematical cultures, published a paper whose title sounds like a footnote but whose content reshaped all of mathematics: *"General Theory of Natural Equivalences"* \cite{eilenberglane1945}. **Samuel Eilenberg** (a topologist at Michigan) and **Saunders Mac Lane** (an algebraist at Harvard) met over the problem of *naturality*: exactly when is a construction canonical? Their answer required three definitions of striking generality:

* a **category**, a collection of objects and maps between them (the word is borrowed from Aristotle, Kant, and Peirce, who used "category" for the most general classes);
* a **functor**, a systematic map between two categories preserving structure, the word taken from **Carnap's** philosophy of science;
* a **natural transformation**, a family of maps relating two functors "the same way" everywhere.

The punchline Mac Lane loved to tell is the order of invention: the entire point was *natural transformations*; to define them they needed *functors*; to define functors they needed *categories*. Categories were a means, not an end. And the paper, as Mac Lane recorded, was not at first taken seriously, until Steenrod told him that the Eilenberg–Mac Lane paper on categories *"had a more significant impact on him than any other research paper; other papers contributed results, while this paper changed his way of thinking"* \cite{eilenberglane1945} \cite{maclane1998categories} \cite{eilenbergmaclane1942}.

<div class="optional md" data-headline="The most general mathematics there is">
Why is this in a chapter about AI? Because "a category is objects and the maps between them, a functor is a structure-preserving map of whole worlds, and a natural transformation is a uniform way of converting one such world-map into another" is exactly the pattern of modern deep learning, told in the largest possible letters: embeddings are functors from the category of words to the category of vectors, fine-tuning is a natural transformation between embedding-functors, and the identity types of Homotopy Type Theory are the paths of a category whose objects are types. The 1945 paper is the "everything is maps" manifesto the rest of this course has been quietly following \cite{hottbook}.
</div>

From 1945 onward, algebraic topology was written in this language: homology and homotopy became *functors* from the category of topological spaces to the category of groups. That single reframing, shape to algebra to **structure-preserving map**, is the bridge to the AI chapters: the right way to compare two structures is a map from one to the other that respects what matters.
</div>

<div class="md">
## The axioms: Eilenberg–Steenrod homology as an interface

Between 1945 and 1952, **Eilenberg and Steenrod** did something with homology that had no precedent: they *axiomatized* it. In *Foundations of Algebraic Topology* (1952) they showed that any construction deserving the name "homology theory" must satisfy a short list of axioms, functoriality, exactness (the long exact sequence of a pair), homotopy invariance, excision, and the dimension axiom, and that **any two such theories agree** (on reasonable spaces) \cite{eilenbergsteenrod1952}. The idea is as radical as an API contract: you do not need to know *how* the homology is computed, only that it satisfies the interface. If your construction satisfies the axioms, it *is* the one true homology.

This is the move of *specify behaviour, not implementation* that programmers would re-invent decades later as interfaces, protocols, and duck typing, and it is precisely the move under the modern machine-learning "embedding space": no matter how the vectors are produced, what matters is that they transform under an interface (distance, direction, and holes) consistently \cite{eilenbergsteenrod1952}. Later, **Milnor** (1962) proved that one more axiom (additivity) upgrades the entire theory \cite{milnor1962additivity}.
</div>

<div class="md">
## Spectral sequences: Leray's machine from the camp

By the late 1940s the exact sequences had a big brother, and its invention is one of the most remarkable episodes in the history of mathematics. **Jean Leray**, a French mathematician held as a prisoner of war in **Oflag XVII-A in Austria** from 1940 to 1945, faced a dreadful dilemma: if the Germans knew he was a mathematician of value, he would be used or held; if they thought him useless, he might as well be shot. So *he pretended to be a geologist*, and disguised his mathematics as geology too: no topology, no analysis, only a private, made-up theory of "sheaves" and "decompositions" that he pushed through the censorship \cite{leray1946}. Passed to the Academy through neutral channels, Leray's notes arrived in Paris and were recognized for what they were: the foundations of **sheaf theory**, **sheaf cohomology**, and the **spectral sequence**, the tool that eats the homology of a big fibred space and disgorges the homology of the pieces \cite{leray1946}.

A spectral sequence is a successive-approximations machine for exact sequences: instead of one long exact sequence, you get a *book of pages* where page $E_{2}$ summarizes the input data, a differential $d_{2}$ acts, page $E_{3}$ summarizes the result, and so on until the sequence converges: $E_{2} \xrightarrow{\;d_{2}\;} E_{3} \xrightarrow{\;d_{3}\;} \cdots \to E_{\infty}$. In short, where an exact sequence computes in a single ledger, a spectral sequence computes by moving amount after amount, page after page, until nothing moves anymore. Leray used it on the cohomology of maps; a decade of computations followed.

The man who turned Leray's wartime machine into the modern engine of homotopy theory, and used it to prove the finiteness theorem of the previous section, was **Jean-Pierre Serre**, whose 1951 thesis is a landmark as much for the technique as for the theorems \cite{serre1951}. Today spectral sequences are the standard workhorse of the field, and (in a different uniform) the "page-by-page refinement to a fixed point" is exactly the iterative-improvement pattern of optimization and many machine-learning loops.

<div class="optional md" data-headline="A camp university">
Oflag XVII-A became a *university*. Leray, the fake geologist, organized lectures for the officers held there (the camp held thousands of French POWs, many of them academics). The mathematics that came out of it, one of the cornerstones of twentieth-century topology, was computed, in effect, speculatively, for no reason but intellectual survival, in the middle of a war that had made mathematicians a target. Leray survived, returned to normal mathematics after the war, and the "geology" he had been forced to invent became the language of a generation \cite{leray1946}.
</div>
</div>

<div class="md">
## Steenrod operations, Hopf invariant one, and the magic numbers 1, 2, 4, 8

Homology gives groups; cohomology gives *rings* (you can multiply cohomology classes via the **cup product**). But even cohomology rings are not enough, they miss "hidden" operations. In 1947 **Norman Steenrod** discovered the **Steenrod operations**, systematic transformations $\mathrm{Sq}^{k}$ acting on mod-2 cohomology that are *natural* in a very strong sense, commuting with everything and satisfying only a small list of rules \cite{steenrod1947}. They are the reason the cup product is not the end of the story: they encode structure that multiplication alone cannot see. (This is where "natural transformations" from the categories section becomes a working tool: the Steenrod operations are literally natural transformations between cohomology functors.)

The most famous use of Steenrod operations is one of the cleanest theorems in all of mathematics, **Adams' theorem on the Hopf invariant** (1958/1960) \cite{adams1960}. The Hopf fibration $\pi_{3}(S^{2})$ has a numerical **Hopf invariant** measuring how its fibres link; Adams asked *for which spheres* can such an invariant-one map exist, and proved: **only in dimensions 1, 2, 4, and 8.** That single theorem resolves a famous quest: it shows the only normed division algebras over $\mathbb{R}$ are the reals, the complex numbers, the quaternions, and the octonions, because each such algebra is a "nice" map $S^{2n-1} \to S^{n}$ of Hopf invariant one. The numbers 1, 2, 4, 8, emerging from a theorem about the geometry of holes, are among the most improbable facts in mathematics.

The other side of the same coin is **Bott periodicity** (1957–1959): compute the stable homotopy of the matrix groups and you find it is *periodic*. The infinite unitary group $U$ has $\pi_{k}(U)$ a copy of $\mathbb{Z}$ exactly for $k$ odd and $0$ for $k$ even (period **2**); the infinite orthogonal group has period **8**, matching the dimensions of the division algebras \cite{bott1959}. Topology keeps returning to the same small set of numbers: 2, 4, 8.
</div>

<div class="md">
## Reidemeister torsion: when homology is not enough

An honest history must state the failure mode too. In the 1930s topologists realized that homology and the fundamental group were still too coarse: in 1935 **Kurt Reidemeister**, with **Franz** and **de Rham**, showed that certain spaces, the **lens spaces** $L(p,q)$, could have *identical* fundamental group, *identical* homology groups, and still be different as *spaces* \cite{reidemeister1935}. The subtle invariant that separates them is the **Reidemeister torsion**, a value in the units of a group ring, not a group or a ring, that remembers how the pieces glue in a way the Betti numbers cannot.

<div class="optional md" data-headline="The invariant that measures how pieces attach">
The standard example: $L(7,1)$ and $L(7,2)$ both have $\pi_{1} = \mathbb{Z}/7$ and the same homology groups, yet Reidemeister torsion distinguishes them, telling you they are not even *homotopy equivalent*. Torsion is a "gluing-sensitive" invariant, the first known shapes with the same algebra that could not tell them apart. Milnor's 1966 survey *Whitehead Torsion* extended the idea into one of the deepest tools of surgery theory, the foundation of the classification of high-dimensional manifolds \cite{milnor1966torsion}. Whenever all the standard numbers agree and the shapes still differ, reach for a torsion.
</div>

This is the philosophical lesson of algebraic topology, and one machine learning keeps re-learning: **the invariants you choose determine what you can see.** Homology was a huge step; its blind spots took a whole separate layer of subtlety to fix.
</div>

<div class="md">
## Persistent homology: the shape of data

All of the above is a century of pure mathematics. The payoff for this course is where algebraic topology stopped being about spaces and started being about *data*: **topological data analysis (TDA)**. The idea, developed seriously starting with **Edelsbrunner, Letscher, and Zomorodian** (2002) and crystallized by **Zomorodian and Carlsson** (2005), is simple \cite{edelsbrunner2002persistent} \cite{zomorodian2005}:

1. You have a point cloud, 3000 word vectors, 4000 states of attention. No triangles, no cells.
2. Build *everything at once*: draw a ball of radius $r$ around each point, connect two points when their balls touch, fill in triangles when three balls overlap, and so on. As $r$ grows this builds a family of spaces, a **filtration**.
3. Track the *homology groups* $H_k$ (from the chains section) *as $r$ grows*. Holes that appear and quickly disappear are noise; holes that persist across a wide range of radii, **persistent features**, are real structure.
4. Record the birth and death radius of every hole in a **persistence diagram** or **barcode**.

The key theorem, due to **Cohen-Steiner, Edelsbrunner, and Harer** (2007), is the **stability theorem**: moving the point cloud by a small distance changes the barcode by at most that same distance. Persistent homology is *robust to noise* in a rigorous, provable sense, exactly what a method needs before you trust it on messy data \cite{cohensteiner2007} \cite{carlsson2009tda}.

**This is where the chapter meets the machine.** The [Embeddings](embeddinglab) chapter already computes, live, the persistent homology of token-vector clouds, the "Swiss cheese" of meaning: embedding space is full of genuine loops and cavities that persist across scale, which is what makes words cluster into *concepts* that can *wrap* around other concepts \cite{edelsbrunner2002persistent}. And in the [Transformer](transformer) chapter the course runs a live topological analysis of the network's internal states, drawing the persistence barcode of the activation cloud at every layer. See those two chapters for the interactive visualizations: the barcode built there is the exact object this chapter has been about, computed on the shape of a machine's thought.

The newest frontier is **neural persistence**: applying persistent homology not to data *outside* a network but to the network *itself*, to the graph of activations and connections, and using the resulting topological features (how many loops does the loss landscape have? how "complex" is the feature map?) as a *data representation* for understanding generalization \cite{riek2019neural}. Early results are striking: networks that generalize well and poorly differ measurably in the topology of their layers.
</div>

<div class="md">
## Where this leads: types are spaces

The deepest current of this book's own story comes full circle: algebraic topology is now the foundation of **Homotopy Type Theory (HoTT)**, the modern formal foundation that turns theorem-proof back into geometry. The slogan is almost a pun: in HoTT, **types are spaces, and identities are path spaces**, the equality of two objects is a *path* between them, and the group of paths from an object to itself *is* the fundamental group of that object's type \cite{hottbook} \cite{youvan2024}. **Univalence**, the most famous axiom of the theory, says that equivalent types are *identical*, which is the topologist's maxim "coffee cup = doughnut" raised to the level of mathematical foundation.

You have already seen this lab live: the [Math III](math_iii) chapter includes a **HoTT lab** where types, paths, identity, and proof-construction are explored dynamically. The message is one: **shape and reasoning are one subject.** The holes of a space, the loops of a group, the paths of a proof, and the barcodes of an embedding are all the same object seen through different windows. When an AI embeds "king" and "queen" as points such that "queen − king" lands close to "woman − man", it has built a small piece of this subject: a space in which meaning is geometry \cite{youvan2024}.

Algebraic topology, in the end, is the mathematics that learned to ask, of anything, a bridge network, a polyhedron, a cloud of word vectors, a type system, the one question that matters: **what are the holes, and how do they persist?**
</div>

<div class="optional md" data-headline="A compact timeline">
* **1736 / 1752 (Euler).** Königsberg bridges; $\underbrace{V-E+F}_{\substack{\text{vertices minus edges}\\\text{plus faces}}}=\underbrace{2}_{\text{for any convex solid}}$ \cite{eulerbridges} \cite{eulersolids}.
* **1871 (Betti).** "Betti numbers", counting holes per dimension \cite{poincareanalysissitus}.
* **1895 (Poincaré).** *Analysis Situs*: homology, the fundamental group, Betti numbers done right \cite{poincareanalysissitus}.
* **1911 (Brouwer).** Fixed-point theorem and the first topological degree arguments \cite{brouwer1911fixed}.
* **1925 (Noether, at Blaricum).** Betti numbers become *groups* \cite{mclarty2006noether}.
* **1929 / 1930 (Mayer, Vietoris).** Mayer (Betti numbers), Vietoris (homology groups) \cite{mayer1929} \cite{vietoris1930}.
* **1931 (Hopf).** $\underbrace{\pi_{3}(S^{2})=\mathbb{Z}}_{\substack{\text{one integer's worth of}\\\text{linking: the fibration}\\\text{that cracked homotopy open}}}$ \cite{hopf1931fibration}.
* **1931 / 1933 (Seifert, van Kampen).** The fundamental group by gluing \cite{seifert1931} \cite{vankampen1933}.
* **1935 (Hurewicz).** Higher homotopy groups $\pi_{n}$; covering space structures \cite{hurewicz1935}.
* **1935 (Reidemeister, Franz, de Rham).** Torsion; lens spaces \cite{reidemeister1935}.
* **1937 (Freudenthal).** Suspension theorem; stable homotopy groups \cite{freudenthal1937}.
* **1941 (Hurewicz).** Exact sequences (without the name) \cite{eilenbergmaclane1942}.
* **1942 / 1945 (Eilenberg, Mac Lane).** Category, functor, natural transformation \cite{eilenberglane1945}; *Group Extensions and Homology* first \cite{eilenbergmaclane1942}.
* **1945–1952 (Eilenberg, Steenrod).** Axioms of homology; the name "exact" \cite{eilenbergsteenrod1952}.
* **1940–1945 (Leray, in Oflag XVII-A).** Sheaves, spectral sequences \cite{leray1946}.
* **1947 (Steenrod).** Steenrod operations \cite{steenrod1947}.
* **1949 (Whitehead).** CW complexes \cite{whitehead1949}.
* **1951 / 1953 (Serre).** Spectrally computed homotopy; finiteness theorem \cite{serre1951} \cite{serre1953}.
* **1957–1959 (Bott).** Periodicity: $\pi_{k}(U)$ period 2, $\pi_{k}(O)$ period 8 \cite{bott1959}.
* **1958/1960 (Adams).** Hopf invariant one only in 1, 2, 4, 8 \cite{adams1960}.
* **1962 (Milnor).** Additivity axiom; axiomatic homology complete \cite{milnor1962additivity}.
* **1966 (Milnor).** *Whitehead Torsion* survey \cite{milnor1966torsion}.
* **2002 / 2005 (Edelsbrunner, Letscher, Zomorodian; then Zomorodian, Carlsson).** Persistent homology \cite{edelsbrunner2002persistent} \cite{zomorodian2005}.
* **2007 (Cohen-Steiner, Edelsbrunner, Harer).** Stability of persistence diagrams \cite{cohensteiner2007}.
* **2013 / 2024 (HoTT).** Official book; HoTT as a foundation for AI \cite{hottbook} \cite{youvan2024}.
* **2019 (Rieck et al.).** Neural persistence: topology of a network as data \cite{riek2019neural}.
</div>
