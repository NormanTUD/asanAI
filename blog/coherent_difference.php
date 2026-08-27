<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Coherent Difference
description: Why meaning is built from local differences glued together coherently, the structural idea behind embeddings, space, and modern AI.
icon: &#128376;
part: 4
order: 20
color: accent
topics: language, math-i, math-ii, philosophy
-->

<div class="md">
Before we open the <a href="embeddinglab">Embeddings chapter</a>, there is one idea worth holding in your head. It is not a theorem. It is not even an equation. It is the structural intuition that quietly holds together a surprising amount of what we are about to do, and that you will meet again and again in slightly different costumes: in topology, in sheaves, in category theory, in Homotopy Type Theory, in the geometry of an embedding space, and, in the simplest concrete case, in how a Transformer turns a list of token IDs into something that means.
</div>

<div class="md">
## The one sentence

$$
\boxed{
\textbf{Difference does not have to be erased for unity to emerge.}
}
$$

Equivalently:

$$
\boxed{
\text{global unity}
\;=\;
\text{local difference}
\;+\;
\text{coherent transitions between the locals}.
}
$$

This is the lens of the chapter. Everything else is variations on it.
</div>

<div class="md">
## The chain

The whole idea can be written as one arrow chain. Read top-to-bottom:

$$
\boxed{
\begin{aligned}
&\text{Distinction} \\
&\quad\downarrow \\
&\text{Relation} \\
&\quad\downarrow \\
&\text{Transformation} \\
&\quad\downarrow \\
&\text{Locality} \\
&\quad\downarrow \\
&\text{Compatibility} \\
&\quad\downarrow \\
&\text{Coherence} \\
&\quad\downarrow \\
&\text{Gluing} \\
&\quad\downarrow \\
&\text{Globality} \\
&\quad\downarrow \\
&\text{Invariance}
\end{aligned}
}
$$

Each arrow is the same story told at a successively more structured level:

* **Distinction.** Before anything can be related, something has to be marked off from something else. \citeauthor{spencerbrown1969form} (\citeyear{spencerbrown1969form}) made this the literal first axiom of his calculus: *Draw a distinction*, i.e. cross a boundary, and one side becomes marked, the other unmarked \cite{spencerbrown1969form}. Without a first cut, there is nothing to talk about.

* **Relation.** Once two things are distinct, they can be in relation: equal, similar, near, mapped to each other. A set $A = \{a,b,c\}$ knows only that $a,b,c \in A$. A relation adds structure on top.

* **Transformation.** A relation that is not just “is connected to” but “can be carried along”, i.e. a function, a morphism, a transport. This is where the picture stops being static.

* **Locality.** Transformation forces us to ask *where* this happens. Topology's answer is austere: a space is a set $X$ together with a collection $\mathcal{O}$ of open sets, so that for any point $x$ we can ask which neighborhoods contain it \cite{topology_wiki}. We do not need a distance. We only need the idea of “near” without a metric.

* **Compatibility.** If two open sets overlap, the data on each must agree on the overlap. This is the sheaf condition in one line: local sections that match on pairwise intersections can be glued \cite{sheaf_mathematics}.

* **Coherence.** Compatibility can be thin (sections are *equal* on the overlap) or thick (sections are *equivalent* via a homotopy). Thick compatibility has its own structure: equivalences must themselves be coherent on triple overlaps \cite{higher_category_wiki}.

* **Gluing.** When local pieces are coherent, they assemble into a unique global object. A sheaf is exactly a gadget whose global sections are determined by compatible local sections \cite{sheaf_mathematics}.

* **Globality.** What looked like a patchwork of perspectives turns out to be *one* thing, not because the patches are identical, but because their seams fit.

* **Invariance.** The result is no longer tied to any particular choice of cover or chart. It survives every legitimate change of viewpoint. This is what manifold, topological space, fiber bundle \cite{fiber_bundle_wiki}, type, and object in a category all have in common.

Every mathematical theory we will touch on in this course sits somewhere on this chain.
</div>

<div class="md">
## Where the chain shows up in this textbook

$$
\begin{array}{c|c}
\text{Theory} & \text{Where it lands on the chain} \\
\hline
\text{Sets} & \text{Distinction, Relation} \\
\text{Type theory} & \text{Relation, Transformation, with type-level structure} \\
\text{Category theory} & \text{Transformation, Coherence} \\
\text{Topology} & \text{Locality} \\
\text{Sheaves} & \text{Locality} \to \text{Gluing} \to \text{Globality} \\
\infty\text{-Sheaves, HoTT} & \text{Compatibility as higher Coherence} \\
\text{Fiber bundles, manifolds} & \text{Globality + Invariance} \\
\text{Embedding spaces} & \text{All of the above, applied to meaning} \\
\text{Transformer architecture} & \text{Gluing local token data into a global sequence meaning}
\end{array}
$$
</div>

<div class="optional md" data-headline="A note on what this chapter is, and is not">
This chapter does *not* introduce any new technical machinery. There is no live demo, no equation to memorize, no Python cell to run. It is a piece of conceptual scaffolding. Its only job is to plant a single intuition in your head so that when you reach the Embeddings chapter, the word “space” does not feel like a metaphor and the word “local” does not feel like a convenience.

If you already know topology, sheaves, category theory and HoTT well, you can skim this chapter in two minutes. If you know none of them, the chapter still works: every section is read on two levels, a hand-wavy English level, and a one-line formal level. The hand-wavy level is the one that will stay with you. The formal level is there to show that there is a real mathematical idea behind the metaphor.
</div>

<div class="md">
## 1. The first move: distinction

<figure>
	<img src="laws_of_form_cover.jpg" alt="Cover of Spencer-Brown's Laws of Form (1969)" style="max-width: 200px; background: white; padding: 8px;" />
	<figcaption class="md">\citealternativetitle{spencerbrown1969form}'s \citetitle{spencerbrown1969form}, first published in \citeyear{spencerbrown1969form}, the slender volume that turned “draw a distinction” into the foundation of a calculus.</figcaption>
</figure>

Spencer-Brown begins his book with an instruction that is also an axiom:

<div class="smart-quote" data-cite="spencerbrown1969form" data-after="Notes to Chapter 2">
Draw a distinction.
</div>

A single boundary drawn across an unmarked plane produces two states, marked on one side, unmarked on the other. One axiom then governs what can happen:

$$
\neg\neg\, \;=\; \neg
$$

(Apply the mark twice and you are back where you started) From this axiom, the entire Boolean calculus of propositions falls out \cite{spencerbrown1969form}. The point, for us, is not the algebra. The point is that Spencer-Brown placed *distinction itself* at the foundation of mathematics: the act that splits one world into two is the act from which everything else is built.

The philosophical point is older than the algebraic one. The article on \citetitle{distinction_philosophy} traces the concept of a *real distinction* (a difference that exists in the world, not merely in the mind) from Aristotle's distinction between actuality and potentiality, through Aquinas's distinction between essence and existence, to Kant's distinction between appearance and thing-in-itself \cite{distinction_philosophy}. Each of these is the same move: carve a boundary, and you get two sides.

What the modern formalizations buy us is a promise: once we have the move, we can build the rest.
</div>

<div class="md">
## 2. From distinction to structure

A set is the simplest structure that can hold distinctions. $A = \{a,b,c\}$ knows only that $a, b, c$ are inside $A$. It does not know whether $a$ is “near” $b$, or “more like” $b$ than $c$, or whether there is a path from $a$ to $c$ via $b$. A set is a thin container.

A graph is a set with a relation $R(a,b)$ added. We can now ask who is connected to whom. A graph is a discrete, primitive notion of space.

A type goes further still. In \citetitle{typespaces_wiki}, a type $A$ is not just a collection but a *universe of discourse*, a place where certain terms can be constructed and certain judgments can be made \cite{typespaces_wiki}. Type theory replaces the picture “elements inside a set” with the picture “terms inhabiting a type”, and lets us type the types themselves: $A : \mathcal{U}$, $B : A \to \mathcal{U}$. The hierarchy

$$
\text{term} \;\to\; \text{type} \;\to\; \text{type of types} \;\to\; \cdots
$$

is one of the oldest and most useful formalizations of the idea that “relations can themselves be related”. The chapter you are now reading is, in part, a way of preparing for it.
</div>

<div class="md">
## 3. Locality: the decisive turn

So far everything we have said could be done with bare set theory. Topology adds the move that turns a set into a *place*, the introduction of locality without distance.

A \citetitle{topology_wiki} $\mathcal{O}$ on a set $X$ is a collection of subsets (the “open sets”) closed under finite intersection and arbitrary union \cite{topology_wiki}. That is the whole definition. From it follows everything else: neighborhoods $U \ni x$, continuous maps $f^{-1}(\mathcal{O}_Y) \subseteq \mathcal{O}_X$, limits, connectedness, compactness, the whole zoo.

<div class="optional md" data-headline="What are open sets, intuitively?">
The formal definition is a single line. The intuition takes longer.

Think of a city map. For each point on the map, you can ask: which districts contain that point? The answer is not a single number (that would be a distance), it is a *list of subsets*. “Times Square is in Midtown” and “Times Square is in Manhattan” and “Times Square is in New York City” are all true statements, and they get smaller and smaller as you zoom in.

Open sets are exactly this: for each point $x$, the collection of all subsets that “contain $x$ with a little bit of room around it”. You don't measure the room. You just ask whether the room is there at all. A set is “open” if every point inside it has some room around it still inside the set. (Formally: $U$ is open iff for every $x \in U$ there exists $V$ with $x \in V \subseteq U$.)

A continuous map is then the obvious thing: a map that sends nearby points to nearby points, where “nearby” is judged by which neighborhoods contain them, not by any numeric distance.
</div>

The reason topology is the right stage for our story is that it formalizes the idea of “near” without committing to a metric. It asks the question

$$
\boxed{\text{What counts as being near } x\text{?}}
$$

and refuses to give a numerical answer. Instead it gives *which sets contain* $x$ in their interior. This is exactly the level of abstraction we want when we talk about meaning: a word is “near” other words not because it is a small numerical distance away, but because it appears in overlapping contexts, in similar constructions, in related sentences.

<figure>
	<img src="category_commutative.png" alt="A commutative diagram with three objects A, B, C and arrows between them" style="max-width: 280px; background: #ffffff; padding: 12px; border-radius: 6px;" />
	<figcaption class="md">A \citetitle{category_diagram_image}: objects as dots, morphisms as arrows, relations as commuting squares \cite{category_diagram_image}. A category is the algebra of “things you can do to things”. Morphisms are the first-order transformations, and the square says that doing $g$ then $f$ is the same as doing $f$ then $g$.</figcaption>
</figure>
</div>

<div class="md">
## 4. The sheaf picture: local islands, glued into a continent

Once you have a topology, you can attach data to every open set. A \citetitle{sheaf_mathematics} $\mathcal{F}$ assigns to each open $U \subseteq X$ a set $\mathcal{F}(U)$, the *sections* over $U$, together with restriction maps $\mathcal{F}(U) \to \mathcal{F}(V)$ for $V \subseteq U$ \cite{sheaf_mathematics}.

The crucial axiom is the **gluing axiom**: if $U = \bigcup_i U_i$ is an open cover and you have local sections $s_i \in \mathcal{F}(U_i)$ which *agree on every pairwise overlap* $U_i \cap U_j$, then there is a unique global section $s \in \mathcal{F}(U)$ whose restriction to each $U_i$ is $s_i$.

The picture is this:

<figure>
	<img src="sheaf_sections.png" alt="A sheaf diagram showing two local sections lifted from two open sets" style="max-width: 380px; background: #ffffff; padding: 12px; border-radius: 6px;" />
	<figcaption class="md">\citealternativetitle{sheaf_sections_image}: two local sections $s_1 \in \mathcal{F}(U_1)$ and $s_2 \in \mathcal{F}(U_2)$ lifted from open sets $U_1$ and $U_2$ of the two-point space \cite{sheaf_sections_image}.</figcaption>
</figure>

<figure>
	<img src="sheaf_gluing.png" alt="A sheaf diagram showing the gluing of two compatible local sections into a single global section" style="max-width: 380px; background: #ffffff; padding: 12px; border-radius: 6px;" />
	<figcaption class="md">\citealternativetitle{sheaf_gluing_image}: where the local sections agree on $U_1 \cap U_2$, the sheaf guarantees a unique global section $s \in \mathcal{F}(U_1 \cup U_2)$ that restricts back to each \cite{sheaf_gluing_image}. Local agreement $\Rightarrow$ global existence, and uniqueness.</figcaption>
</figure>

In one line:

$$
\boxed{\text{local data} \;+\; \text{compatibility on overlaps} \;\Longrightarrow\; \text{global data}.}
$$

This is the formal crystallization of the intuition. Sheaves were introduced by \cite[Alexander Grothendieck]{grothendieck_sheaf} (\citeyear{grothendieck_sheaf}) in the 1950s and 60s, partly through the work of Jean Leray in the late 1940s \cite{sheaf_mathematics}, precisely to handle questions that resisted the older “patch a space together by gluing charts” picture of \citetitle{manifold_wiki}. Where manifolds ask you to specify a single chart and a transition map, sheaves ask you to specify local data on every open set and let the global object fall out of the consistency conditions. The local-to-global direction is so productive that it is the entire backbone of algebraic geometry and much of modern logic.

<div class="optional md" data-headline="Stalks, germs, and sections: the vocabulary of locality">
A few terms you will meet constantly once you read anything about sheaf theory:

* **Section over $U$.** An element of $\mathcal{F}(U)$. Think of it as “a complete description of what the sheaf knows about the region $U$”. For the sheaf of continuous functions, a section over $U$ is exactly a continuous real-valued function on $U$.

* **Restriction.** Given $V \subseteq U$, the restriction map $\mathcal{F}(U) \to \mathcal{F}(V)$ takes a section over $U$ and tells you what it says when restricted to $V$. Compatibility on overlaps is, in the end, just: the restriction of $s_i$ to $U_i \cap U_j$ equals the restriction of $s_j$ to $U_i \cap U_j$.

* **Germ at $x$.** Two sections over possibly different opens are “equivalent at $x$” if they agree on some neighborhood of $x$. A germ is an equivalence class under this relation. It is the *smallest unit of local data at a point*.

* **Stalk at $x$.** The set of all germs at $x$. It is the sheaf's entire “view from the point $x$”, built from every section that passes through $x$ at all, with sections that agree near $x$ identified.

* **Cut.** A piecewise-defined section, the data you assemble before you check whether it glues. In Grothendieck's language, a presheaf is “a cut”, and a sheaf is “a cut that always glues”.

The pattern: **sections live on opens, germs live on points, the stalk stitches all the germs together at one point**. This three-level picture (open / germ / stalk) is the standard way sheaf theorists think.
</div>

<div class="optional md" data-headline="An overlap in your own life">
To make “overlap” less abstract, consider a train passing through a station. While it is approaching and passing, you experience several streams of data at once, and they all overlap in time:

* you *see* the locomotive entering from the left,
* you *hear* the rails starting to sing,
* you *feel* a low tremor in your chest as the carriages come alongside,
* the *spatial* layout shifts: the platform narrows, the perspective compresses.

None of these streams is identical to the others. They are different modalities of one phenomenon. On their pairwise overlaps (the moment when you can both see and hear the train, the moment when you can both feel and spatially locate it) the data has to *agree* in some sense: if your visual stream says “the train is here” but your auditory stream says “the train is much further away”, something has gone wrong. When all the streams agree on the overlaps, the sheaf condition says they glue into a single coherent experience: a train passing you on the platform.

A sheaf is just this, made formal.
</div>

Why does this matter for embeddings? Because an embedding space is, in spirit, a sheaf on the *contexts* of a word. Each context is an open set. Each local section is a list of co-occurring tokens. Compatibility is the requirement that on the overlap of two contexts the prediction agree. The geometry of the embedding space is the global section that falls out of that consistency.
</div>

<div class="md">
## 5. Equality becomes coherence

In a classical sheaf, two sections are equal on the overlap: $s_i|_{U_i \cap U_j} = s_j|_{U_i \cap U_j}$. The equality sign is the flat equality of set theory: either the two things are the same element, or they are not.

In an $\infty$-sheaf, and in \citetitle{hottbook} (\citeyear{hottbook}) more generally, equality is replaced by *equivalence*:

$$
s_i|_{U_i \cap U_j} \;\simeq\; s_j|_{U_i \cap U_j}.
$$

Now there is a homotopy $\alpha_{ij}$ between the two sections. But on a triple overlap $U_i \cap U_j \cap U_k$, the homotopies must themselves agree:

$$
\alpha_{ij} \circ \alpha_{jk} \;\simeq\; \alpha_{ik},
$$

and the coherence between these higher homotopies is again a higher homotopy, ad infinitum \cite{higher_category_wiki}. The chain

$$
\text{objects} \;\to\; \text{morphisms} \;\to\; 2\text{-morphisms} \;\to\; 3\text{-morphisms} \;\to\; \cdots
$$

is the categorical expression of “relations can themselves be related” taken to its logical conclusion \cite{higher_category_wiki}. Homotopy Type Theory makes this the very definition of what a type is: a type is a space, an element is a point, an identification $p : a =_A b$ is a path from $a$ to $b$, and an identification of identifications is a homotopy between paths \cite{hottbook}. Sets, in this picture, are the special case where all higher homotopies are trivial, i.e. a set is a space whose only interesting structure is its points.

A physical example of an $\infty$-sheaf in disguise: lightning and thunder.

Lightning and thunder are caused by the same event. They should be “the same thing” on the overlap of times when both are visible and audible. But light reaches us almost instantly, while sound lags behind by a measurable delay that depends on distance. So on the overlap (the time window when both are happening), the two signals are not *equal* in the set-theoretic sense. They are related by a *homotopy*: the data of how far away the strike was, encoded as a time-translation.

An $\infty$-sheaf handles this perfectly. The “overlap” is no longer a place where two sections have to be the same element. It is a place where two sections have to be connected by a coherent transformation, and the transformation can itself carry parameters (here: distance, equivalently delay). The coherence axiom on triple overlaps becomes the requirement that all these delays compose consistently, which they do, because the underlying physics is consistent.

This is why $\infty$-sheaves matter: the world is full of phenomena that are not identical but are coherently related, and $\infty$-sheaves are the formal language that lets us say so without forcing everything into the Procrustean bed of set-theoretic equality.

The slogan is therefore:

$$
\boxed{\text{equality} \;\rightsquigarrow\; \text{equivalence + coherence}.}
$$
</div>

<div class="md">
## 6. The categorical shape of the same story

We have been speaking of “objects” and “morphisms” and “sections” without yet pinning down what a category formally is. Let's do that now, in two voices, because the answer sounds different depending on what kind of reader you are.

<div class="optional md" data-headline="Category theory from a programmer's point of view">
If you are an interested programmer, a category is essentially three things:

1. A bunch of *types* (the objects).
2. A bunch of *pure functions* between them (the morphisms: $f : A \to B$).
3. A way to *compose* functions, $g \circ f : A \to C$, with the usual associativity and identity laws.

That is the whole definition. Everything else in category theory (functors, natural transformations, adjunctions) is a way of saying “here is a structure-preserving map between two such worlds” and “here is a structure-preserving map between two such maps”.

The deep move is this: a category is a *type-safe world*, and category theory is the mathematics of talking about such worlds *without opening them up*. You never look inside the objects. You only ask what morphisms go between them, and how those morphisms compose. If you have ever enjoyed Haskell's type system, you have already been using category theory: the Haskell category has types as objects and pure functions as morphisms, and the `Functor`, `Applicative`, and `Monad` typeclasses are exactly the categorical concepts with the same names.
</div>

<div class="optional md" data-headline="Category theory from a type-theorist's point of view">
If your background is in type theory, a category is the natural setting for “the smallest structure in which morphisms compose”:

* Objects are types, but you are forbidden to ask what is *inside* an object.
* Morphisms $f : A \to B$ are the primitive notion of “a way of turning an $A$ into a $B$”. They are *not* functions in the set-theoretic sense. They are simply arrows.
* Composition $g \circ f : A \to C$ exists whenever the codomain of $f$ matches the domain of $g$, and it is associative with an identity $1_A : A \to A$.

From this thin starting point you can derive most of modern structural mathematics: functors (maps between categories that preserve the structure), natural transformations (maps between functors that commute with every morphism in the source category), and adjunctions (the universal “best approximation” of one functor by another). \citeauthor{awodey2010category}'s textbook \citetitle{awodey2010category} is the standard gentle introduction; \citeauthor{maclane1998categories}'s \citetitle{maclane1998categories} is the canonical reference.
</div>

<div class="md">
\citetitle{category_theory_wiki}, introduced by \citeauthor{eilenberglane1945} (\citeyear{eilenberglane1945}), is the cleanest formulation of the move “relations can be composed” \cite{category_theory_wiki}. A category has three ingredients:

$$
\text{objects: } A, B, C, \ldots \qquad \text{morphisms: } f : A \to B \qquad \text{composition: } g \circ f : A \to C
$$

together with associativity and identity axioms \cite{category_theory_wiki}. Categories are sometimes called the algebra of “doing things to things”: the objects are what the things are, the morphisms are what you can do to them.

What we care about here is the higher generalization. In a 2-category, morphisms themselves can be related by 2-morphisms $\alpha : f \Rightarrow g$. In an $\infty$-category, this continues all the way up \cite{higher_category_wiki}. The conceptual content is the same as for $\infty$-sheaves and HoTT: at every level of structure, the “things at that level” come with their own relation-of-relations, and the coherent compatibility of those relations is what makes the whole thing hang together.
</div>
</div>

<div class="md">
## 7. Topoi: worlds where you can do mathematics

Sheaves on a fixed space $X$ form a category $\mathbf{Sh}(X)$, and this category has an extraordinary property: it behaves, in many respects, like the category of ordinary sets. You can form products, coproducts, function spaces, you can do logic inside it, you can define a notion of “element of a sheaf” that is just as comfortable as the ordinary notion of “element of a set”. Categories that behave this way are called **toposes** (singular: **topos**).

The concept was introduced by \cite[Alexander Grothendieck]{grothendieck_sheaf} in the early 1960s and was given its modern axiomatic form by William Lawvere and Myles Tierney in the late 1960s and early 1970s, with the central axiom (the “topos axiom”) being the existence of a *subobject classifier*, an object $\Omega$ that plays the role of “the set of truth values” inside the topos \cite{topos_wiki}. The defining textbook reference is \citeauthor{goldblatt1979topoi}'s \citetitle{goldblatt1979topoi}, still one of the clearest introductions; the canonical modern treatment is Peter Johnstone's three-volume *Sketches of an Elephant* \cite{topos_wiki}.

In the hands of \cite[the topos theorists]{topos_wiki}, a topos becomes more than a category. It is *a universe of mathematics*: a self-contained world with objects, morphisms, internal logic, and its own notion of truth. Different topoi correspond to different “logics”: in a sheaf topos the internal logic is classical (true or false), but in a more general topos it can be intuitionistic (you can have statements that are neither provably true nor provably false). This is why topos theory is the natural home of *constructive* mathematics, of synthetic differential geometry, and of the categorical logic that underlies some modern type theories \cite{topos_wiki}.

For our purposes, the picture to remember is this:

$$
\boxed{\text{A topos is a “space” in which you can do mathematics.}}
$$

Concretely, an embedding space is *almost* a topos. It carries data (the vectors), it has morphisms (the linear maps between layers), it has internal logic (the gating decisions of attention). It is not a topos in the strict technical sense, but it has the same flavor: a small structured world in which local rules apply and in which a global object falls out of them.
</div>

<div class="md">
## 8. The phenomenology of one phenomenon

So far, the story has been mathematical. The same shape, however, shows up outside mathematics, and that is the deeper reason it is worth knowing.

Take any object in your perceptual field. Say, a train moving past you on a platform. It appears to you as:

* a visual phenomenon, a shape of metal moving against a background,
* an auditory phenomenon, a sound whose pitch drops as it passes (the Doppler shift),
* a *"leibliches"* phenomenon, a pressure, a vibration, a slight tremor in your chest,
* a spatial phenomenon, something that has front, side, depth, and is moving from “there” to “less there”.

These appearances are not identical. They are different modalities of one phenomenon, and they have different qualitative textures. The phenomenological tradition, especially in the form developed by \citeauthor{schmitz_neo_phenomenology} (\citeyear{schmitz_neo_phenomenology}) as *Neue Phänomenologie* (neo-phenomenology), insists that lived space is structured first by such qualities: *Nähe* (nearness), *Ferne* (farness), *Weite* (openness), *Enge* (narrowness), *Richtung* (direction), bodily *Ergriffenheit* (being-seized), long before it is structured by Cartesian coordinates \cite{schmitz_neo_phenomenology}. The geometric space of physics is a specialization of this richer, qualitative space, not its foundation.

The mathematical structure of this chapter is the formal shape of the same insight. The train is not a hidden “thing in itself” sitting behind its appearances, à la Kant \cite{distinction_philosophy}. The train *is* the coherent network of its possible appearances. Strip the appearances and there is nothing left to talk about.

$$
\boxed{\text{an object} \;\approx\; \text{the coherent network of its possible appearances}.}
$$

The same point, expressed categorically, is what an $\infty$-sheaf on the space of perspectives would say. The same point, expressed linguistically, is what \citeauthor{saussure1916} (\citeyear{saussure1916}) said about language: a word's identity is its place in a web of differences from other words, not a positive property it carries inside itself. The same point, expressed geometrically, is what we will say about an embedding space in the next chapter: a word's meaning is its position in a high-dimensional manifold, not a label that sits in the word.
</div>

<div class="md">
## 9. Why this is the lens for embeddings

Embeddings are the place where all of the above comes together in modern AI. A tokenizer (see the <a href="tokenizerlab">Tokenization chapter</a>) hands the network a list of integers: token IDs. The next step, which the <a href="embeddinglab">Embeddings chapter</a> treats in detail, is to *place* every token at a point in a high-dimensional vector space $\mathbb{R}^d$. From that point on, every operation in the network is an operation in that space: distances, dot products, attention weights, the residual stream.

The conceptual move is the sheaf move in disguise.

* **Distinction.** Tokens are distinct: “cat” and “dog” are different tokens.
* **Relation.** After embedding, they are related by *distance*, by *angle*, by *neighborhood*. Their meanings are now positions in a shared space.
* **Transformation.** Attention and feed-forward layers transform these positions into new positions. The same token in different contexts ends up at different points.
* **Locality.** The neighborhood of “cat” in $\mathbb{R}^d$ contains “dog”, “kitten”, “pet”, “meow”. The neighborhood is not a metric accident; it is the geometry of the network's accumulated knowledge of co-occurrence.
* **Compatibility.** Two sentences using “cat” in similar ways will produce similar hidden states; that agreement on overlap is the compatibility condition.
* **Coherence.** Those agreements are not coincidences, they are structured by the training objective, which is itself a kind of local-to-global consistency condition over the entire training corpus.
* **Gluing.** At inference time, the network glues these local, contextual pieces into a single coherent prediction: the next token.
* **Globality.** The whole sequence, the entire answer to your prompt, is that global section.
* **Invariance.** The same prediction should come out whether we run the network left-to-right, in parallel, or chunked into overlapping windows with overlap merged. (It does, modulo rounding.)

So when the next chapter says “an embedding is a point in a high-dimensional space”, it is using “space” in exactly the sheaf-theoretic sense we have been building: a place whose structure is determined, in good part, by coherent local data, not a container that already exists waiting to be filled. The qualification “in good part” is honest: in practice an embedding space is not a strict sheaf. The local data is not perfectly coherent, the borders between neighborhoods are fuzzy, and small inconsistencies are smoothed by the training dynamics. An embedding space is, more accurately, an *approximate sheaf*, a structure whose ideal form is the sheaf but whose realized form is messier and only asymptotically faithful to the ideal.

Once you have read it, come back to this chapter if the formal machinery starts to feel heavy. The chain on page one is the anchor. As long as you can place each new definition somewhere on the chain, the chapter will keep making sense.
</div>

<div class="optional md" data-headline="The history of 'space' in this sense">
The idea that “space” is not a container but a structure of relations is older than modern mathematics. \citeauthor{hypothesengeometrie} (\citeyear{hypothesengeometrie}) generalized the very notion of space in his 1854 habilitation lecture by describing a *Mannigfaltigkeit*, a “manifold” or “many-fold”, as a continuous collection parameterized by $n$ real numbers, with the local-to-global structure provided by an inner product that could vary from point to point \cite{hypothesengeometrie}. Einstein's general relativity then turned Riemann's local geometry into the geometry of spacetime itself: gravity is not a force but the curvature of a manifold whose local data is measured by freely falling observers. The point is not that Riemann or Einstein “knew about AI”. The point is that the move from “space as a container” to “space as a coherent gluing of local measurements” is one of the most successful structural ideas in the history of science, and it is exactly the move an embedding space makes.
</div>

<div class="md">
## 10. The chain, revisited

$$
\boxed{
\begin{aligned}
&\text{Distinction} \\
&\quad\downarrow \\
&\text{Relation} \\
&\quad\downarrow \\
&\text{Transformation} \\
&\quad\downarrow \\
&\text{Locality} \\
&\quad\downarrow \\
&\text{Compatibility} \\
&\quad\downarrow \\
&\text{Coherence} \\
&\quad\downarrow \\
&\text{Gluing} \\
&\quad\downarrow \\
&\text{Globality} \\
&\quad\downarrow \\
&\text{Invariance}
\end{aligned}
}
$$

Read it once more. Now notice: it is also the story of how a Transformer works on a sequence of tokens. The tokenizer distinguishes the tokens. The embedding layer puts them in relation to each other by giving each one a position in $\mathbb{R}^d$. The attention and feed-forward layers transform them. Every layer's computation is *local* in the sense that it operates on a neighborhood of the residual stream. The compatibility between heads, between layers, between attention scores and value vectors is what the training process enforces. The coherence of those compatibilities across many heads and many layers is what makes a Transformer something more than a soup of weights. The gluing happens at every residual connection. The globality is the next-token prediction at the top of the stack. The invariance is the surprising fact that the same architecture, with the same weights, behaves the same way on every input we throw at it.

The same chain also runs through:

* **Sets.** Distinction and Relation only.
* **Groups, rings, algebras.** Distinction, Relation, Transformation.
* **Topological spaces.** All the way to Locality.
* **Sheaves, fiber bundles, manifolds.** All the way to Invariance.
* **Embedding spaces.** All the way to Invariance, applied to language.
* **A trained neural network.** All the way to Invariance, applied to whatever task it was trained on.

That is why we are spending a chapter on it. The chain is the spine of modern AI.
</div>

<div class="md">
## 11. The central sentence

$$
\boxed{
\textbf{Difference does not have to be erased for unity to emerge.}
}
$$

A second, equivalent form that we will use repeatedly:

$$
\boxed{
\text{global unity}
\;=\;
\text{local difference}
\;+\;
\text{coherent transitions between the locals}.
}
$$

A third form, more compressed:

$$
\boxed{
\text{an object}
\;\approx\;
\text{the coherent network of its possible appearances}.
}
$$

These three sentences are not theorems. They are lenses. If they are in your head when you open the <a href="embeddinglab">Embeddings chapter</a>, the chapter will be much easier to read, not because you will already know the math, but because you will already know what the math is *trying to say*.
</div>

<div class="md">
## 12. What to carry into the Embeddings chapter

Five things. Each is restated as a checklist item, the way you might want to read it once before clicking the link to the Embeddings chapter.

1. **Meaning is relational, not intrinsic.** No word, no token, no vector has meaning in itself. Meaning is its position in the web of differences from the others. This is \citeauthor{saussure1916}'s “language as a system of pure differences” \cite{saussure1916}, \citeauthor{firth1957distributive}'s “you shall know a word by the company it keeps” \cite{firth1957distributive}, and the entire distributional semantics tradition, in one breath \cite{distributional_hypothesis}.

2. **The space is defined by its neighborhoods, not its coordinates.** A high-dimensional embedding space $\mathbb{R}^d$ is not “the space of all possible vectors”. It is the space on which a learned similarity function makes certain vectors *near* each other. The coordinates are an accident; the neighborhood structure is the geometry.

3. **Local structure + compatibility = global meaning.** This is the sheaf axiom in plain English. It is also the working principle of an embedding space: the global geometry of meaning is recovered from the way every token behaves locally and from how those local behaviors agree on overlap.

4. **Geometry is the algebra of differences.** Distances, angles, dot products, cosine similarities: these are the *operations* on differences. They turn “different” from a flat predicate into a quantitative, structured relation. This is what makes “embedding” a precise concept and not a metaphor.

5. **“Different” is not “unrelated”.** It is “related by a coherent transition”. Two vectors far apart in $\mathbb{R}^d$ are not disconnected; they are connected by a path, and that path passes through neighborhoods of intermediate vectors. The geometry of an embedding space is the geometry of all such paths, not just of the points.

If those five points feel obvious, you are ready. If they don't, read this chapter once more, slowly, this time, before opening the next one.

## 13. The most general definition of space

Everything in this chapter has been, quietly, a definition. Not a definition of a particular space (Euclidean, Riemannian, topological, metric, Hilbert) but a definition of what it *takes* for something to deserve the name "space" at all. Read the chain one last time and notice what it does not require: no distance, no dimension, no coordinates, no container, no ambient background, no points that pre-exist their relations. What it *does* require is only three things: that there be distinctions, that those distinctions carry a notion of locality (a "near" without a number), and that the local pieces be coherent enough on their overlaps to be glued into something invariant. Anything satisfying these three conditions is, in the sense we have been building, a space. In one line: **A space is a structure in which distinguishable local data cohere, on their overlaps, into an invariant global whole**.

This is more general than the everyday container-space of Newton, more general than the metric spaces of analysis, more general even than the Riemannian manifolds of Einstein, all of which are special cases where the local data happens to be a distance function and the coherence happens to be smooth. It is at least as general as a Grothendieck topos, "a space in which one can do mathematics". And it is exactly the sense in which an embedding space is a space: not a pre-existing $\mathbb{R}^d$ waiting to be populated, but a geometry that *emerges* from the coherent local behavior of tokens across contexts, an approximate sheaf whose global shape is the meaning it has learned to represent. When the next chapter says "space", this is the word it means. Everything narrower is a specialization; everything broader is a metaphor. Space, in its most general form, is simply the name we give to coherent difference that has learned how to hold together.
</div>

<div class="optional md" data-headline="A philosophical note: this is a structural hypothesis, not an ontology">
It is worth saying out loud what this chapter *is not* claiming.

It is not claiming that the world is made of mathematics.
It is not claiming that consciousness, space, language, and AI are “really” the same thing.
It is not even claiming that the sheaf picture is the right formalism for everything.

What it *is* claiming is the much weaker, but much more useful, observation that the same *structural shape* (distinction, relation, transformation, locality, compatibility, coherence, gluing, globality, invariance) shows up in genuinely different domains, and that this observation pays off when we want to reason about embeddings, because an embedding space is one more place where that shape is realized.

This kind of cross-domain structural analogy is what \citeauthor{lumpschool}'s *structural realism* program means by structural realism: take the structural shape seriously, treat the underlying substance as a placeholder, and see how far you can go \cite{lumpschool}. For our purposes, the answer is: surprisingly far, but only as long as we remember that we are working with a lens, not with the thing-in-itself. The lens makes the next chapter legible. The next chapter makes the lens concrete. After that, the lens and the concrete picture will need to keep adjusting to each other.
</div>

<div class="optional md" data-headline="Coda: a remark on Whitehead and Heraclitus">
Two historical notes, since they are too beautiful to omit.

The 5th-century BCE philosopher \cite[Heraclitus]{heraclitus_unity} is reported (in fragment B50) to have said: *“You cannot step into the same river twice, for fresh waters are ever flowing in upon you.”* The fragment is usually read as a doctrine of *flux*, that everything changes, nothing stays. But it can equally be read as a doctrine of *coherent difference*: the river at time $t_1$ and the river at time $t_2$ are not identical, but they are related by a coherent transition (the flow of water), and the river-as-object is the coherent network of all those appearances across time. Heraclitus, on the second reading, is already gesturing at the sheaf picture.

A little over two millennia later, \citeauthor{whitehead_process} (\citeyear{whitehead_process}) built an entire metaphysics on the idea that the world is made of *processes*, not *substances*, “becoming” rather than “being”. His word *concrescence* names exactly the operation we have been calling gluing: many prehensions (local graspings) come together into one actual occasion (a global entity) \cite{whitehead_process}. Whitehead's *Process and Reality* can be interpreted as a sheaf-theoretic picture of the world, decades before sheaves were formulated in their modern form.
</div>
