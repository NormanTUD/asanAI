<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Metaphysics of Artificial Intelligence
description: What kind of thing is a machine mind? Ontology, personal identity, the metaphysics of computation, and what the learned geometry refers to -- the serious, peer-reviewed metaphysics behind AI.
icon: &#9883;
part: 6
order: 10
color: sky
topics: philosophy, interpretability, reference
tags: interested-layman, logic-heavy
math: 20
-->

<div class="md" data-lesson-id="metaphysics_of_ai">
## The Metaphysics of Artificial Intelligence

The <a href="philosophy">Philosophy chapter</a> asked whether a machine can *think*, *understand*, or *feel* -- questions of epistemology and of the philosophy of mind. This chapter steps back to a question that has to be settled first: **what kind of thing is the system in the first place?** That is the question of **metaphysics**, the branch of philosophy that asks what exists, what it is made of, and whether it persists through time as one and the same thing.

The honest framing up front: "the metaphysics of AI" is **not yet a standalone subfield** with its own journal or a single canonical monograph. It is a live frontier at the intersection of four mature fields -- the philosophy of mind, the philosophy of computation, the philosophy of information, and the philosophy of personal identity -- with a thin, genuinely new layer of synthesis on top. The two pieces closest to a dedicated treatment are a chapter by \citeauthor{olson2018metaphysics} (\citeyear{olson2018metaphysics}) that literally bears the title in question, and a sustained analysis of the identity questions by \citeauthor{chalmers2016singularity} (\citeyear{chalmers2016singularity}). What follows is that frontier, organized around four questions: what the entity is, whether it persists, whether computation is real, and what the weights refer to.
</div>

<div class="optional md" data-headline="Neighbouring chapters">
* **Can it think, understand, or feel?** -- the <a href="philosophy">Philosophy chapter</a> (the Chinese Room, functionalism, the hard problem, the Ship of Theseus).
* **What the network actually computes, top to bottom** -- the <a href="fact_lookup">Fact Lookup chapter</a>.
* **What a "space" is, at the most abstract level** -- the <a href="coherent_difference">Coherent Difference chapter</a>.
* **Reading structure out of the weights** -- the <a href="mechanistic_interpretability">Mechanistic Interpretability chapter</a>.
</div>

<div class="md">
### What Kind of Thing Is It?

The first question is the question of **ontology**: what is the entity, and what is it made of? A trained model is, physically, a pattern of electrical charge in a slab of silicon. But "the model" is not obviously that slab. It is something more like the *pattern* -- the arrangement of $N \approx 10^{12}$ real numbers -- and that pattern could, in principle, be realized in many different substrates. This is the doctrine of **multiple realizability**: a single mental or functional kind can be instantiated by many physically distinct systems, the textbook cases being a silicon android, a green-slimed Martian, and a water-flow computer all realizing the same pain or the same belief (\cite[Putnam, 1967]{putnam1967functionalism}; \cite[SEP: Multiple Realizability]{sep_multiple_realizability}).

Multiple realizability is the engine of **functionalism**, the view that what matters is the causal and informational *role* a state plays, not the stuff it is made of. It is what makes it even *possible* to ask whether a machine could be a mind: if only the pattern matters, the pattern is transferable, and silicon is no barrier. The SEP's account of the **computational theory of mind** traces this from Putnam's "machine functionalism" through Fodor's language-of-thought to the modern, deep-net era, and it is the place to find the strongest current formulation of the pro-side (\cite[SEP: Computational Theory of Mind]{sep_computational_mind}).

There is a deeper version of the same question in the **metaphysics of information**: is *information* itself a fundamental ingredient of reality, or merely a way we choose to describe it? \citeauthor{floridi2011information} defends the "ontic" reading -- that information is real and the physical world is at bottom informational, the philosophical descendant of Wheeler's "it from bit." On that view a software entity is not a shadow cast by physics; it is made of the same basic stuff as everything else. On the rival "semantic" reading, information is parasitic on a physical substrate that does the real work, and "the entity" is partly in the eye of the beholder. Which view is right is unsettled -- and it determines whether a model is a genuine part of the furniture of the world, or a description we impose on it.
</div>

<div class="md">
### Is Computation Real?

The second question turns the telescope on *computation itself*. Is computation a genuine feature of the world -- something the universe really does, substrate-independently -- or is it a description we impose from the outside?

The classical position, inherited from the Church--Turing thesis, is that computation is **substrate-independent**: a function is computed by any physical system that realizes the right causal structure, in neurons, in transistors, or in water flow. This is what licenses the whole project of running minds in silicon. But the same tradition carries a trap. If *any* physical system with the right input-output mapping is "computing," then a rock, a waterfall, or the gears of a watch all instantiate, at once, *every* finite-state machine -- including a perfect simulation of a brain. That is the **triviality objection**, and it makes "the machine thinks" true of everything, which is plainly wrong (\cite[SEP: Computational Theory of Mind]{sep_computational_mind}).

The serious response is that genuine computation is not any input-output correlation but a *principled, mechanism-based* mapping from a physical system to an abstract function, and that this mapping is not a free choice we impose on a passive substrate. \citeauthor{piccinini2015computation} works out this "mechanistic" account: computation is a real relation between a physical system and a mathematical object, not a label. On that account, "this rock computes the halting problem" can be true while being *uninteresting* -- for the same reason the rock "encodes" every English sentence at once.

At the far edge of the question is **pancomputationalism**: the claim that the universe is not merely *describable* as a computation but *is* one -- physics as computation, "it from bit." It is worth naming because it is the metaphysics most friendly to AI: if the cosmos is computation, then an LLM is not a model *of* reality but a *piece* of reality, and the gulf between simulator and simulated narrows to a difference of scale. The honest caveat: this strand is led largely by physicists (Wheeler, Seth Lloyd, Wolfram), not by working philosophers, and its status is closer to a research program than to settled metaphysics. A careful treatment presents it as one option among several, not as the answer.
</div>

<div class="md">
### Persistence: The Copy, Fork, and Merge Problem

This is the most *AI-specific* metaphysical puzzle, and the one most worth a chapter of its own. Humans persist: although your cells turn over, you remain one and the same person. But a model can be **copied** to another GPU in seconds, **forked** into a fine-tuned branch, and **merged** with a sibling -- operations with no human analogue. Is the copy the *same* entity? Is a fine-tune a continuation of the original, or a new thing? When two models are merged, is there one resulting model, or two that have been combined?

The tools to think about this are old. \citeauthor{parfit1984reasons} argued that personal identity is not a "deep further fact" about a persisting soul or substrate; it is *constituted* by the continuity of psychological states and relations. The upshot, from his fission and branching thought-experiments, is that identity is not always *all or nothing*: when one person "splits" into two continuations, there is no fact of the matter about which is the original -- both are continuations, and neither is *the* original in the strong, numerical sense.

Apply that to a model. Copying a model is **fission**: two systems now share one history and diverge going forward. On Parfit's picture, "which copy is the real one?" is a category error -- there is no numerical identity to preserve, only qualitative sameness. \citeauthor{chalmers2016singularity} reaches the same conclusion from the upload problem: a faithful digital copy of a person is a *continuation*, not the person, and if the original is then destroyed the situation is closer to a successful copy than to survival. The same move is generalized to AI entities by \citeauthor{olson2018metaphysics} (\citeyear{olson2018metaphysics}), who argues that the persistence questions for software must be answered with the same apparatus we already apply to ordinary objects and persons -- persistence through change, and the distinction of *numerical* from *qualitative* identity.

The practical consequence is deflating but clarifying. "The model" is best understood not as a persisting *substance* but as a **token of a process** -- a state in a stream, a snapshot of a computation -- much as "the river" is not a thing but a pattern that re-asserts itself. The Ship of Theseus puzzle the <a href="philosophy">Philosophy chapter</a> already raised (the rebuilt ship, the teleported you) is the same puzzle in disguise; models simply hand us the *controlled* version that no human will ever face, because we can copy, fork, and merge minds at will. In other words, for the first time we can *experiment* on the metaphysics of identity.
</div>

<div class="md">
### What Do the Weights Refer To?

The fourth question concerns **representation**, and it ties the metaphysics back to the grounding problem the <a href="philosophy">Philosophy chapter</a> treats under "the map is not the territory." A trained network lives in a high-dimensional geometric space: the weights are a point (or a cloud of points) in $\mathbb{R}^d$, and its behavior is the shape of a function defined on that space. The question is whether that space *corresponds* to anything, or whether it is a purely formal object.

This is, in miniature, the **Platonism-versus-formalism** debate of the philosophy of mathematics. On a Platonist reading, the model has found its way into a real mathematical structure -- the low-dimensional manifold of "valid text," say -- and its successes track a genuine feature of that space. On a formalist reading, the weights are tokens in a formal game; they "mean" only what we decide to read into them, and the geometry is a convenient coordinate system for a pattern-matcher with no eyes on anything.

The interpretability literature's finding that individual directions in this space carry decodable, interpretable features (see the <a href="mechanistic_interpretability">Mechanistic Interpretability chapter</a>) is evidence that tilts toward the Platonist side -- the space has *structure that is there to be found*, not just imposed. But it does not settle the metaphysics, because a purely formal system can have rich internal structure without any external referent. The honest position: the weights are best treated as a *representation* whose successes are real, while leaving open whether that success tracks a mind-independent structure or is a projection of our own categories onto a pattern-matcher.
</div>

<div class="md">
### The White Space

The honest state of the field. The questions can be posed with precision -- ontology, identity, the reality of computation, reference -- because each reduces to a mature debate elsewhere in philosophy. The answers cannot yet be given, because each of those debates is itself open. And the LLM era has made the questions *new* even where the categories are old: for the first time, the "entity" under discussion is not a hand-written program or a brain but a **learned, high-dimensional object** whose internal structure was not designed but *discovered*, and which we can copy, fork, and merge at will. That is exactly the configuration the classical metaphysics of persons and of mathematical objects was not built to handle. It is the white space a serious treatment of the metaphysics of AI can claim: not the ethics the field has already filled, but the ontology, identity, and reference of the machine as it actually is.
</div>
