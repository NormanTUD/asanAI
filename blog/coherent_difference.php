<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Coherent Difference
description: Why meaning is built from local differences glued together coherently — the structural idea behind embeddings, space, and modern AI.
icon: &#128376;
part: 4
order: 20
color: accent
topics: language, math-i, math-ii, philosophy
-->

<div class="md">
Before we open the <a href="embeddinglab">Embeddings chapter</a>, there is one idea worth holding in your head. It is not a theorem. It is not even an equation. It is the structural intuition that quietly holds together a surprising amount of what we are about to do, and that you will meet again and again in slightly different costumes: in topology, in sheaves, in category theory, in Homotopy Type Theory, in the geometry of an embedding space, and — at the far end — in how a Transformer turns a list of token IDs into something that means.
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

The whole idea can be written as one arrow:

$$
\boxed{
\text{Distinction}
\;\to\;
\text{Relation}
\;\to\;
\text{Transformation}
\;\to\;
\text{Locality}
\;\to\;
\text{Compatibility}
\;\to\;
\text{Coherence}
\;\to\;
\text{Gluing}
\;\to\;
\text{Globality}
\;\to\;
\text{Invariance}.
}
$$

Read left-to-right, this is the same story told at successively more structured levels:

* **Distinction.** Before anything can be related, something has to be marked off from something else. \citeauthor{spencerbrown1969form} (\citeyear{spencerbrown1969form}) made this the literal first axiom of his calculus: *Draw a distinction* — i.e., cross a boundary, and one side becomes "marked", the other "unmarked" \cite{spencerbrown1969form}. Without a first cut, there is nothing to talk about.

* **Relation.** Once two things are distinct, they can be in relation: equal, similar, near, mapped to each other. A set $A = \{a,b,c\}$ knows only that $a,b,c \in A$; a relation adds structure on top.

* **Transformation.** A relation that is not just "is connected to" but "can be carried along" — a function, a morphism, a transport. This is where the picture stops being static.

* **Locality.** Transformation forces us to ask: *where* does this happen? Topology's answer is austere: a space is a set $X$ together with a collection $\mathcal{O}$ of "open" subsets, so that for any point $x$ we can ask which neighborhoods contain it \cite{topology_wiki}. We do not need a distance. We only need the idea of "near" without a metric.

* **Compatibility.** If two open sets overlap, the data on each must agree on the overlap. This is the sheaf condition in one line: local sections that match on pairwise intersections can be glued \cite{sheaf_mathematics}.

* **Coherence.** Compatibility can be thin (sections are *equal* on the overlap) or thick (sections are *equivalent* via a homotopy). Thick compatibility has its own structure: equivalences must themselves be coherent on triple overlaps \cite{higher_category_wiki}.

* **Gluing.** When local pieces are coherent, they assemble into a unique global object. A sheaf is exactly a gadget whose global sections are determined by compatible local sections \cite{sheaf_mathematics}.

* **Globality.** What looked like a patchwork of perspectives turns out to be *one* thing — not because the patches are identical, but because their seams fit.

* **Invariance.** The result is no longer tied to any particular choice of cover or chart. It survives every legitimate change of viewpoint. This is what "manifold", "topological space", "fiber bundle" \cite{fiber_bundle_wiki}, "type" and "object in a category" all have in common.

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
This chapter does *not* introduce any new technical machinery. There is no live demo, no equation to memorize, no Python cell to run. It is a piece of conceptual scaffolding. Its only job is to plant a single intuition in your head so that when you reach the Embeddings chapter, the word "space" does not feel like a metaphor and the word "local" does not feel like a convenience.

If you already know topology, sheaves, category theory and HoTT well, you can skim this chapter in two minutes. If you know none of them, the chapter still works: every section is read on two levels — a hand-wavy English level, and a one-line formal level. The hand-wavy level is the one that will stay with you; the formal level is there to show that there is a real mathematical idea behind the metaphor.
</div>

<div class="md">
## 1. The first move: distinction

<figure>
	<img src="laws_of_form_mark.png" alt="The Mark of Spencer-Brown's Laws of Form" style="max-width: 100px; background: white; padding: 8px;" />
	<figcaption class="md">\citealternativetitle{spencerbrown1969form}'s "Mark" — a single boundary separating a marked state from the unmarked void.</figcaption>
</figure>

Spencer-Brown begins his book with an instruction:

> "Draw a distinction." \cite{spencerbrown1969form}

The instruction is not a metaphor. A single boundary drawn across an unmarked plane produces two states: the marked state on one side of the boundary, the unmarked state on the other. Two axioms then govern what can happen:

$$
\boxed{\; \overline{\overline{\,}} \;=\; \overline{\phantom{x}} \;}
\qquad
\boxed{\; \overline{\overline{\overline{\,}}} \;=\; \overline{\overline{\,}} \;}
$$

(Call twice = call once; cross twice = return to unmarked.) From these two axioms the entire Boolean calculus of propositions falls out \cite{spencerbrown1969form}. The point, for us, is not the algebra. The point is that Spencer-Brown placed *distinction itself* at the foundation of mathematics — the act that splits one world into two is the act from which everything else is built.

<figure>
	<img src="spencer_brown.png" alt="Burial place of G. Spencer-Brown" style="max-width: 200px;" />
	<figcaption class="md">\citealternativetitle{spencerbrown_wiki}'s gravestone at Brookwood Cemetery, Surrey, inscribed with the two axioms of \citetitle{spencerbrown1969form}.</figcaption>
</figure>

The philosophical point is older than the algebraic one. The article on \citetitle{distinction_philosophy} traces the concept of a *real distinction* — a difference that exists in the world, not merely in the mind — from Aristotle's distinction between actuality and potentiality, through Aquinas's distinction between essence and existence, to Kant's distinction between appearance and thing-in-itself \cite{distinction_philosophy}. Each of these is the same move: carve a boundary, and you get two sides.

What the modern formalizations buy us is a promise: once we have the move, we can build the rest.
</div>

<div class="md">
## 2. From distinction to structure

A set is the simplest structure that can hold distinctions. $A = \{a,b,c\}$ knows only that $a, b, c$ are inside $A$. It does not know whether $a$ is "near" $b$, or "more like" $b$ than $c$, or whether there is a path from $a$ to $c$ via $b$. A set is a thin container.

A graph is a set with a relation $R(a,b)$ added. We can now ask who is connected to whom. A graph is a discrete, primitive notion of space.

A type goes further still. In \citetitle{typespaces_wiki}, a type $A$ is not just a collection but a *universe of discourse*: a place where certain terms can be constructed and certain judgments can be made \cite{typespaces_wiki}. Type theory replaces the picture "elements inside a set" with the picture "terms inhabiting a type", and lets us type the types themselves: $A : \mathcal{U}$, $B : A \to \mathcal{U}$. The hierarchy

$$
\text{term} \;\to\; \text{type} \;\to\; \text{type of types} \;\to\; \cdots
$$

is one of the oldest and most useful formalizations of the idea that "relations can themselves be related". The chapter you are now reading is, in part, a way of preparing for it.
</div>

<div class="md">
## 3. Locality: the decisive turn

So far everything we have said could be done with bare set theory. Topology adds the move that turns a set into a *place*: the introduction of locality without distance.

A \citetitle{topology_wiki} $\mathcal{O}$ on a set $X$ is a collection of subsets (the "open sets") closed under finite intersection and arbitrary union \cite{topology_wiki}. That is the whole definition. From it follows everything else: neighborhoods $U \ni x$, continuous maps $f^{-1}(\mathcal{O}_Y) \subseteq \mathcal{O}_X$, limits, connectedness, compactness, the whole zoo.

The reason topology is the right stage for our story is that it formalizes the idea of "near" without committing to a metric. It asks the question

$$
\boxed{\text{What counts as being near } x\text{?}}
$$

and refuses to give a numerical answer. Instead it gives *which sets contain* $x$ in their interior. This is exactly the level of abstraction we want when we talk about meaning: a word is "near" other words not because it is a small numerical distance away, but because it appears in overlapping contexts, in similar constructions, in related sentences.

<figure>
	<img src="category_commutative.png" alt="A commutative diagram with three objects A, B, C and arrows between them" style="max-width: 280px; background: white; padding: 8px;" />
	<figcaption class="md">A \citetitle{category_diagram_image}: objects as dots, morphisms as arrows, relations as commuting squares \cite{category_theory_wiki}. A category is the algebra of "things you can do to things" — morphisms are the first-order transformations, and the square says that doing $g$ then $f$ is the same as doing $f$ then $g$.</figcaption>
</figure>
</div>

<div class="md">
## 4. The sheaf picture: local islands, glued into a continent

Once you have a topology, you can attach data to every open set. A \citetitle{sheaf_mathematics} $\mathcal{F}$ assigns to each open $U \subseteq X$ a set $\mathcal{F}(U)$ — the *sections* over $U$ — together with restriction maps $\mathcal{F}(U) \to \mathcal{F}(V)$ for $V \subseteq U$ \cite{sheaf_mathematics}.

The crucial axiom is the **gluing axiom**: if $U = \bigcup_i U_i$ is an open cover and you have local sections $s_i \in \mathcal{F}(U_i)$ which *agree on every pairwise overlap* $U_i \cap U_j$, then there is a unique global section $s \in \mathcal{F}(U)$ whose restriction to each $U_i$ is $s_i$.

The picture is this:

<figure>
	<img src="sheaf_sections.png" alt="A sheaf diagram showing two local sections lifted from two open sets" style="max-width: 380px; background: white; padding: 8px;" />
	<figcaption class="md">\citealternativetitle{sheaf_sections_image}: two local sections $s_1 \in \mathcal{F}(U_1)$ and $s_2 \in \mathcal{F}(U_2)$ lifted from open sets $U_1$ and $U_2$ of the two-point space \cite{sheaf_mathematics}.</figcaption>
</figure>

<figure>
	<img src="sheaf_gluing.png" alt="A sheaf diagram showing the gluing of two compatible local sections into a single global section" style="max-width: 380px; background: white; padding: 8px;" />
	<figcaption class="md">\citealternativetitle{sheaf_gluing_image}: where the local sections agree on $U_1 \cap U_2$, the sheaf guarantees a unique global section $s \in \mathcal{F}(U_1 \cup U_2)$ that restricts back to each \cite{sheaf_mathematics}. Local agreement $\Rightarrow$ global existence, and uniqueness.</figcaption>
</figure>

In one line:

$$
\boxed{\text{local data} \;+\; \text{compatibility on overlaps} \;\Longrightarrow\; \text{global data}.}
$$

This is the formal crystallization of the intuition. \citeauthor{sheaf_mathematics} notes that sheaves were introduced by \citeauthor{grothendieck_sheaf} (\citeyear{grothendieck_sheaf}) in the 1950s and 60s precisely to handle questions that resisted the older "patch a space together by gluing charts" picture of \citetitle{manifold_wiki} \cite{sheaf_mathematics}. Where manifolds ask you to specify a single chart and a transition map, sheaves ask you to specify local data on every open set and let the global object fall out of the consistency conditions. The local–global direction is so productive that it is the entire backbone of algebraic geometry and much of modern logic.

Why does this matter for embeddings? Because an embedding space is, in spirit, a sheaf on the *contexts* of a word. Each context is an open set; each local section is a list of co-occurring tokens; compatibility is the requirement that on the overlap of two contexts the prediction agree. The geometry of the embedding space is the global section that falls out of that consistency.
</div>

<div class="md">
## 5. Equality becomes coherence

In a classical sheaf, two sections are equal on the overlap: $s_i|_{U_i \cap U_j} = s_j|_{U_i \cap U_j}$. The equality sign is the flat equality of set theory: either the two things are the same element, or they are not.

In an $\infty$-sheaf — and in \citetitle{hottbook} (\citeyear{hottbook}) more generally — equality is replaced by *equivalence*:

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

is the categorical expression of "relations can themselves be related" taken to its logical conclusion \cite{higher_category_wiki}. Homotopy Type Theory makes this the very definition of what a type is: a type is a space, an element is a point, an identification $p : a =_A b$ is a path from $a$ to $b$, and an identification of identifications is a homotopy between paths \cite{hottbook}. Sets, in this picture, are the special case where all higher homotopies are trivial — i.e., a set is a space whose only interesting structure is its points.

The slogan is therefore:

$$
\boxed{\text{equality} \;\rightsquigarrow\; \text{equivalence + coherence}.}
$$
</div>

<div class="md">
## 6. The categorical shape of the same story

\citetitle{category_theory_wiki}, introduced by \citeauthor{eilenberglane1945} (\citeyear{eilenberglane1945}), is the cleanest formulation of the move "relations can be composed" \cite{category_theory_wiki,maclane1998categories,awodey2010category}. A category consists of

$$
\text{objects: } A, B, C, \ldots
\qquad
\text{morphisms: } f : A \to B
\qquad
\text{composition: } (g \circ f) : A \to C \text{ for } f : A \to B,\; g : B \to C,
$$

together with associativity and identity axioms \cite{category_theory_wiki}. Categories are sometimes called the algebra of "doing things to things" — the objects are what the things are, the morphisms are what you can do to them.

What we care about here is the higher generalization. In a 2-category, morphisms themselves can be related by 2-morphisms $\alpha : f \Rightarrow g$. In an $\infty$-category, this continues all the way up \cite{higher_category_wiki}. The conceptual content is the same as for $\infty$-sheaves and HoTT: at every level of structure, the "things at that level" come with their own relation-of-relations, and the coherent compatibility of those relations is what makes the whole thing hang together.

A \citetitle{topos_wiki} goes one step further: it is a category with enough structure to behave like the category of sets, but with a different internal logic. The original example is precisely the category $\mathbf{Sh}(X)$ of sheaves on a space $X$ \cite{sheaf_mathematics,topos_wiki}. A topos is a "mathematical world" with its own objects, morphisms, subobjects, and an internal logic that need not be classical. In this textbook we will rarely invoke toposes by name, but the spirit is everywhere: a representation, an embedding, a model's latent space is, in a sense, a tiny world with its own internal logic.
</div>

<div class="md">
## 7. The phenomenology of one phenomenon

So far, the story has been mathematical. The same shape, however, shows up outside mathematics — and that is the deeper reason it is worth knowing.

Take any object in your perceptual field. Say, a train moving past you on a platform. It appears to you as:

* a visual phenomenon — a shape of metal moving against a background,
* an auditory phenomenon — a sound whose pitch drops as it passes,
* a leibliches (bodily) phenomenon — a pressure, a vibration, a slight tremor in your chest,
* a spatial phenomenon — something that has front, side, depth, and is moving from "there" to "less there".

These appearances are not identical. They are different *modalities* of one phenomenon, and they have different qualitative textures. The phenomenological tradition, especially in the form developed by \citeauthor{schmitz_neo_phenomenology} (\citeyear{schmitz_neo_phenomenology}) as *Neue Phänomenologie* (neo-phenomenology), insists that lived space is structured first by such qualities — *Nähe* (nearness), *Ferne* (farness), *Weite* (openness), *Enge* (narrowness), *Richtung* (direction), bodily *Ergriffenheit* (being-seized) — long before it is structured by Cartesian coordinates \cite{schmitz_philosopher_wiki,schmitz_neo_phenomenology}. The geometric space of physics is a *specialization* of this richer, qualitative space, not its foundation.

The mathematical structure of this chapter is the formal shape of the same insight. The train is not a hidden "thing in itself" sitting behind its appearances, à la Kant \cite{distinction_philosophy}; the train *is* the coherent network of its possible appearances. Strip the appearances and there is nothing left to talk about.

$$
\boxed{\text{an object} \;\approx\; \text{the coherent network of its possible appearances}.}
$$

The same point, expressed categorically, is what an $\infty$-sheaf on the space of perspectives would say. The same point, expressed linguistically, is what \citeauthor{saussure1916} (\citeyear{saussure1916}) said about language: a word's identity is its place in a web of differences from other words, not a positive property it carries inside itself. The same point, expressed geometrically, is what we will say about an embedding space in the next chapter: a word's meaning is its position in a high-dimensional manifold, not a label that sits in the word.
</div>

<div class="md">
## 8. Why this is the lens for embeddings

Embeddings are the place where all of the above comes together in modern AI. A tokenizer (see the <a href="tokenizerlab">Tokenization chapter</a>) hands the network a list of integers — token IDs. The next step, which the <a href="embeddinglab">Embeddings chapter</a> treats in detail, is to *place* every token at a point in a high-dimensional vector space $\mathbb{R}^d$. From that point on, every operation in the network is an operation in that space: distances, dot products, attention weights, the residual stream.

The conceptual move is the sheaf move in disguise.

* **Distinction.** Tokens are distinct: "cat" and "dog" are different tokens.
* **Relation.** After embedding, they are related by *distance*, by *angle*, by *neighborhood*. Their meanings are now positions in a shared space.
* **Transformation.** Attention and feed-forward layers transform these positions into new positions. The same token in different contexts ends up at different points.
* **Locality.** The neighborhood of "cat" in $\mathbb{R}^d$ contains "dog", "kitten", "pet", "meow". The neighborhood is not a metric accident; it is the geometry of the network's accumulated knowledge of co-occurrence.
* **Compatibility.** Two sentences using "cat" in similar ways will produce similar hidden states; that agreement on overlap is the compatibility condition.
* **Coherence.** Those agreements are not coincidences — they are structured by the training objective, which is itself a kind of local-to-global consistency condition over the entire training corpus.
* **Gluing.** At inference time, the network glues these local, contextual pieces into a single coherent prediction: the next token.
* **Globality.** The whole sequence — the entire answer to your prompt — is that global section.
* **Invariance.** The same prediction should come out whether we run the network left-to-right, in parallel, or chunked into overlapping windows with overlap merged. (It does, modulo rounding.)

So when the next chapter says "an embedding is a point in a high-dimensional space", it is using "space" in exactly the sheaf-theoretic sense we have been building: a place whose structure is determined by coherent local data, not a container that already exists waiting to be filled.
</div>

<div class="optional md" data-headline="The history of 'space' in this sense">
The idea that "space" is not a container but a structure of relations is older than modern mathematics. \citeauthor{hypothesengeometrie} (\citeyear{hypothesengeometrie}) generalized the very notion of space in his 1854 habilitation lecture by describing a *Mannigfaltigkeit* — a "manifold" or "many-fold" — as a continuous collection parameterized by $n$ real numbers, with the local-to-global structure provided by an inner product that could vary from point to point \cite{riemann_portrait,hypothesengeometrie}. Einstein's general relativity then turned Riemann's local geometry into the geometry of spacetime itself: gravity is not a force but the curvature of a manifold whose local data is measured by freely falling observers. The point is not that Riemann or Einstein "knew about AI". The point is that the move from "space as a container" to "space as a coherent gluing of local measurements" is one of the most successful structural ideas in the history of science, and it is exactly the move an embedding space makes.
</div>

<div class="md">
## 9. The chain, revisited

$$
\boxed{
\text{Distinction}
\;\to\;
\text{Relation}
\;\to\;
\text{Transformation}
\;\to\;
\text{Locality}
\;\to\;
\text{Compatibility}
\;\to\;
\text{Coherence}
\;\to\;
\text{Gluing}
\;\to\;
\text{Globality}
\;\to\;
\text{Invariance}
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
## 10. The central sentence

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

These three sentences are not theorems. They are lenses. If they are in your head when you open the <a href="embeddinglab">Embeddings chapter</a>, the chapter will be much easier to read — not because you will already know the math, but because you will already know what the math is *trying to say*.
</div>

<div class="md">
## 11. What to carry into the Embeddings chapter

Five things. Each is restated as a checklist item, the way you might want to read it once before clicking the link to the Embeddings chapter.

1. **Meaning is relational, not intrinsic.** No word, no token, no vector has meaning in itself. Meaning is its position in the web of differences from the others. This is \citeauthor{saussure1916}'s "language as a system of pure differences" \cite{saussure1916}, \citeauthor{firth1957distributive}'s "you shall know a word by the company it keeps" \cite{firth1957distributive}, and the entire \citetitle{distributional_hypothesis} tradition, in one breath.

2. **The space is defined by its neighborhoods, not its coordinates.** A high-dimensional embedding space $\mathbb{R}^d$ is not "the space of all possible vectors". It is the space on which a learned similarity function makes certain vectors *near* each other. The coordinates are an accident; the neighborhood structure is the geometry.

3. **Local structure + compatibility = global meaning.** This is the sheaf axiom in plain English. It is also the working principle of an embedding space: the global geometry of meaning is recovered from the way every token behaves locally and from how those local behaviors agree on overlap.

4. **Geometry is the algebra of differences.** Distances, angles, dot products, cosine similarities — these are the *operations* on differences. They turn "different" from a flat predicate into a quantitative, structured relation. This is what makes "embedding" a precise concept and not a metaphor.

5. **"Different" is not "unrelated".** It is "related by a coherent transition". Two vectors far apart in $\mathbb{R}^d$ are not disconnected; they are connected by a path, and that path passes through neighborhoods of intermediate vectors. The geometry of an embedding space is the geometry of all such paths, not just of the points.

If those five points feel obvious, you are ready. If they don't, read this chapter once more — slowly, this time — before opening the next one.
</div>

<div class="optional md" data-headline="A philosophical note: this is a structural hypothesis, not an ontology">
It is worth saying out loud what this chapter *is not* claiming.

It is not claiming that the world is made of mathematics.
It is not claiming that consciousness, space, language, and AI are "really" the same thing.
It is not even claiming that the sheaf picture is the right formalism for everything.

What it *is* claiming is the much weaker — but much more useful — observation that the same *structural shape* — distinction, relation, transformation, locality, compatibility, coherence, gluing, globality, invariance — shows up in genuinely different domains, and that this observation pays off when we want to reason about embeddings, because an embedding space is one more place where that shape is realized.

This kind of cross-domain structural analogy is what \citeauthor{lumpschool} (in the philosophy of mathematics) and various "structural realist" programs mean by *structural realism*: take the structural shape seriously, treat the underlying substance as a placeholder, and see how far you can go. For our purposes, the answer is: surprisingly far — but only as long as we remember that we are working with a lens, not with the thing-in-itself. The lens makes the next chapter legible. The next chapter makes the lens concrete. After that, the lens and the concrete picture will need to keep adjusting to each other.
</div>

<div class="optional md" data-headline="Coda: a remark on Whitehead and Heraclitus">
Two historical notes, since they are too beautiful to omit.

The 5th-century BCE philosopher \citeauthor{heraclitus_unity} is reported (in fragment B50) to have said: *"You cannot step into the same river twice, for fresh waters are ever flowing in upon you."* The fragment is usually read as a doctrine of *flux* — everything changes, nothing stays. But it can equally be read as a doctrine of *coherent difference*: the river at time $t_1$ and the river at time $t_2$ are not identical, but they are related by a coherent transition (the flow of water), and the river-as-object is the coherent network of all those appearances across time. Heraclitus, on the second reading, is already gesturing at the sheaf picture.

A little over two millennia later, \citeauthor{whitehead_process} (\citeyear{whitehead_process}) built an entire metaphysics on the idea that the world is made of *processes*, not *substances* — "becoming" rather than "being". His word *concrescence* names exactly the operation we have been calling gluing: many prehensions (local graspings) come together into one actual occasion (a global entity) \cite{whitehead_process}. Whitehead's "process and reality" is, formally, a sheaf-theoretic picture of the world, decades before sheaves were formulated in their modern form.

The history of ideas is not a ladder. It is a sheaf.
</div>

<div class="md">
## 12. The next click

Open the <a href="embeddinglab">Embeddings chapter</a>. You will see a tokenizer turn words into integers, an embedding matrix turn integers into vectors, and an interactive playground where you can poke at the geometry of meaning. None of that will surprise you now, because you already know the structural idea it is instantiating: meaning is not in any single point; meaning is in the coherent web of differences.

Once you have read it, come back to this chapter if the formal machinery starts to feel heavy. The chain on page one is the anchor. As long as you can place each new definition somewhere on the chain, the chapter will keep making sense.
</div>
