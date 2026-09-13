<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Shape of Holes — A Working Algebraic Topology
description: From Euler's bridges to the barcodes of embedded meaning: who turned shape into algebra, when, and why — with the exact sequences as they first appeared, and the persistent homologies that now read the shape of data.
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

The chapters before this one gave you two ways to think about shape. [Geometry I](geometry_i) gave you the *historic* way: space as an object to measure, evolve, and embed. [Geometry II](geometry_ii) gave you the *working* way: the toolkit a machine actually uses — projections that squash data, matrices that rotate it, convolutions that slide over it. This chapter gives you the third way, and it is the deepest of the three: **algebraic topology**, the part of mathematics that turns *shape itself* into *algebra* — groups, rings, exact sequences — so that holes, loops, and connections become objects you can compute with the same arithmetic a computer already owns.

The old joke is exactly right. A topologist cannot tell a coffee cup from a doughnut: you can deform one into the other without tearing, and under that deformation they are *the same shape*. They both have exactly one hole. The question algebraic topology was built to answer is how to make that observation precise — how to *count* holes, *locate* them, and *compare* two shapes by the algebra of their holes alone.

Why should a reader of a course about AI care about the *holes*? Because the raw material of this book is **meaning**, and in the modern view meaning has a shape. A word is a point in a high-dimensional space; a concept is a cloud of points; a *relation* between concepts is a tunnel or a wall inside that cloud. The whole [Embeddings](embeddinglab) chapter runs on this picture. Algebraic topology is the mathematics of *persistent holes* — and, as we will see at the end, it is now being used, live, to inspect the geometry in which a transformer's thoughts actually live.

Like the history chapters, we ask for each tool the same four questions: **what** it was, **who** built it, **when**, and **why** — what need of the age forced it into existence.
</div>

<div class="md">
## I. The bridge that started it all

The seed of algebraic topology is the oldest result in this book's story that is recognizably "topological": **Euler's bridges of Königsberg** (1736) and the formula **$\underbrace{V}_{\text{vertices}} - \underbrace{E}_{\text{edges}} + \underbrace{F}_{\text{faces}} = \underbrace{2}_{\substack{\text{a fixed answer,}\\\text{come what may}}}$** for a polyhedron (1752) \cite{eulerbridges} \cite{eulersolids}. Read them the way a topologist would. To decide whether you can cross each bridge exactly once you ignore distances, angles and sizes — you keep only the **pattern of connections**. To compute $V-E+F$ you may stretch and squash the solid freely; the number does not change. Both observations say the same radical thing: **some properties of a shape survive deformation**. Those properties are *topological invariants*, and counting them is the start of topology.

Euler's formulas are, in modern hindsight, the first two *homological* statements ever made — the first Betti numbers of simple shapes, computed a century and a half before the name existed. To see why, notice one more pattern. Take any polyhedron and let $V,E,F$ be the counts of vertices, edges and faces. Then

$$\underbrace{V}_{\text{vertices: }0\text{-dim pieces}} - \underbrace{E}_{\text{edges: }1\text{-dim pieces}} + \underbrace{F}_{\text{faces: }2\text{-dim pieces}} = \underbrace{\chi}_{\substack{\text{the Euler characteristic:}\\\text{a hole counter that}\\\text{never changes no matter}\\\text{how you stretch or cut}}}$$

is *always* $2$ for a sphere-like solid, *always* $0$ for a donut, *always* $-2$ for a double-donut. **The number $\chi$ — the Euler characteristic — is a hole counter.** The pattern "sum of alternating counts of $k$-dimensional building blocks" was later generalized by **Enrico Betti** (1871), who counted "gaps"/holes of each dimension in a space and named the counts after himself: the **Betti numbers** \cite{poincareanalysissitus}. The word "homology" itself, and the brilliant claim that to count holes you should count *cycles modulo boundaries*, came from the founder of the whole subject:

<figure>
	<img style="width: 100%" src="poincare.jpg" alt="Henri Poincaré (1854–1912), founder of algebraic topology" />
	<figcaption class="md">**Henri Poincaré (1854–1912)**. His 1895 *Analysis Situs* \cite{poincareanalysissitus} and its five follow-up papers founded algebraic topology: Betti numbers computed properly, the fundamental group, and — famously — the conjecture that bore his name until Perelman proved it with the Ricci flow \cite{perelmanpoincare}.</figcaption>
</figure>

The crucial step from "counting holes" to "algebra of holes" happened in 1925, and it happened in a conversation. **Emmy Noether** told the Heidelberg topology seminar (meeting at the nearby village of Blaricum) that Betti numbers should not be thought of as mere numbers: they should be the *ranks* of **abelian groups** — the **homology groups** $H_k$ \cite{mclarty2006noether}. From that moment holes stopped being tallies and became *algebraic objects*, which is to say: objects a machine can add, compare, and cancel.
</div>

<div class="md">
## II. Chains, boundaries, and the equation $\underbrace{\partial^{2}=0}_{\substack{\text{the boundary of a}\\\text{boundary is empty}}}$

To make homology a *group*, you first need a *machine* that grinds a space into group elements. The standard build, due largely to **Poincaré**, **Brouwer**, **Čech** and **Alexander in the 1910s–1930s**, is *simplicial*:

1. **Triangulate.** Cut the shape into small pieces — vertices (0-simplices), edges (1-simplices), triangles (2-simplices), tetrahedra (3-simplices), and so on. This is exactly what a mesh generator does for graphics today.
2. **Build the chains.** Form the *free abelian group* $C_{k}$ of formal integer combinations of $k$-simplices: $C_{k}$ is the set of "deck of cards" sums of the $k$-dimensional pieces. A generic element of $C_{1}$ is a sum of edges with coefficients.
3. **Apply the boundary operator.** Define $\underbrace{\partial_{k}}_{\substack{\text{the boundary}\\\text{operator}}} : \underbrace{C_{k}}_{\substack{\text{formal integer}\\\text{sums of }k\text{-simplices}}} \to \underbrace{C_{k-1}}_{\substack{\text{sums of the }\\(k{-}1)\text{-dim pieces}}} $ to send each simplex to its boundary — vertices of an edge, edges of a triangle, etc. Extend linearly. The one equation that makes the whole subject work is

$$\underbrace{\partial_{k-1}\,\partial_{k}}_{\substack{\text{take the boundary,}\\\text{then take the boundary}\\\text{of what remains}}} \;=\; \underbrace{0}_{\substack{\text{the zero map:}\\\text{you always get nothing}}} \qquad\Longleftrightarrow\qquad \underbrace{\partial^{2}=0}_{\text{"the boundary of a boundary is empty"}}$$

**the boundary of a boundary is empty.** Walk around the edge of a triangle and you return to where you started; take the boundary of that loop and you get nothing. More concretely: run a loop around two adjacent triangles — the shared edge is counted twice with opposite signs and cancels. So *the image of $\partial_{k}$ always lies inside the kernel of $\partial_{k-1}$*: boundaries are cycles.
4. **Define the homology group.** The $k$-cycles that are *not* boundaries are the genuine $k$-dimensional holes. So declare

$$\boxed{\;\underbrace{H_{k}(X)}_{\substack{\text{the }k\text{-th hole group:}\\\text{cycles that do not enclose}\\\text{a solid piece}}} \;=\; \underbrace{\ker \partial_{k}}_{\substack{\text{closed }k\text{-chains:}\\\text{loops and shells that}\\\text{close up on themselves}}} \;/\; \underbrace{\operatorname{im} \partial_{k+1}}_{\substack{\text{the boundaries:}\\\text{cycles that are the edge}\\\text{of a }(k{+}1)\text{-dimensional fill}}} \;}$$

The rank of $H_{k}$ is the $k$-th **Betti number** $b_{k}$ — the number of independent holes of dimension $k$. For the torus (coffee cup/doughnut), a direct computation gives the whole story:

$$H_{0}=\underbrace{\mathbb{Z}}_{\substack{\text{one infinite}\\\text{connected piece}}}, \qquad H_{1}=\underbrace{\mathbb{Z}^{2}}_{\substack{\text{two independent loops:}\\\text{the "one hole" of the}\\\text{coffee-cup joke}}}, \qquad H_{2}=\underbrace{\mathbb{Z}}_{\text{the inner cavity}}$$

so $\underbrace{b_{0}=\;1}_{\substack{\text{one 0-dimensional}\\\text{piece (connected)}}}$ , $\underbrace{b_{1}=\;2}_{\substack{\text{two 1-dimensional}\\\text{loops}}}$ , $\underbrace{b_{2}=\;1}_{\text{one 2-dimensional cavity}}$ . That $\underbrace{b_{1}=2}_{\substack{\text{two 1-dimensional}\\\text{loops = the one hole}\\\text{of the coffee cup}}}$ *is* the "one hole" of the joke made precise: the coffee cup and the doughnut have the same homology groups, which is exactly why no topologist can tell them apart \cite{hatcher}.

The modern reformulation of Euler's observation is the **Euler–Poincaré formula**, and it is the moment the entire edifice clicks:

$$\underbrace{\chi(X)}_{\substack{\text{the Euler characteristic:}\\\text{the same lucky number}\\\text{no matter the triangulation}}} \;=\; \sum_{k\ge 0} \underbrace{(-1)^{k}}_{\substack{\text{alternating}\\\text{plus-minus sign}}} \; \underbrace{\dim H_{k}(X)}_{\substack{\text{the }k\text{-th Betti number:}\\\text{how many independent }k\text{-dim holes}}} ,$$

i.e. the hole-counting characteristic is the *alternating sum* of the ranks of the homology groups — a piece of data that depends only on how many holes of each dimension a shape has, not on how it was cut up. This is why the same $\chi$ keeps appearing across geometry: in the Gauss–Bonnet theorem $\underbrace{\oint K\,dA}_{\substack{\text{all the curvature}\\\text{spread over the surface}}} = \underbrace{2\pi\chi}_{\text{the hole count, disguised}} $ it reads *curvature*, and in the de Rham and Chern–Weil theorems it reads *integral geometry* \cite{derham1931}.

**Why did "cycles modulo boundaries" take a century to invent?** Because it requires the idea that a *set* of shapes could form an algebraic group — the identification of structure with algebra that only the 20th century practiced. Noether's remark in 1925 was the switch, and Poincaré's 1895 paper supplied the intuition; everything between was notation struggling to catch up \cite{poincareanalysissitus}.
</div>

<div class="md">
## III. Homotopy: the deformation you are allowed to make

Before going further, we need the *other* pillar algebraic topology stands on: not what shapes *are* (homology), but what they can be *turned into* (homotopy). Two continuous maps $\underbrace{f,g: X \to Y}_{\substack{\text{two ways of mapping}\\\text{the source space }X\\\text{into the target space }Y}}$ are **homotopic** if you can slide one into the other without at any moment breaking it — if there is a continuous family $\underbrace{f_{t}}_{\substack{\text{one intermediate}\\\text{map for each time }t}}$ with $\underbrace{f_{0}=f}_{\substack{\text{at time }0\\\text{you start}}}$, $\underbrace{f_{1}=g}_{\substack{\text{at time }1\\\text{you arrive}}}$. Two spaces have the **same homotopy type** if there are maps both ways whose compositions are homotopic to the identity: you can continuously *inflate* and *deflate* one into the other.

Homotopy is the precise version of "don't tear, don't glue": it is deformation under the rule that *connected things stay connected*. A disk shrinks to a point; a solid ball shrinks to a point; a circle does **not** shrink to a point; a sphere does **not** shrink to a point. The map from a circle into a space that you cannot distinguish by sliding — the "how many times can one loop wind around a hole?" count — is the seed of the **fundamental group**.

<figure>
	<img style="width: 100%" src="konigsberg_bridges.png" alt="Euler's diagram of the seven bridges of Königsberg" />
	<figcaption class="md">Euler's 1736 diagram of the seven bridges of Königsberg. The insight — keep only the *pattern of connections*, discard distances — is the founding act of topology, and the negative answer ("no tour crosses each bridge exactly once") the first theorem of the subject \cite{eulerbridges}.</figcaption>
</figure>

The fundamental group $\pi_{1}(X,x)$ collects loops in $X$ based at a point $x\in X$, up to homotopy, with concatenation as the group operation. **Poincaré** invented it in 1895 as *the* algebraic window into spaces \cite{poincareanalysissitus}. Its most distinctive feature is that it is not generally commutative: going around loop $A$ then loop $B$ is *different* from $B$ then $A$ in a space with enough crossing loops. This non-commutativity is what makes $\pi_{1}$ strictly richer than the (abelian) homology groups — and it is why, as we will see in Math III's HoTT lab \cite{hottbook} \cite{youvan2024}, modern type theory treats *proofs of equality as paths*: the structure of *points and paths between them* is carrying the "meaning" of the space.
</div>

<div class="md">
## IV. Exact sequences: the ledger of shape

Now we need the central *bookkeeping device* of algebraic topology, the tool that made the subject read like one connected account rather than a pile of invariants: the **exact sequence**. A sequence of groups and homomorphisms

$$\cdots \to \underbrace{A_{k+1}}_{\text{one step back}} \xrightarrow{\,f_{k+1}\,} \underbrace{A_{k}}_{\substack{\text{the meeting point:}\\\text{im } f_{k+1} \;=\; \ker f_{k}\\\text{everything killed here}\\\text{came from the left}}} \xrightarrow{\,f_{k}\,} \underbrace{A_{k-1}}_{\text{one step on}} \to \cdots$$

is **exact** at $A_{k}$ if the image of $f_{k+1}$ equals the kernel of $f_{k}$ — i.e., if everything killed by $f_{k}$ is exactly the stuff coming from one step back. An **exact sequence** is one exact at every term. Its two extremities deserve names: a *short* exact sequence is

$$\underbrace{0}_{\text{nothing before this}} \longrightarrow \underbrace{A}_{\substack{\text{injects cleanly:}\\\text{nothing maps to }0\\\text{except }0}} \longrightarrow \underbrace{B}_{\substack{\text{the middle group:}\\\text{contains }A\text{ as a piece}}} \longrightarrow \underbrace{C}_{\substack{\text{the quotient }B/A\text{:}\\\text{what is left after }A}} \longrightarrow \underbrace{0}_{\text{nothing after this}},$$

which simply says $A$ injects into $B$ and $C$ is the quotient $B/A$; the "0" at each end says nothing conspires (no extra kernel or cokernel).

The deep discovery — and it took mathematics by surprise — is that **almost every interesting computation in topology is an exact sequence**. The homotopy groups of a fibration, the homology groups of the pieces of a space, the cohomology ring of a pair: each sits in a long exact sequence relating it to its neighbours. The name is due to **Eilenberg and Steenrod**; as Mac Lane later recounted, the *occurrence* of these sequences (without the name) had been noticed already by **Hurewicz** in 1941, but it was Eilenberg and Steenrod who recognized them as the backbone of the subject *and gave them the word "exact"* \cite{eilenbergmaclane1942} \cite{eilenbergsteenrod1952} \cite{maclane1998categories}.

**Why does exactness matter so much?** Because an exact sequence is a full accounting ledger: if you know $H_{k}(A)$, $H_{k}(B)$ and the maps, the exact sequence hands you $H_{k}(C)$ for free. German mathematicians of the 1950s called this *Diagrammjägerei* — "diagram chasing" — and it became the professional skill every algebraic topologist had to master.
</div>

<div class="md">
## V. Mayer–Vietoris: computing a space from its parts

The first and most famous exact sequence is the one that answers a practical question: *if I know the homology of two overlapping halves of a space, and of their overlap, do I know the homology of the whole?* Yes — with a long exact sequence. For a space $\underbrace{X \;=\; A \;\cup\; B}_{\substack{\text{the whole space, written}\\\text{as two overlapping parts}\\\text{whose common piece is }A\cap B}}$ with overlap $A\cap B$:

$$\cdots \to \underbrace{H_{k}(A\cap B)}_{\substack{\text{holes in the}\\\text{overlap}}} \to \underbrace{H_{k}(A)\oplus H_{k}(B)}_{\substack{\text{holes in the}\\\text{two halves,}\\\text{added side by side}}} \to \underbrace{H_{k}(X)}_{\substack{\text{holes in}\\\text{the whole}}} \to \underbrace{H_{k-1}(A\cap B)}_{\substack{\text{overlap, one}\\\text{dimension down}}}
\to \cdots$$

This is the **Mayer–Vietoris sequence**, and it is the divide-and-conquer algorithm of algebraic topology: *split, compute the parts, glue the answers*. Without it, computing the homology of a torus by hand is a chore; with it, it is two lines.

<div class="optional md" data-headline="Two Austrians and an Einstein connection">
The theorem has two inventors, both Austrian, and their story shows how small the mathematical world was in the 1920s. **Walther Mayer** (of no relation to the Robert Mayer of energy) had studied at Vienna and, crucially, took **Leopold Vietoris**'s topology lectures in 1926–27 at the local university; Mayer later wrote of Vietoris: *"I was introduced to topology by my colleague Vietoris, whose lectures in 1926–7 I attended at the local university."* Mayer proved the result for *Betti numbers* in 1929; Vietoris then upgraded it the following year to the full *homology groups* of a space decomposed into overlapping pieces \cite{mayer1929} \cite{vietoris1930}. The exact-sequence version we use today — the ledger form — came later, with Eilenberg and Steenrod.

The Hollywood twist: after fleeing the Nazis, Mayer went to Princeton, where he became **Albert Einstein's** personal assistant for five years, computing the mathematics of unified field theories while the homology sequence he had written in Vienna sat unused in the journals. And Vietoris, for his part, holds a record almost impossible to beat: born in 1891, he was the oldest living mathematician, publishing research into his nineties, and died in 2002 at 110 — taking a giant stride past every certificate of the century \cite{vietorisbio2002} \cite{vietoris1930}.
</div>

So the shape of the whole story so far is: **homology groups count holes; exact sequences let you compute them from pieces; homotopy tells you what "same shape" means.** Each tool was invented because a concrete computation — bridges, polyhedra, fibred spaces, gluing — would not let go otherwise.
</div>

<div class="md">
## VI. Seifert–van Kampen: the fundamental group by gluing

Mayer–Vietoris computes *homology* (abelian, well-behaved). The **Seifert–van Kampen theorem** does the same glory job for the *fundamental group*, which is non-abelian and much less well-behaved. If $\underbrace{X \;=\; A \;\cup\; B}_{\substack{\text{again, one space built from}\\\text{two overlapping open pieces}}}$ with open, path-connected $A,B$ whose intersection is also path-connected, then the fundamental group of $X$ is the **amalgamated free product**

$$\underbrace{\pi_{1}(X)}_{\substack{\text{loops in the}\\\text{whole space}}} \;=\; \underbrace{\pi_{1}(A)}_{\substack{\text{loops in}\\\text{one half}}}
\; *_{\;\underbrace{\pi_{1}(A\cap B)}_{\substack{\text{loops shared by}\\\text{both halves: the}\\\text{thing we glue along}}}}\;
\underbrace{\pi_{1}(B)}_{\substack{\text{loops in}\\\text{the other half}}}$$

— "generators from the two halves, one relation from the overlap". The figure-eight (two circles tied at a point) has $\underbrace{\pi_{1}=\mathbb{Z} * \mathbb{Z}}_{\substack{\text{two loops, no}\\\text{relation between them}}}$ , the free group on two generators; the torus, built from a square, gives $\underbrace{\pi_{1}=\mathbb{Z}^{2}}_{\substack{\text{two commuting}\\\text{loops: around, then}\\\text{across the square}}}$ ; a sphere, glued from two disks, gives $\underbrace{\pi_{1}=0}_{\text{no loops at all: simply connected}}$ . It is a machine for *building* fundamental groups out of smaller ones, and its history is gently tangled:

* **Seifert** (1931) proved a version for the spaces he was constructing — closed 3-manifolds — in a paper literally about *building* manifolds by gluing \cite{seifert1931}.
* **van Kampen** (1933) then published the general theorem, "On the connection between the fundamental groups of some related spaces" \cite{vankampen1933}.
* The famous catch: **van Kampen's original hypotheses were too loose** — as stated, the theorem is false without path-connectedness conditions. It took a generation of corrections (culminating in the groupoid formulation by **Ronald Brown**, 1967) to nail the right hypotheses \cite{brown1967}.

Why does this matter for us? Because the groupoid version of the theorem is one of the first results *formalized inside homotopy type theory*, the modern foundation we meet in the Math III HoTT lab. In HoTT, types *are* spaces and paths *are* proofs — so the van Kampen theorem becomes a theorem about how propositions glue, and it carries the very same "amalgamate over the overlap" logic into the structure of proof itself \cite{hottbook} \cite{youvan2024}.
</div>

<div class="md">
## VII. Covering spaces: the fundamental group as symmetry

There is a second, geometric way to understand $\pi_{1}(X)$, and it is the one that makes the fundamental group feel like a **symmetry group** rather than an inventory of loops. A **covering space** $\underbrace{\tilde{X} \xrightarrow{\;p\;} X}_{\substack{\text{a bigger space sitting}\\\text{above }X,\text{ projecting}\\\text{down onto it, locally}\\\text{a stack of sheets}}}$ is a local homeomorphism that looks, over every small neighbourhood of $X$, like a stack of identical sheets. The universal example: the real line covers the circle by wrapping (each point of the line maps to a point of the circle), and the plane covers the torus in a doubly-periodic grid.

The beautiful fact — essentially due to **Poincaré** and made formal by covering space theory of the 1920s–30s — is that $\pi_{1}(X,x)$ acts on the covering sheets by *permuting them* as you walk a loop, and that **the conjugacy classes of subgroups of $\pi_{1}(X)$ classify all covering spaces**. Write it as a dictionary:

$$\underbrace{\{\text{coverings of }X\}}_{\substack{\text{ways of unwrapping}\\\text{the space into}\\\text{identical sheets}}} \quad\longleftrightarrow\quad \underbrace{\{\text{subgroups of }\pi_{1}(X)\}}_{\substack{\text{the loop-symmetries}\\\text{that shuffle those}\\\text{sheets around}}}$$

This is a Galois correspondence — the same shape of theorem as in Galois theory, where subgroups of a Galois group classify field extensions. The mathematician who pushed this analogy hardest was **J.H.C. Whitehead's** colleague and collaborator across the Atlantic, **Samuel Eilenberg** — although the man who made *universal coverings* a tool of computation for spaces with prescribed fundamental group — the $K(G,1)$ spaces — was **Witold Hurewicz** (1935) \cite{hurewicz1935}. If you want a space whose $\pi_{1}$ is exactly a prescribed group $G$, coverage theory tells you how to build it: this is how Eilenberg–Mac Lane spaces $K(\pi,n)$, the atoms of homotopy theory, were engineered \cite{eilenberglane1945}.
</div>

<div class="md">
## VIII. Higher homotopy groups: the serpent swallowing its tail

The fundamental group scans 1-dimensional holes with loops. In 1935, **Hurewicz** had the audacity to generalize *upwards*: let maps from the sphere $S^{n}$ into $X$, up to homotopy, form the group $\pi_{n}(X)$. This opened the door and immediately revealed two things.

**First**, homology and homotopy are cousins. The **Hurewicz isomorphism theorem**: for a simply connected space ($\underbrace{\pi_{1}=0}_{\substack{\text{no loops: every closed}\\\text{loop shrinks to a point -}\\\text{the "no 1-dim holes" case}}}$), the first *nonzero* homotopy group agrees with the first nonzero homology group, $\underbrace{\pi_{n}(X)}_{\substack{\text{maps from the}\\\text{sphere }S^{n}\text{ up to}\\\text{deformation}}} \cong \underbrace{H_{n}(X)}_{\substack{\text{holes in}\\\text{dimension }n}}$ for the first surviving dimension $n$; and in general $\underbrace{\pi_{1}}_{\text{loops (non-commutative)}}$ abelianizes to $\underbrace{H_{1}}_{\text{holes (commutative)}}$ \cite{hurewicz1935}.

**Second**, the higher homotopy groups are *wild* — infinitely more complicated than homology. Whereas homology groups are computable and countable, the groups $\pi_{n}(S^{k})$ are, a century later, still largely mysterious. The initial shock came with **Hopf**'s 1931 computation $\underbrace{\pi_{3}(S^{2})}_{\substack{\text{maps from }S^{3}\to S^{2}\\\text{(the Hopf fibration)}}} = \underbrace{\mathbb{Z}}_{\substack{\text{one integer's worth of }\\\text{winding/linking}}} $ — the discovery that a map from a 3-sphere to a 2-sphere could wrap around a "hole" it had no business having \cite{hopf1931fibration}. 

The first structural results came from **Freudenthal** (1937), who proved the **suspension theorem**: as you suspend loops to higher dimensions, homotopy groups begin to *stabilize* — for large dimension, $\underbrace{\pi_{n+k}(S^{k})}_{\substack{\text{maps from }S^{n+k}\to S^{k}\\\text{(loops on higher}\\\text{and higher spheres)}}}$ stops changing, giving the **stable homotopy groups of spheres** \cite{freudenthal1937}. And then came **Serre** (1951–1953), who, using **Leray's spectral sequences**, proved the famous **finiteness theorem**: all stable homotopy groups of spheres are *finite* — with exactly two exceptions per dimension, the infinite-cyclic ones $\underbrace{\pi_{n}(S^{n})}_{\substack{\text{maps }S^{n}\to S^{n}:\\\text{the "same size" degree}}} = \underbrace{\mathbb{Z}}_{\substack{\text{one integer}\\\text{degree per map}}}$ and $\underbrace{\pi_{4m-1}(S^{2m})}_{\substack{\text{maps }S^{4m-1}\to S^{2m}:\\\text{the "Hopf-like" cases}}} = \underbrace{\mathbb{Z}\oplus\text{finite}}_{\substack{\text{one infinite copy}\\\text{plus a finite blob}}}$ \cite{serre1951} \cite{serre1953}.

<div class="optional md" data-headline="The shock of Serre's theorem">
As \citeauthor{serre1953} himself liked to recall, the reason his 1951 thesis caused a sensation was that people did not even *know* that the homotopy groups of spheres are finitely generated — before spectral sequences, they had literally no way to compute except brute-force geometric construction. Serre's theorem replaced a world of unknown garbage with a single elegant sentence: then it is all *finite*, except the two infinite families. From that day, algebraic topology stopped being a collection of hand-built invariants and became a *theory with structure theorem* — the kind of sentence that makes mathematicians call a field "done" \cite{serre1951}.
</div>
</div>

<div class="md">
## IX. CW complexes: Whitehead's LEGO of spaces

All of this machinery — homology, exact sequences, homotopy groups — computes best on one class of spaces above all others: **CW complexes**, invented (and named) by **J.H.C. Whitehead** in his 1949 paper *Combinatorial Homotopy I* \cite{whitehead1949}. The idea is childishly simple and utterly powerful. Build spaces out of *cells*: take points (0-cells), glue on circle segments (1-cells), glue on disks (2-cells), glue on balls (3-cells), and so on forever. The letters stand for the two conditions that make the whole thing work: **C** = *closure-finite* (each cell's closure meets finitely many others) and **W** = *weak topology* (a set is open exactly when it meets each cell open). 

Almost every space that matters, from the sphere to the torus to any manifold, is a CW complex, and on CW complexes everything in this chapter becomes *computable*: the cellular chain complex of a CW complex is a finite, explicit object, so its homology is (in principle) computable by counting. Whitehead's payoff was a theorem so strong it carries his name: a weak homotopy equivalence (a map that induces isomorphisms on all homotopy groups) between CW complexes is a **homotopy equivalence** — the spaces are genuinely, deformatibly the same \cite{whitehead1949}. Every notebook computation in this subject secretly lives on Whitehead's LEGO bricks.
</div>

<div class="md">
## X. Categories, functors, and natural equivalences

In 1945 two men, working on opposite sides of a union of very different mathematical cultures, published a paper whose title sounds like a footnote but whose content reshaped all of mathematics: *"General Theory of Natural Equivalences"* \cite{eilenberglane1945}. **Samuel Eilenberg** (a topologist at Michigan) and **Saunders Mac Lane** (an algebraist at Harvard) had met over the problem of *naturality*: exactly when is a construction canonical? Their answer required three definitions of stupefying generality:

* a **category** — a collection of objects and maps between them (borrowing the word from Aristotle, Kant and Peirce, who used "category" for the most general classes);
* a **functor** — a systematic map between two categories preserving structure, the word taken from **Carnap's** philosophy of science;
* a **natural transformation** — a family of maps relating two functors "the same way" everywhere.

The punchline Mac Lane loved to tell is the order of invention: the entire point was *natural transformations*; to define them they needed *functors*; to define functors they needed *categories*. Categories were a means, not an end. And the paper, as Mac Lane recorded, was not at first taken seriously — until Steenrod told him that the Eilenberg–Mac Lane paper on categories *"had a more significant impact on him than any other research paper; other papers contributed results, while this paper changed his way of thinking"* \cite{eilenberglane1945} \cite{maclane1998categories} \cite{eilenbergmaclane1942}.

<div class="optional md" data-headline="The most general mathematics there is">
Why is this in a chapter about AI? Because "a category is objects and the maps between them, a functor is a structure-preserving map of whole worlds, a natural transformation is a uniform way of converting one such world-map into another" is *exactly* the pattern of modern deep learning told in the largest possible letters: embeddings are functors from the category of words to the category of vectors; fine-tuning is a natural transformation between embedding-functors; the identity types of Homotopy Type Theory are the paths of a category whose objects are types. The 1945 paper is the "everything is maps" manifesto that the rest of this course has been quietly following \cite{hottbook}.
</div>

Algebraic topology was, from 1945 onward, written in this language: homology and homotopy became *functors* from the category of topological spaces to the category of groups. That single reframing — shape to algebra to **structure-preserving map** — is the intellectual tool this chapter is most interested in, and it is the bridge to the AI chapters: *the right way to compare two structures is a map from one to the other that respects what matters*.
</div>

<div class="md">
## XI. The axioms: Eilenberg–Steenrod homology as an interface

Between 1945 and 1952, **Eilenberg and Steenrod** did something with homology that had no precedent: they *axiomatized* it. In *Foundations of Algebraic Topology* (1952), they showed that any construction deserving the name "homology theory" must satisfy a short list of axioms — functoriality, exactness (the long exact sequence of a pair), homotopy invariance, excision, and the dimension axiom — and that **any two such theories agree** (on reasonable spaces) \cite{eilenbergsteenrod1952}. The idea was as radical as an API contract: you don't need to know *how* the homology is computed, only that it satisfies the interface. If your construction satisfies the axioms, it *is* the one true homology.

This is the mental move — *specify behaviour, not implementation* — that programmers would re-invent decades later as interfaces, protocols and duck typing; and it is precisely the move underneath the modern machine-learning "embedding spaces": no matter how the vectors get produced, what matters is that they transform under an *interface* (distance, direction, and holes) consistently \cite{eilenbergsteenrod1952}. Later, **Milnor** (1962) would prove that one more axiom (additivity) upgrades the entire theory \cite{milnor1962additivity}.
</div>

<div class="md">
## XII. Spectral sequences: Leray's machine from the camp

By the late 1940s the exact sequences had a big brother, and its invention is one of the most remarkable episodes in the history of mathematics — the birth of a monstrously powerful machine in the worst of human circumstances. **Jean Leray**, a French mathematician who was a prisoner of war in **Oflag XVII-A in Austria** from 1940 to 1945, faced a dreadful dilemma: if the Germans knew he was a mathematician of value, he would be used or held; if they thought him useless, he might as well be shot. So *he pretended to be a geologist* — and, to avoid incriminating himself, he disguised his *mathematics* as geology too: no topology, no analysis, only a private, made-up theory of "sheaves" and "decompositions" that he pushed through the censorship \cite{leray1946} \cite{vietorisbio2002}. Passed to the Academy through neutral channels, Leray's notes arrived in Paris and were recognized for what they were: the foundations of **sheaf theory**, **sheaf cohomology**, and the **spectral sequence** — the tool that eats the homology of a big fibred space and disgorges the homology of the pieces \cite{leray1946}.

A spectral sequence is a *successive-approximations machine* for exact sequences: instead of one long exact sequence, you get a *book of pages* where page $\underbrace{E_{2}}_{\substack{\text{the second page:}\\\text{sums up the raw}\\\text{input data}}}$ summarizes the input data, a differential $\underbrace{d_{2}}_{\substack{\text{the page-2}\\\text{differentiation}\\\text{step}}}$ acts, page $\underbrace{E_{3}}_{\substack{\text{the next page:}\\\text{the refined result}\\\text{after }d_{2}}}$ summarizes the result, and so on until the sequence converges: $\underbrace{E_{2} \xrightarrow{\;d_{2}\;} E_{3} \xrightarrow{\;d_{3}\;} \cdots \to E_{\infty}}_{\substack{\text{page after page until}\\\text{nothing moves anymore:}\\\text{that fixed page is the}\\\text{computed graded object}}}$ . In short: **where an exact sequence computes in a single ledger, a spectral sequence computes by moving amount after amount, page after page, until nothing moves anymore.** Leray used it on the cohomology of maps; a decade of computations followed.

The man who turned Leray's wartime machine into the modern engine of homotopy theory — and who used it to prove the finiteness theorem of Section VIII — was **Jean-Pierre Serre**, whose 1951 thesis is a landmark as much for the technique as for the theorems \cite{serre1951}. Today spectral sequences are the standard workhorse of every computation in the field, and (in a different uniform) the "page-by-page refinement to a fixed point" is exactly the iterative-improvement pattern of optimization and many machine-learning loops.

<div class="optional md" data-headline="A camp university">
Oflag XVII-A was not only a prison camp; it became a *university*. Leray, the fake geologist, organized lectures for the officers held there (the camp held thousands of French POWs, many of them academics). The mathematics that came out of it — one of the cornerstones of twentieth-century topology — was computed, in effect, *speculatively*, for no reason but intellectual survival, in the middle of a war that had made mathematicians a target. Leray survived, returned to normal mathematics after the war, and the "geology" he had been forced to invent became the language of a generation \cite{leray1946}.
</div>
</div>

<div class="md">
## XIII. Steenrod operations, Hopf invariant one, and the magic numbers 1, 2, 4, 8

Homology gives groups; cohomology gives *rings* (you can multiply homology classes via the **cup product**). But even cohomology rings are not enough — they miss "hidden" operations. In 1947, **Norman Steenrod** discovered the **Steenrod operations**: systematic transformations $\underbrace{\mathrm{Sq}^{k}}_{\substack{\text{a }k\text{-th power}\\\text{operation on mod-2}\\\text{cohomology classes}}}$ acting on mod-2 cohomology that are *natural* in a very strong sense, commuting with everything and satisfying only a small list of rules \cite{steenrod1947}. Steenrod operations are the reason the cup product isn't the end of the story: they encode structure that multiplication alone cannot see. (This is where "natural transformations" from Section X becomes a *working* tool: the Steenrod operations are literally natural transformations between cohomology functors.)

The most famous *use* of Steenrod operations is one of the cleanest theorems in all of mathematics, **Adams' theorem on the Hopf invariant** (1958/1960) \cite{adams1960}. The Hopf fibration $\underbrace{\pi_{3}(S^{2})}_{\text{maps from }S^{3}\text{ to }S^{2},\text{ up to deformation}}$ has a numerical **Hopf invariant** $\underbrace{1}_{\substack{\text{how many times the}\\\text{fibres of the map link}\\\text{around each other}}}$ measuring how its fibres link; Adams asked *for which spheres* can such an invariant-one map exist, and proved: **only in dimensions 1, 2, 4 and 8.** That single theorem — obtained by an argument, as he said, "constructed from the Steenrod operations" — resolves a famous quest: it shows the only normed division algebras over $\mathbb{R}$ are the reals, the complex numbers, the quaternions and the octonions, because each such algebra *is* a "nice" map $\underbrace{\;\;S^{\,2n-1} \xrightarrow{\;\;h\;\;} S^{\,n}\;\;}_{\substack{\text{a sphere sitting above}\\\text{a sphere, with its fibres}\\\text{linked once around the target}\\(\text{Hopf invariant }1\text{)}}}$ of Hopf invariant one. The number 1, 2, 4, 8, popping out of a theorem about the geometry of holes, is one of the most improbable facts in mathematics.

The other side of the same coin is **Bott periodicity** (1957–1959): compute the stable homotopy of the matrix groups, and you discover it is *periodic* — the infinite unitary group $U$ has $\underbrace{\pi_{k}(U)}_{\substack{\text{holes of the infinite}\\\text{matrix group},k\text{ fixed}}}$ a copy of $\underbrace{\mathbb{Z}}_{\substack{\text{one hole when }k\text{ is odd}}} $ exactly for $k$ odd and $\underbrace{0}_{\text{no hole when }k\text{ is even}}$ (period **2**); the infinite orthogonal group has period **8**, matching the dimensions of the division algebras \cite{bott1959}. Topology keeps bumping into the same small calendar: $2$, $4$, $8$.
</div>

<div class="md">
## XIV. Reidemeister torsion: when homology is not enough

A honest history must state the failure mode too. In the 1930s, topologists realized that homology and the fundamental group were jointly still too coarse: in 1935, **Kurt Reidemeister**, along with **Franz** and **de Rham**, discovered that certain spaces — the **lens spaces** $\underbrace{L(p,q)}_{\substack{\text{a }p\text{-fold space assembled}\\\text{from }p\text{ lenses, glued}\\\text{with a }q\text{-twist}}}$ — could have *identical* fundamental group, *identical* homology groups, and still be different as *spaces* \cite{reidemeister1935}. The subtle invariant that separates them is the **Reidemeister torsion**, a piece of algebra that is not a group or a ring but a *value in the units of a group ring* — an object that remembers "how the pieces glue" in a way the Betti numbers cannot.

<div class="optional md" data-headline="The invariant that measures how pieces attach">
The standard example: $\underbrace{L(7,1)}_{\substack{\text{lens space with}\\\text{parameter }q=1}}$ and $\underbrace{L(7,2)}_{\substack{\text{lens space with}\\\text{parameter }q=2}}$ both have $\underbrace{\pi_{1}=\mathbb{Z}/7}_{\substack{\text{the same loops:}\\\text{one 7-fold turn}}} $ and the same homology groups. Yet Reidemeister torsion distinguishes them — and, a famous twist, tells you that they are not even *homotopy equivalent*, while being the first known examples of shapes with the "same algebra that could not tell them apart". Black-boxed: torsion is a "gluing-sensitive" invariant. Milnor's 1966 survey *Whitehead Torsion* extended the idea into one of the deepest tools of surgery theory, the foundation of the classification of high-dimensional manifolds \cite{milnor1966torsion}. Whenever *all the standard numbers agree and the shapes still differ*, reach for a torsion.
</div>

This is the philosophical lesson of algebraic topology, and it is a lesson machine learning repeatedly re-learns: **the invariants you choose determine what you can see.** Homology was a huge step; its blind spots took a whole separate layer of subtlety to fix.
</div>

<div class="md">
## XV. Persistent homology: the shape of data

All of the above is a century of pure mathematics. The payoff for this course is where algebraic topology stopped being about spaces and started being about *data*: **topological data analysis (TDA)**. The idea, developed seriously starting with **Edelsbrunner, Letscher and Zomorodian** (2002) and crystallized by **Zomorodian and Carlsson** (2005), is breathtakingly simple \cite{edelsbrunner2002persistent} \cite{zomorodian2005}:

1. You have a point cloud — 3000 word vectors, 4000 states of attention. No triangles, no cells. 
2. Build *everything at once*: draw a ball of radius $r$ around each point; connect two points when their balls touch; fill in triangles when three balls overlap; and so on. As $r$ grows, this builds a family of spaces — a **filtration**.
3. Track the *homology groups* $H_{k}$ (from Section II!) *as $r$ grows*. Holes that appear and quickly disappear are noise; holes that persist across a wide range of radii — **persistent features** — are real structure.
4. Record the birth and death radius of every hole in a **persistence diagram** or **barcode**.

The miraculous theorem, due to **Cohen-Steiner, Edelsbrunner and Harer** (2007), is the **stability theorem**: moving the point cloud by a small distance changes the barcode by at most that same small distance. Persistent homology is *robust to noise* in a rigorous, provable sense — which is exactly what a method needs before you trust it on messy data \cite{cohensteiner2007} \cite{carlsson2009tda}.

**And this is where this chapter meets the machine.** The [Embeddings](embeddinglab) chapter of this course already computes, live, the persistent homology of token-vector clouds — the famous "Swiss cheese" of meaning: embedding space is homological swiss cheese, full of genuine loops and cavities that persist across scale, which is what makes words cluster into *concepts* that can *wrap* around other concepts \cite{edelsbrunner2002persistent}. And in the [Transformer](transformer) chapter, the course runs a live *topological state analysis* of the network's internal states — computing the Betti numbers (the rank of the homology groups!) of the cloud of activations at every layer, and drawing the persistence barcode on screen. See those two chapters for the interactive visualizations: the barcode you will see being built there is the exact object this chapter has been about, computed on the shape of a machine's thought.

The newest frontier is **neural persistence**: applying persistent homology not to data *outside* a network but to the network *itself* — to the graph of activations and connections — and using the resulting topological features (how many loops does the loss landscape have? how "complex" is the feature map?) as a *data representation* for understanding generalization \cite{riek2019neural}. Early results are striking: networks that generalize well and poorly differ measurably in the topology of their layers.
</div>

<div class="md">
## XVI. Where this leads: types are spaces

The deepest current chapter of this book's own story comes full circle: algebraic topology is now the foundation of **Homotopy Type Theory (HoTT)**, the modern formal foundation that turns theorem-proof back into geometry. The slogan is almost a pun: in HoTT, **types are spaces, and identities are path spaces** — the equality of two objects is a *path* between them, and the group of paths from an object to itself *is* the fundamental group of that object's type \cite{hottbook} \cite{youvan2024}. Univalence — the most famous axiom of the theory — says that equivalent types are *identical*, which is precisely the topologist's maxim "coffee cup = doughnut" raised to the level of mathematical foundation.

You have already seen this lab live: the [Math III](math_iii) chapter of this course includes a **HoTT lab** where types, paths, identity and proof-construction are explored dynamically. Between that lab and this chapter, the message is one: **shape and reasoning are one subject.** The holes of a space, the loops of a group, the paths of a proof and the barcodes of an embedding are all the same object seen through different windows. When an AI embeds "king" and "queen" as points such that "queen − king" lands close to "woman − man", it has — consciously or not — built a small piece of this subject: a space in which meaning is conveyor-belt geometry \cite{youvan2024}.

Algebraic topology, in the end, is the mathematics that learned to ask, of anything — a bridge network, a polyhedron, a cloud of word vectors, a type system — the one question that matters: **what are the holes, and how do they persist?**
</div>

<div class="optional md" data-headline="A compact timeline">
* **1736 / 1752** — Euler: Königsberg bridges; $\underbrace{V-E+F}_{\substack{\text{vertices minus edges}\\\text{plus faces}}}=\underbrace{2}_{\text{for any convex solid}}$ \cite{eulerbridges} \cite{eulersolids}.
* **1871** — Betti: "Betti numbers" — counting holes per dimension \cite{poincareanalysissitus}.
* **1895** — Poincaré, *Analysis Situs*: homology, the fundamental group, Betti numbers done right \cite{poincareanalysissitus}.
* **1911** — Brouwer: fixed-point theorem and the first topological degree arguments \cite{brouwer1911fixed}.
* **1925** — Noether at Blaricum: Betti numbers become *groups* \cite{mclarty2006noether}.
* **1929 / 1930** — Mayer–Vietoris: Mayer (Betti numbers), Vietoris (homology groups) \cite{mayer1929} \cite{vietoris1930}.
* **1931** — Hopf: $\underbrace{\pi_{3}(S^{2})=\mathbb{Z}}_{\substack{\text{one integer's worth of}\\\text{linking: the fibration that}\\\text{cracked homotopy open}}}$ \cite{hopf1931fibration}.
* **1931 / 1933** — Seifert–van Kampen: the fundamental group by gluing \cite{seifert1931} \cite{vankampen1933}.
* **1935** — Hurewicz: higher homotopy groups $\pi_{n}$; covering space structures \cite{hurewicz1935}.
* **1935** — Reidemeister, Franz, de Rham: torsion; lens spaces \cite{reidemeister1935}.
* **1937** — Freudenthal: suspension theorem; stable homotopy groups \cite{freudenthal1937}.
* **1941** — Hurewicz: exact sequences (without the name) \cite{eilenbergmaclane1942}.
* **1942 / 1945** — Eilenberg–Mac Lane: category, functor, natural transformation \cite{eilenberglane1945}; *Group Extensions and Homology* first \cite{eilenbergmaclane1942}.
* **1945–1952** — Eilenberg–Steenrod: axioms of homology; the name "exact" \cite{eilenbergsteenrod1952}.
* **1942–1946** — Leray in Oflag XVII-A: sheaves, spectral sequences \cite{leray1946}.
* **1947** — Steenrod operations \cite{steenrod1947}.
* **1949** — J.H.C. Whitehead: CW complexes \cite{whitehead1949}.
* **1951 / 1953** — Serre: spectrally computed homotopy; finiteness theorem \cite{serre1951} \cite{serre1953}.
* **1957–1959** — Bott periodicity: $\pi_{k}(U)$ period 2, $\pi_{k}(O)$ period 8 \cite{bott1959}.
* **1958/1960** — Adams: Hopf invariant one only in 1, 2, 4, 8 \cite{adams1960}.
* **1962** — Milnor: additivity axiom; axiomatic homology complete \cite{milnor1962additivity}.
* **1966** — Milnor: *Whitehead Torsion* survey \cite{milnor1966torsion}.
* **2002 / 2005** — Persistent homology: Edelsbrunner–Letscher–Zomorodian, then Zomorodian–Carlsson \cite{edelsbrunner2002persistent} \cite{zomorodian2005}.
* **2007** — Stability of persistence diagrams \cite{cohensteiner2007}.
* **2013 / 2024** — HoTT official book; HoTT as a foundation for AI \cite{hottbook} \cite{youvan2024}.
* **2019** — Neural persistence: topology of a network as data \cite{riek2019neural}.
</div>