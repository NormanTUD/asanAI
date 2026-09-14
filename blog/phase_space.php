<?php include_once("functions.php"); ?>
<!--
    COURSE_METADATA
    title: "Phase Space: The Shape of Meaningful Language"
    description: "A geometric and topological theory of meaningful language spaces — the possibility space X, its image under interpretation π: X → S, and the landscapes of clusters, filaments, and voids — the shape of a sparse, structured distribution."
    icon: "🌌"
    part: "Mathematics"
    order: 6
    color: "#7c3aed"
    topics: ["phase space", "geometric topology", "meaningful language", "clusters and voids", "interpretation map", "fiber bundle", "heavy-tail distribution", "landscape"]
-->

<style>
/* ── Phase Space interactive demos (theme-aware, scoped by .ps- prefix) ── */
.ps-card { background: var(--mn-surface); border: 1px solid var(--mn-border); border-radius: var(--mn-radius-md); padding: 1rem 1.15rem; margin: 1.3rem 0; box-shadow: var(--mn-shadow-md); }
.ps-card-title { font-weight: 600; color: var(--mn-accent); margin-bottom: .7rem; display: flex; align-items: center; gap: .5rem; font-family: var(--mn-font-heading); font-size: 1.02rem; }
.ps-card-title .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mn-accent); box-shadow: 0 0 10px var(--mn-accent); flex: 0 0 auto; }
.ps-lead { color: var(--mn-text-secondary); }
.ps-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; align-items: start; }
.ps-grid4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .75rem; margin: .9rem 0; }
.ps-controls { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; margin: .8rem 0; padding: .8rem; background: var(--mn-bg-subtle); border-radius: 10px; }
.ps-control { display: flex; flex-direction: column; gap: .4rem; min-width: 150px; flex: 1; }
.ps-control label { font-size: .8rem; color: var(--mn-text-secondary); display: flex; justify-content: space-between; gap: .5rem; }
.ps-control label b { color: var(--mn-accent); font-family: var(--mn-font-mono); font-weight: 600; }
.ps-controls input[type=range], .ps-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: var(--mn-border); border-radius: 2px; outline: none; }
.ps-controls input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--mn-accent); border-radius: 50%; cursor: pointer; }
.ps-controls input[type=range]::-moz-range-thumb { width: 16px; height: 16px; background: var(--mn-accent); border-radius: 50%; cursor: pointer; border: 0; }
.ps-btn { background: var(--mn-accent); color: #fff; border: 0; padding: .5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: .85rem; }
.ps-btn:hover { filter: brightness(1.12); }
.ps-btn.ghost { background: var(--mn-surface-raised); color: var(--mn-text-secondary); border: 1px solid var(--mn-border); font-weight: 500; }
.ps-btn.ghost:hover { color: var(--mn-accent); border-color: var(--mn-accent); filter: none; }
.ps-btn.active { background: var(--mn-accent); color: #fff; }
.ps-row { display: flex; gap: .55rem; flex-wrap: wrap; margin: .6rem 0; }
.ps-canvas { width: 100%; height: auto; display: block; border-radius: 10px; border: 1px solid var(--mn-border); background: var(--mn-bg-subtle); }
.ps-plot { width: 100%; min-height: 340px; }
.ps-3d { width: 100%; height: 460px; border-radius: 10px; border: 1px solid var(--mn-border); overflow: hidden; cursor: grab; }
.ps-readout { font-family: var(--mn-font-mono); font-size: .9rem; color: var(--mn-emerald); background: var(--mn-bg-subtle); padding: .75rem 1rem; border-radius: 8px; border-left: 3px solid var(--mn-emerald); margin: .8rem 0; white-space: pre-wrap; line-height: 1.5; }
.ps-example { background: var(--mn-bg-cream); border-left: 3px solid var(--mn-coral); padding: .7rem 1rem; border-radius: 0 8px 8px 0; margin: .6rem 0; font-style: italic; font-size: 1.05rem; }
.ps-field { background: var(--mn-bg-subtle); border-radius: 10px; padding: .7rem .8rem; border: 1px solid var(--mn-border-light); }
.ps-field .name { font-size: .72rem; color: var(--mn-text-muted); text-transform: uppercase; letter-spacing: .05em; }
.ps-field .val { font-size: 1.4rem; font-weight: 700; font-family: var(--mn-font-mono); }
.ps-bar { height: 6px; background: var(--mn-border-light); border-radius: 3px; overflow: hidden; margin-top: .45rem; }
.ps-bar-fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
.ps-callout { border-left: 3px solid var(--mn-accent); background: var(--mn-bg-warm); padding: .8rem 1rem; border-radius: 0 10px 10px 0; margin: .9rem 0; }
.ps-callout.a { border-color: var(--mn-emerald); background: var(--mn-emerald-light); }
.ps-callout.q { border-color: var(--mn-accent4); }
.ps-math { background: var(--mn-bg-subtle); padding: .55rem .9rem; border-radius: 8px; overflow-x: auto; margin: .6rem 0; text-align: center; }
.ps-select { padding: .5rem; background: var(--mn-surface-raised); color: var(--mn-text); border: 1px solid var(--mn-border); border-radius: 6px; }
.ps-tag { display: inline-block; padding: 2px 9px; border-radius: 99px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.ps-tag.hypo { background: var(--mn-accent-light); color: var(--mn-accent-dark); }
.ps-tag.spec { background: var(--mn-coral-light); color: var(--mn-coral); }
.ps-tag.est { background: var(--mn-emerald-light); color: var(--mn-emerald); }
.ps-legend { display: flex; flex-wrap: wrap; gap: 1rem; font-size: .85rem; color: var(--mn-text-secondary); margin: .5rem 0; }
.ps-legend-item { display: flex; align-items: center; gap: .4rem; }
.ps-legend-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
.ps-bigq { font-size: 1.15rem; color: var(--mn-accent); padding: 1rem 1.25rem; background: var(--mn-accent-lighter); border-left: 4px solid var(--mn-accent); border-radius: 0 12px 12px 0; margin: 1.2rem 0; font-weight: 500; }
@media (max-width: 800px) { .ps-grid2 { grid-template-columns: 1fr; } }
</style>


<div class="md">
# Phase Space: The Shape of Meaningful Language

This chapter is a working mathematical treatment of *meaningful language spaces*. It begins from the idea that the objects of study are not tokens, not words, and not even sentences, but the structured *possibility spaces* in which those things live — the space of all potential utterances, the space of all interpretations those utterances can generate, and the spaces of worlds, actions, and consequences in which those interpretations can be tested.

The guiding intuition is that meaning is not a substance carried by individual symbols. Meaning is a property of structure: of the shape of the space, the geometry of its clusters and voids, and the maps that relate one space to another. A single sentence, viewed in isolation, is almost meaningless. What makes it meaningful is its position within a landscape — the nearby utterances, the distant ones, the gaps, the bridges, and the patterns that persist across scale.

The aim of this chapter is to make that intuition precise. We will introduce a space of linguistic forms $X$, a space of semantic structures $S$, and an interpretation map $\pi: X \to S$; we will describe the geometric and topological features of these spaces; we will see how metaphor, ambiguity, and learning correspond to concrete geometric operations; and we will close with a set of open problems that frame a research programme.

This is not a finished theory. It is a scaffold: a set of definitions, conjectures, and diagrams that make the central claims checkable, falsifiable, and extensible.
</div>

<div class="md">
## The central intuition: structure, not statistics

The most common modern approach to language treats it as a *statistical* object. One collects a large corpus, estimates probabilities, and trains a model to predict the next token. By this view, meaning is an emergent byproduct of distributional regularity: a word means what it means because of the words it tends to appear near.

We take a different view. We regard a meaningful language space as a *geometric* and *topological* object, and we regard meaning as a property of its *structure*. Distributional statistics are still important, but they play the role they play in astrophysics: they are the observable signatures of a deeper geometry. Just as a cosmologist infers the distribution of dark matter from the clustering of galaxies, a linguist using our framework would infer semantic structure from the clustering of utterances.

This is not a rejection of statistics. It is a change of *level of description*. The claim is that the most natural and powerful language for describing meaning is the language of spaces, shapes, maps, and invariants — the language of geometry and topology.

This intuition has a long history. The idea that meaning is *relational* and *structural* goes back at least to Saussure's claim that a linguistic sign has value only through its differences from other signs in the system. It was developed in structural semantics, in Tarski's model-theoretic account of truth, and in the cognitive-linguistic work on metaphor and image schemas. What we offer here is a *topological* sharpening of this structural view: not only is meaning relational, but it is *spatial* — it has a shape, and that shape can be studied.
</div>

<div class="md">
# Phase Space: The Shape of Meaningful Language
## The possibility space $X$

Let us begin with the most basic object. Let $X$ be the space of all potential linguistic configurations. An element of $X$ is a *linguistic form*: a string, a phonological pattern, a syntactic frame, or more generally anything that can be uttered or written. We do not need to fix a precise alphabet or grammar at this stage. What matters is that $X$ carries structure:

1. **A topology.** There is a natural notion of *closeness* between linguistic forms. Two forms are close if they differ by a small perturbation — a substitution of a nearby phoneme, a minor syntactic rearrangement, a single-word change. This gives $X$ the structure of a topological space, and often of a metric or pseudometric space.

2. **A measure.** There is a natural notion of *typicality* or *frequency*. Some regions of $X$ are densely populated (common phrases, grammatical frames), others are sparse (novel combinations, poetic inversions). This measure is what makes the *statistics* of language possible, and it is what connects the geometry to observable data.

3. **A notion of scale.** Linguistic structure is visible at every scale: phonemes, morphemes, words, phrases, sentences, discourse, genre. The space $X$ is therefore naturally *multi-scale*, and the right mathematical language for this is that of fractal or self-similar geometry.

The space $X$ is best thought of as a *landscape*: a vast, mostly empty terrain, with islands of high density (frequent, conventional utterances), rivers and filaments connecting the islands (productive grammatical patterns), and wide plains or voids (ungrammatical or simply unused regions).

The landscape metaphor is not merely decorative. It is the source of the central vocabulary of this chapter: *clusters*, *filaments*, and *voids* are not analogies borrowed after the fact, but the actual geometric features of $X$ that the theory is designed to detect and explain.

The picture above is not science fiction. It is a direct transplant of the astrophysical picture of the **cosmic web** — the large-scale distribution of galaxies and dark matter, which is observed to consist of dense **clusters** and **nodes**, connected by thinner **filaments**, and separated by enormous **voids**. The same visual and mathematical logic that a cosmologist applies to the distribution of matter in the universe can, we conjecture, be applied to the distribution of linguistic forms.

<figure style="max-width:760px; margin:1.5em auto; text-align:center;">
	<img src="cosmic_web.jpg" alt="A slice of the cosmic web: clusters and filaments of galaxies and dark matter, set in large voids" style="width:100%; height:auto; border-radius:12px; border:1px solid var(--mn-border);" />
	<figcaption class="md">A slice of the cosmic web: bright **clusters** and **filaments** of galaxies and dark matter, set in vast **voids**. \cite[the linguistic possibility space is conjectured to have the same kind of large-scale shape]{cosmic_web_image}.</figcaption>
</figure>
</div>

<div class="md">
## The space of all possibilities

Before we can ask where meaning *lives*, we need a stage large enough to hold everything — including the noise. Let $V$ be an alphabet (a vocabulary, a token set), and let $N$ be a maximum length. The most basic object is the **possibility space**

$$
X_N \;=\; \bigcup_{n=1}^{N} V^n,
$$

the set of *every* string of length $1,\dots,N$ over $V$. Both the single letter $\texttt{a}$ and the run $\texttt{aaaaaaaaaaaaaaaa}$ are points of $X_N$, and so is every arbitrary string in between. Nothing in $X_N$ yet says that any one of these points is meaningful, grammatical, useful, or even likely to be uttered. $X_N$ is therefore a **space of possibilities, not of observed language** — the full arena in which the structured, meaningful part must be located.

That arena is unimaginably large. The number of strings of a fixed length $n$ is

$$
|V^n| \;=\; |V|^n,
$$

so it grows *exponentially* with length. Even if the set of useful or meaningful configurations grows enormously as we allow longer strings, it can still occupy a vanishingly small fraction of the full combinatorial space. The central question of this chapter is therefore:

> **What is the geometry and topology of the (tiny) subset of $X_N$ that supports structured, meaningful language?**

And a second, sharper one: is the complement — the overwhelming "void" made up of the rest — a homogeneous empty region, or does it too have structure? **[HYPOTHESIS]** It is a *landscape*, not a vacuum: even the void is multiscale, with sub-voids, boundaries, and filaments running through it.
</div>

<div class="ps-card" id="ps-comb-card">
	<div class="ps-card-title"><span class="dot"></span>The combinatorial explosion</div>
	<p class="ps-lead">Drag the sliders and watch how fast the space of all strings grows. Even a modest vocabulary and a short context already out-number the atoms in the observable universe.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>Vocabulary size |V| <b id="ps-comb-vLabel">26</b></label><input type="range" id="ps-comb-V" min="2" max="50000" value="26" step="1"></div>
		<div class="ps-control"><label>Maximum length N <b id="ps-comb-nLabel">5</b></label><input type="range" id="ps-comb-N" min="1" max="100" value="5" step="1"></div>
	</div>
	<div class="ps-row">
		<button class="ps-btn ghost" id="ps-comb-p1">Binary, N=10</button>
		<button class="ps-btn ghost" id="ps-comb-p2">Latin alphabet, N=5</button>
		<button class="ps-btn ghost" id="ps-comb-p3">GPT vocabulary, N=20</button>
	</div>
	<div class="ps-readout" id="ps-comb-readout"></div>
	<div id="ps-comb-plot" class="ps-plot"></div>
	<p class="ps-lead">Observation: the count grows <strong>exponentially</strong>. With a GPT-sized vocabulary and a context of only 20 tokens there are already more possible sequences than atoms in the observable universe. Meaningful language is a <em>vanishingly small</em> subset of this desert.</p>
</div>

<div class="md">
## What $X$ is not: a list of vectors

A common modern move is to represent each utterance as a high-dimensional vector — a "word embedding" or a "sentence embedding" — and to do all the geometry in that vector space. We want to be clear about what our $X$ is and is not relative to this.

**$X$ is not a fixed list of vectors.** There is no finite, canonical basis in which "all of language" is a list of points. The set of possible utterances is (effectively) infinite, and its structure is not linear. A vector-space embedding is a *local, learned approximation* to a region of $X$: it flattens a curved patch of the landscape into a plane. Useful, but a partial view.

**$X$ is a space with a geometry of its own.** What we mean by this is that the interesting mathematical facts about $X$ are *invariant* under change of representation. Whether you embed a region of $X$ in $\mathbb{R}^{300}$ or in $\mathbb{R}^{4096}$, the *topology* — which utterances are connected, which regions are dense, which are voids — should be the same. That is what makes the geometric view more fundamental than any particular embedding: it is about the space, not about the coordinates.

The practical upshot is this. Embeddings are excellent *instruments* for probing $X$ — they are the telescope. But the *object* of study is the space itself, and the theory must be stated in a way that does not depend on any one embedding. When we speak of the "shape of meaning," we mean a property of $X$ that survives the choice of coordinates.
</div>

<div class="md">
## Meaningfulness is a field, not a boundary

A first, crude model would carve out a single set $M \subseteq X$ of "meaningful" utterances and call the rest meaningless. That is too rigid. A string can be syntactically well-formed but semantically anomalous, semantically interpretable but false, internally coherent but disconnected from the world, or meaningful only in a particular context. Meaningfulness is not a yes/no.

A more flexible model assigns a *field* to the space. Start with a single scalar — a coherence function $\rho: X \to [0,1]$. But one number cannot tell the different *ways* a string can fail. A richer description assigns four coherence fields — $C(x)$ syntactic, $S(x)$ semantic, $G(x)$ grounding (world-coupling), and $E(x)$ epistemic determination — each in $[0,1]$. From them we form a **void vector**
$$
V(x) \;=\; \left(1-C(x),\; 1-S(x),\; 1-G(x),\; 1-E(x)\right),
$$
a point in a four-dimensional space whose origin is "fully meaningful" and whose far corners are extreme kinds of emptiness. The point is not that $C,S,G,E$ are the right quantities; it is to make explicit that *'void' is not a single thing* but a *direction* in this space. The four kinds of void considered below are precisely the four coordinate directions of $V(x)$.

<figure style="max-width:480px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 300" class="no-smart" role="img" aria-label="A four-axis radar of coherence fields: a grounded sentence near the edge, and a semantically void but syntactically structured sentence collapsed toward the center" style="width:100%; height:auto; display:block; margin:0 auto;">
<rect x="1" y="1" width="458" height="298" rx="10" style="fill:var(--mn-bg-subtle); stroke:var(--mn-border);" stroke-width="1"/>
<g style="stroke:var(--mn-border);" fill="none;">
<polygon points="230,40 320,130 230,220 140,130"/>
<polygon points="230,63 298,130 230,198 163,130"/>
<polygon points="230,85 275,130 230,175 185,130"/>
<polygon points="230,108 253,130 230,152 208,130"/>
</g>
<line x1="230" y1="40" x2="230" y2="220" style="stroke:var(--mn-border);" stroke-width="1"/>
<line x1="140" y1="130" x2="320" y2="130" style="stroke:var(--mn-border);" stroke-width="1"/>
<polygon points="230,49 307,130 230,202 167,130" style="fill:var(--mn-emerald);" opacity="0.22"/>
<polygon points="230,49 307,130 230,202 167,130" fill="none" style="stroke:var(--mn-emerald);" stroke-width="2"/>
<polygon points="230,58 248,130 230,157 212,130" style="fill:var(--mn-coral);" opacity="0.3"/>
<polygon points="230,58 248,130 230,157 212,130" fill="none" style="stroke:var(--mn-coral);" stroke-width="2"/>
<g style="fill:var(--mn-text-muted); font-size:13px; font-family:inherit; font-weight:600;">
<text x="198" y="32">C &#183; syntax</text><text x="326" y="124">S &#183; meaning</text><text x="196" y="240">G &#183; grounding</text><text x="24" y="124">E &#183; epistemic</text>
</g>
<g style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">
<rect x="120" y="260" width="12" height="12" style="fill:var(--mn-emerald);"/>
<text x="138" y="270">'the dog sleeps' &#8212; grounded</text>
<rect x="120" y="278" width="12" height="12" style="fill:var(--mn-coral);"/>
<text x="138" y="288">'the thought drinks the square Tuesday' &#8212; syntactic, semantically void</text>
</g>
</svg>
<figcaption class="md">A sentence's void vector as a 4-axis radar: a grounded sentence sits near the edge on all four coherence fields, while a sentence that is syntactically structured but semantically empty is collapsed toward the origin on the semantic and grounding axes.</figcaption>
</figure>
</div>

<div class="ps-card" id="ps-rad-card">
	<div class="ps-card-title"><span class="dot"></span>Try different sentences</div>
	<p class="ps-lead">Each sentence is assigned four coherence values in $[0,1]$. The radar shows how far the sentence reaches on each axis — an "ideal" sentence fills the whole square, while real ones usually have <em>holes</em> in particular dimensions.</p>
	<div class="ps-row" id="ps-rad-btns"></div>
	<div class="ps-example" id="ps-rad-sentence"></div>
	<div class="ps-grid4">
		<div class="ps-field"><div class="name">Syntax C</div><div class="val" id="ps-rad-C">&ndash;</div><div class="ps-bar"><div class="ps-bar-fill" id="ps-rad-Cbar"></div></div></div>
		<div class="ps-field"><div class="name">Semantics S</div><div class="val" id="ps-rad-S">&ndash;</div><div class="ps-bar"><div class="ps-bar-fill" id="ps-rad-Sbar"></div></div></div>
		<div class="ps-field"><div class="name">Grounding G</div><div class="val" id="ps-rad-G">&ndash;</div><div class="ps-bar"><div class="ps-bar-fill" id="ps-rad-Gbar"></div></div></div>
		<div class="ps-field"><div class="name">Epistemic E</div><div class="val" id="ps-rad-E">&ndash;</div><div class="ps-bar"><div class="ps-bar-fill" id="ps-rad-Ebar"></div></div></div>
	</div>
	<div id="ps-rad-radar" class="ps-plot" style="min-height:360px"></div>
	<p class="ps-lead">Radar chart: the further out, the stronger the coherence on that axis. Notice how a syntactically perfect sentence can still be almost empty on the semantic and grounding axes.</p>
</div>

<div class="md">
## Four kinds of void

A single binary split between "meaningful" and "meaningless" hides real structure. Once we have the coherence fields, *void* breaks into four distinct kinds — the four coordinate directions of the void vector.

**Syntactic void.** The configuration lacks internal syntactic organization. Example: "asdf qwer seven blue because table tomorrow." Here $C(x)\approx 0$. This is the most straightforward kind of emptiness.

**Semantic void.** The configuration is syntactically structured but fails to form a stable interpretation. Example: "The thought drinks the square Tuesday." It can have $C(x)\approx 1$ while $S(x)\ll 1$ — substantial local structure, but none of the right higher-order relations. High syntactic structure does **not** force high semantic structure.

**Grounding void.** A structure can be internally coherent and semantically well-specified while having no connection to a world: $C(x)\approx 1$, $S(x)\approx 1$, but $G(x)\approx 0$. A purely formal mathematical system is the limiting example — its relations are perfectly well-defined without its symbols naming anything physical.

**Epistemic void.** An expression can have a determinate meaning without its truth being known: $S(x)\approx 1$ does not imply $E(x)\approx 1$. A proposition may be meaningful but unresolved.

These voids are not necessarily separate regions: the same point can be a void with respect to one structure and a dense region with respect to another. The strongest meaningful region is the intersection of all four,
$
M_{\mathrm{strong}} \;=\; C_{\mathrm{syn}} \cap C_{\mathrm{sem}} \cap C_{\mathrm{ground}} \cap C_{\mathrm{epi}},
$
while weaker forms of meaning occupy the other intersections.

### Voids are hierarchical — and have their own dimension

The four kinds of void are not merely four labels; they organize a hierarchy. Voids at one scale contain smaller voids at finer scales, exactly as clusters contain sub-clusters. A large semantic void (an entire region of meaning that no expression reaches) contains, inside it, many smaller syntactic voids, and so on down the scales. The voids themselves form a structured landscape — a "void web," dual to the web of dense regions.

This hierarchy is quantified by the fractal dimension of the structure at each level. Define

- $D_0$: the dimension of the *connected components* (clusters) — how the mass of meaning is distributed;
- $D_1$: the dimension of the *filaments* (the connecting structure);
- $D_2$: the dimension of the *voids* (the gaps).

In a scale-free space these are non-integer, and they obey the kind of scaling relations familiar from the analysis of the cosmic web. The void dimension $D_2$ is especially interesting: it measures how "roomy" the gaps are, and a change in $D_2$ across a paraphrase or a translation is a sensitive probe of whether the deep structure has been preserved.

The key point is that voids are not the *absence* of structure but a *part* of the structure. The shape of the voids is as meaningful as the shape of the clusters. To map a language space completely is to map both.
</div>

<figure style="max-width:460px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 300" class="no-smart" role="img" aria-label="Void as a direction: four arrows from a fully-meaningful center, each pointing toward one kind of void" style="width:100%; height:auto; display:block; margin:0 auto;">
<rect x="1" y="1" width="458" height="298" rx="10" style="fill:var(--mn-bg-subtle); stroke:var(--mn-border);" stroke-width="1"/>
<g style="stroke:var(--mn-coral); stroke-width:2.5;">
<line x1="230" y1="138" x2="230" y2="58"/>
<line x1="242" y1="150" x2="400" y2="150"/>
<line x1="230" y1="162" x2="230" y2="242"/>
<line x1="218" y1="150" x2="60" y2="150"/>
</g>
<polygon points="224,58 236,58 230,46" style="fill:var(--mn-coral);"/>
<polygon points="400,144 400,156 412,150" style="fill:var(--mn-coral);"/>
<polygon points="224,242 236,242 230,254" style="fill:var(--mn-coral);"/>
<polygon points="60,144 60,156 48,150" style="fill:var(--mn-coral);"/>
<circle cx="230" cy="150" r="8" style="fill:var(--mn-emerald);"/>
<text x="230" y="178" text-anchor="middle" style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">fully meaningful</text>
<g style="fill:var(--mn-text); font-size:13px; font-family:inherit; font-weight:600;">
<text x="230" y="30" text-anchor="middle">syntactic void</text>
<text x="230" y="286" text-anchor="middle">grounding void</text>
<text x="398" y="132" text-anchor="end">semantic void</text>
<text x="62" y="132" text-anchor="start">epistemic void</text>
</g>
</svg>
<figcaption class="md">Void is a *direction*, not a place: from the fully-meaningful center, dropping syntax, semantics, grounding, or epistemic determination each leads to a different kind of void.</figcaption>
</figure>

<div class="ps-card" id="ps-void-card">
	<div class="ps-card-title"><span class="dot"></span>Which kind of void?</div>
	<p class="ps-lead">Click a sentence to see its <em>void</em> profile — how much structure is <em>missing</em> on each axis. Two sentences can both be "meaningless" for completely different reasons.</p>
	<div class="ps-row" id="ps-void-btns"></div>
	<div class="ps-example" id="ps-void-sentence">Pick a sentence.</div>
	<div class="ps-grid2">
		<div>
			<div id="ps-void-bars"></div>
			<div class="ps-readout" id="ps-void-diag"></div>
		</div>
		<div id="ps-void-scatter" class="ps-plot" style="min-height:360px"></div>
	</div>
	<p class="ps-lead">The 3D point shows the position in void-space $(V_{\text{syn}}, V_{\text{sem}}, V_{\text{ground}})$. The corners of the cube are extreme cases; metaphor and poetry live in the interesting in-between regions.</p>
</div>

<div class="md">
## Boundaries and phase transitions

Now watch structure degrade. Consider the short progression *the dog sleeps* → *the dog sleeps quickly* → *the dog sleeps quadratically* → *the dog quadratically seven*. Moving along it, several forms of structure fall away one by one. This points to an important object: the **boundary** $\partial M$ of a meaningful region. The hypothesis is that the boundary between coherent and incoherent regions may contain *more* information about semantic organization than the interior of either — the place where meaning breaks is where its structure is most visible.

A **semantic phase transition** is when a small change in configuration produces a qualitative change in connectivity. The first two sentences above are close and both meaningful; the second and third differ by a single word, yet one is meaningful and the other is not. Meaning can fail abruptly, the way water turns to ice — not by losing a little warmth at a time, but by crossing a threshold.

<figure style="max-width:600px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 300" class="no-smart" role="img" aria-label="Structural coherence as a function of a degradation parameter, with a sharp phase-transition drop" style="width:100%; height:auto; display:block; margin:0 auto;">
<rect x="1" y="1" width="458" height="298" rx="10" style="fill:var(--mn-bg-subtle); stroke:var(--mn-border);" stroke-width="1"/>
<line x1="55" y1="40" x2="55" y2="240" style="stroke:var(--mn-border);" stroke-width="1.5"/>
<line x1="55" y1="240" x2="425" y2="240" style="stroke:var(--mn-border);" stroke-width="1.5"/>
<line x1="240" y1="40" x2="240" y2="240" style="stroke:var(--mn-coral);" stroke-width="1.5" stroke-dasharray="4 5"/>
<polyline points="55,52 177,66 300,182 425,220" fill="none" style="stroke:var(--mn-accent);" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<g style="fill:var(--mn-accent);">
<circle cx="55" cy="52" r="4"/><circle cx="177" cy="66" r="4"/><circle cx="300" cy="182" r="4"/><circle cx="425" cy="220" r="4"/>
</g>
<text x="250" y="55" style="fill:var(--mn-coral); font-size:12px; font-family:inherit; font-weight:600;">phase transition</text>
<g style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">
<text x="55" y="258" text-anchor="start">the dog sleeps</text>
<text x="177" y="258" text-anchor="middle">+ quickly</text>
<text x="300" y="258" text-anchor="middle">+ quadratically</text>
<text x="425" y="258" text-anchor="end">+ seven</text>
<text x="235" y="284" text-anchor="middle">degradation t &#8594;</text>
</g>
<text x="20" y="140" text-anchor="middle" transform="rotate(-90 20 140)" style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">structural coherence</text>
</svg>
<figcaption class="md">A degradation sweep: coherence is high and stable, then collapses in a single step as the sentence crosses into the void — a semantic phase transition at the boundary $\partial M$.</figcaption>
</figure>
</div>

<div class="ps-card" id="ps-phase-card">
	<div class="ps-card-title"><span class="dot"></span>Watch structure degrade</div>
	<p class="ps-lead">Drag the slider and watch the same sentence collapse through step-by-step modifications. Coherence does not fall linearly — there is a <em>critical threshold</em>. Exactly there is the boundary $\partial M$, and exactly there is the signal richest.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>Degradation parameter t <b id="ps-phase-tL">0.00</b></label><input type="range" id="ps-phase-t" min="0" max="1" step="0.001" value="0"></div>
	</div>
	<div class="ps-example" id="ps-phase-sentence" style="text-align:center"></div>
	<div id="ps-phase-plot" class="ps-plot"></div>
	<p class="ps-lead">Boundaries are where meaning <em>changes</em>. Interior points are tediously uniform. If we want to understand semantics, we must study the boundaries, not the centres.</p>
</div>

<div class="md">
## Scale and self-similarity

One of the most striking empirical facts about natural language is that it is organized at *every* scale. The same kinds of phenomena — clustering, hierarchy, long-range dependence, heavy tails — appear at the level of phonemes, words, sentences, and discourse. This is the sense in which language is *scale-free* or *self-similar*.

The precise mathematical statement is still an open question, but we can already say this. If $X$ is a fractal-like space, then a "zoom" operation on $X$ — moving from phonemes to words to sentences — should reveal *similar* structure at each level. The clusters at the word level, the filaments at the sentence level, and the voids at the discourse level should be related by a kind of *self-similarity*.

This is not a claim that language is literally self-similar in a strict mathematical sense. It is a claim that the *statistics* of language are approximately scale-invariant over a wide range of scales, and that the *geometry* of $X$ has a corresponding multi-scale structure. The evidence for this is strong and well-documented: Zipf's law for word frequencies, heavy-tailed distributions of sentence lengths, and the persistent, scale-free structure of syntactic dependency.

The consequence for the theory is that the right objects to study are not fixed-scale objects but *scale-invariant* ones. We will therefore pay attention throughout to properties of $X$ that are stable under change of scale — topological invariants, persistent homology, and the large-scale shape of the distribution of forms.
</div>

<div class="ps-card" id="ps-zoom-card">
	<div class="ps-card-title"><span class="dot"></span>Zoom experiment: the same pattern at every scale</div>
	<p class="ps-lead">Move the zoom slider. At every zoom level you see <em>clusters, filaments, and voids</em> again — only the content changes (discourse &rarr; paragraph &rarr; sentence &rarr; phrase &rarr; token). The principle: <em>structures are built from structures.</em></p>
	<div class="ps-controls">
		<div class="ps-control"><label>Zoom level <b id="ps-zoom-zL">1</b> of 5</label><input type="range" id="ps-zoom-z" min="0" max="4" value="0" step="1"></div>
	</div>
	<canvas id="ps-zoom-canvas" class="ps-canvas" width="1000" height="480"></canvas>
	<div class="ps-readout" id="ps-zoom-readout"></div>
	<p class="ps-lead">A discourse is made of paragraphs, a paragraph of sentences, a sentence of phrases, a phrase of tokens — and the same geometric language (cluster / filament / void) describes every level. That is the sense in which the space is <em>self-similar</em>.</p>
</div>

<div class="md">
## The renormalization-group view: meaning has no preferred scale

Because $X$ and $S$ are scale-free and self-similar, the right conceptual tool is not a single scale but a *family* of descriptions, one for each scale. This is the logic of **coarse-graining** and, ultimately, the **renormalization group (RG)**:

- **Coarse-graining.** At each scale, group the fine-grained degrees of freedom into effective variables. The fine details that do not affect the large-scale structure are "integrated out," and what remains is the effective description seen at that scale.
- **Scale invariance.** If the effective description looks the same at all scales (up to a rescaling), the system is *scale-free* — the RG notion of self-similarity.
- **Emergence.** New collective variables appear at each scale that do not exist at finer scales. These emergent variables are the "meanings" at that scale.
- **Fixed points.** A scale-free system is described by an RG *fixed point*: a description that does not change under coarse-graining. The distance from the fixed point controls how strongly the system depends on scale.

Applied to meaning, a *fixed point* of the semantic renormalization group is a structural pattern invariant under coarse-graining — a meaning that does not change when viewed from a different linguistic scale. A *universality class* is a family of languages (or semantic domains) that, despite different micro-details, share the same fixed point: they are "the same" at large scale. This is a precise sense in which two superficially different languages can have the *same deep structure*.

The RG view also sharpens the distinction between *scale-free* and *scale-anchored* structure. Most of the geometry of $X$ (clusters, filaments, voids, hierarchy) is scale-free: it appears at every zoom level. But some features are *scale-anchored*: they exist only at particular scales (the phoneme scale of a given language, the word-boundary convention of a given orthography). In RG language, scale-anchored features are *irrelevant operators* that flow away under coarse-graining, while scale-free features are the *relevant or marginal* operators that survive.
</div>

<div class="ps-card" id="ps-rg-card">
	<div class="ps-card-title"><span class="dot"></span>Coarse-graining, live</div>
	<p class="ps-lead">The same point cloud, seen at four scales (token &rarr; phrase &rarr; sentence &rarr; discourse). As you coarse-grain, fine detail is "integrated out" and only the large-scale clusters survive. The grey ghosts are the finer scale, about to be forgotten.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>Scale <b id="ps-rg-scaleL">0</b></label><input type="range" id="ps-rg-scale" min="0" max="3" step="1" value="0"></div>
	</div>
	<canvas id="ps-rg-canvas" class="ps-canvas" width="700" height="480"></canvas>
	<div id="ps-rg-plot" class="ps-plot"></div>
	<p class="ps-lead">At every scale the *kind* of structure (clusters + voids) is the same; only the number of effective degrees of freedom changes. A fixed point of this process is a description whose coarse-grained form is itself.</p>
</div>

<div class="md">
## Structures are built from structures

The hierarchy does not stop at the usual units of linguistic description. A familiar ladder is

$$
\text{token} \;\to\; \text{phrase} \;\to\; \text{sentence} \;\to\; \text{paragraph} \;\to\; \text{discourse} \;\to\; \text{document},
$$

but the principle is more general than this segmentation. At each level, structures themselves become the *objects* of the next level:

$$
A_1 \;\to\; A_2 \;\to\; A_3 \;\to\; \cdots,
$$

where $A_{k+1}$ is not merely a larger collection of $A_k$'s, but a structure whose elements are the lower-level structures. This suggests a **recursive principle**

$$
\boxed{\text{structures are built from structures}}
$$

together with a **compositional principle**:

$$
A + B \;\longrightarrow\; C(A,B),
$$

where $C(A,B)$ is not the mere union of $A$ and $B$ but a new structure carrying *relations between* $A$ and $B$. For language the crucial point is that composition does not concatenate points — it *creates relations*. Placing **DOG** next to **RUN** does not merely yield a longer string; it yields a relational structure such as

$$
\operatorname{AGENT}(\text{DOG},\ \text{RUN}),
$$

a structured whole whose meaning is not present in either part on its own. This is a *recursive ontology of relations*: local relational structures become the atoms out of which higher-order relational structures are built, and the same geometric vocabulary — clusters, filaments, voids — describes every level.
</div>

<div class="md">
## Scaling laws and heavy tails

Language has no single characteristic scale. A handful of words, phrases, and constructions occur *very* often, while an enormous long tail of forms occurs *very* rarely. This is the fingerprint of a scale-free, potentially fractal organisation — and it is already an established empirical fact about language.

Two classic scaling laws capture it. **Zipf's law** says that the frequency $f$ of the $r$-th most frequent word falls like a power,

$$
f(r) \;\sim\; r^{-\alpha},
$$

and **Heaps' law** says that the vocabulary size $V(N)$ of a text grows sub-linearly with its length $N$,

$$
V(N) \;\sim\; N^{\beta},
$$

so that new words keep appearing and never quite run out. There are also multifractal approaches to language, and work treating it as a complex dynamical system with scale-dependent organisation.

None of this *proves* the semantic-space theory. But it shows that language has strong regularities across scales, and that scaling analysis is a legitimate tool for studying it. The relevant conceptual bridge is

$$
\boxed{\text{language} \;\longrightarrow\; \text{scale-dependent statistical structure}}
$$

rather than the weaker "language is a list of vectors."

**[HYPOTHESIS]** If semantic clusters *and* voids obey related heavy-tailed scaling laws, that would be evidence for the hierarchical organisation proposed here. A possible empirical form is

$$
N_{\mathrm{void}}(r) \;\sim\; r^{-D},
$$

or, separately for each kind of void,

$$
N_{\mathrm{syn}}(r) \sim r^{-D_s}, \qquad N_{\mathrm{sem}}(r) \sim r^{-D_m}, \qquad N_{\mathrm{ground}}(r) \sim r^{-D_g}.
$$

And where a single fractal would need one exponent $D$, language may need a whole *spectrum* $D(q)$ — a multifractal fingerprint in which a mathematical proof, an everyday conversation, a poem, and a random string each trace a different curve.
</div>

<div class="ps-card" id="ps-scale-card">
	<div class="ps-card-title"><span class="dot"></span>Zipf, Heaps &amp; the multifractal spectrum</div>
	<p class="ps-lead">Move the Zipf exponent $\alpha$ and the Heaps exponent $\beta$. On the log&ndash;log plots each law becomes a straight line with slope $-\alpha$ and $\beta$. A flat $D(q)$ means monofractal; a curved one means multifractal — as expected for language.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>Zipf exponent &alpha; <b id="ps-scale-aL">1.00</b></label><input type="range" id="ps-scale-a" min="0.5" max="2.0" step="0.01" value="1.0"></div>
		<div class="ps-control"><label>Heaps exponent &beta; <b id="ps-scale-bL">0.55</b></label><input type="range" id="ps-scale-b" min="0.3" max="0.9" step="0.01" value="0.55"></div>
	</div>
	<div class="ps-grid2">
		<div id="ps-scale-zipf" class="ps-plot"></div>
		<div id="ps-scale-heaps" class="ps-plot"></div>
	</div>
	<div id="ps-scale-dq" class="ps-plot"></div>
	<p class="ps-lead">These regularities are <em>established</em> facts about language. The open question is whether the *semantic* clusters and voids of $X$ obey the same kind of scaling.</p>
</div>

<div class="md">
## The semantic space $S$ and the interpretation map $\pi: X \to S$

The space $X$ by itself is not yet a theory of meaning. A purely linguistic space tells us what can be *said*, but not what it *means*. To get meaning, we need a second space and a map between them.

Let $S$ be the space of *semantic structures*: the space of all possible meanings, propositions, situations, states of affairs, and intentions that linguistic forms can encode. An element of $S$ is not a word or a sentence, but a *structured description of a possible situation*. The space $S$ has its own geometry, and it is not the same geometry as $X$.

The connection between the two spaces is the **interpretation map**
$$
\pi: X \to S.
$$
Given a linguistic form $x \in X$, the map $\pi$ assigns to it a semantic structure $\pi(x) \in S$. This is the act of *interpretation*: the process by which a form is given a meaning.

The map $\pi$ is the heart of the theory. Everything interesting about meaning happens *in* $\pi$ and *because of* $\pi$:

- **Meaning is the image of form under $\pi$.** A form $x$ is meaningful to the extent that $\pi(x)$ is a well-defined, structured element of $S$.
- **Ambiguity is the failure of $\pi$ to be a function.** When a single form $x$ can be interpreted in multiple ways, $\pi$ is not single-valued at $x$; it is a *multivalued* map, or a *relation*. Ambiguity is the branching of $\pi$.
- **Understanding is the construction of $\pi$.** To understand a language is, in this view, to have built a usable approximation to the map $\pi$. Learning a language is learning a map from forms to meanings.
- **Communication is the agreement of two $\pi$'s.** Speaker and listener each have their own interpretation map. Communication succeeds to the extent that their maps agree on the forms that are exchanged.

This reframing has a striking consequence. It makes *meaning* a property of a *map*, not of a *symbol*. A symbol has no intrinsic meaning; it has meaning only relative to the map $\pi$ and the space $S$ into which it is sent. This is a topological version of the classic semantic insight that meaning is use, but stated in the language of spaces and maps.

<figure style="max-width:680px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 300" class="no-smart" role="img" aria-label="Schematic of the cosmic web: clusters of points joined by filaments, set in large voids" style="width:100%; height:auto; display:block; margin:0 auto;">
<rect x="1" y="1" width="458" height="298" rx="10" style="fill:var(--mn-bg-subtle); stroke:var(--mn-border);" stroke-width="1"/>
<g style="stroke:var(--mn-text-muted); stroke-width:1.5; opacity:0.45;">
<line x1="95" y1="75" x2="345" y2="95"/><line x1="95" y1="75" x2="235" y2="215"/><line x1="345" y1="95" x2="235" y2="215"/>
</g>
<g style="fill:var(--mn-accent);">
<circle cx="70" cy="62" r="4"/><circle cx="92" cy="55" r="5"/><circle cx="112" cy="72" r="4"/><circle cx="80" cy="86" r="4"/><circle cx="102" cy="90" r="3.5"/><circle cx="62" cy="80" r="3"/>
</g>
<g style="fill:var(--mn-accent);">
<circle cx="322" cy="82" r="4"/><circle cx="347" cy="72" r="5"/><circle cx="362" cy="98" r="4"/><circle cx="332" cy="108" r="4"/><circle cx="356" cy="112" r="3.5"/>
</g>
<g style="fill:var(--mn-accent);">
<circle cx="202" cy="205" r="4"/><circle cx="228" cy="196" r="5"/><circle cx="252" cy="212" r="4"/><circle cx="212" cy="232" r="4"/><circle cx="242" cy="238" r="4"/><circle cx="266" cy="222" r="3.5"/><circle cx="190" cy="228" r="3"/>
</g>
<g style="fill:var(--mn-text-muted); font-size:13px; font-family:inherit;">
<text x="56" y="34">cluster</text><text x="150" y="150">filament</text><text x="348" y="42">void</text>
</g>
</svg>
<figcaption class="md">Schematic: **clusters** of closely related configurations, joined by **filaments**, set in large **voids** — the shape of a sparse, structured distribution.</figcaption>
</figure>
</div>

<div class="md">
## The hierarchy of semantic structure

Meanings are not a flat set; they are organized in a hierarchy. At the lowest level are *atomic* meanings — the meanings of simple predicates and objects (DOG, RUN, RED). Above them are *compositional* meanings, built from atomic ones by the operations of the language ($AGENT(DOG, RUN)$). Above those are *relational* and *eventual* meanings — situations and scenarios — and above them still, *discourse-level* meanings: narratives, arguments, implications.

The key geometric claim is that this hierarchy is not a chain of separate levels but a *nested, self-similar* structure: the same geometric operations (composition, combination, filling-in) that build a compositional meaning from atomic ones also build a discourse meaning from event meanings. The hierarchy of meaning is, in this view, the same hierarchy of scale that $X$ exhibits.

This is what lets the principle "structures are built from structures" apply to meaning itself: a complex meaning is not a new primitive but a *structure of* simpler meanings. The semantic space $S$ is therefore a *hierarchical fractal* — a space whose parts are, in a precise sense, smaller copies of the whole.
</div>

<div class="md">
## The three-space picture: $X$, $S$, and the world

So far we have two spaces, $X$ and $S$, and a map $\pi: X \to S$. But $S$, the space of semantic structures, is itself not the final word. Meanings are not free-floating; they are *about* something. They refer to states of affairs, situations, and possibilities in the world.

We therefore introduce a third space, $W$, the space of *worlds* or *states of affairs*: the space of all situations that can be described, imagined, or acted upon. There is a natural map from $S$ to $W$ (or, more precisely, a *satisfaction* or *truth* relation between $S$ and $W$): a semantic structure is *satisfied* by, or *true in*, a world to the extent that the world matches the situation the structure describes.

This gives the full three-space picture:

<figure style="max-width:440px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 300" class="no-smart" role="img" aria-label="Three stacked spaces: X, linguistic space; S, semantic space; W, world space; connected by interpretation and truth arrows" style="width:100%; height:auto; display:block; margin:0 auto;">
<rect x="90" y="16" width="280" height="58" rx="10" style="fill:var(--mn-surface); stroke:var(--mn-accent);" stroke-width="1.5"/>
<text x="230" y="51" text-anchor="middle" style="fill:var(--mn-text); font-size:16px; font-family:inherit; font-weight:600;">X &#160;·&#160; linguistic space</text>
<line x1="230" y1="74" x2="230" y2="104" style="stroke:var(--mn-text-muted);" stroke-width="2"/>
<polygon points="224,102 236,102 230,112" style="fill:var(--mn-text-muted);"/>
<text x="244" y="95" style="fill:var(--mn-text-muted); font-size:13px; font-family:inherit;">interpretation</text>
<rect x="90" y="112" width="280" height="58" rx="10" style="fill:var(--mn-surface); stroke:var(--mn-accent);" stroke-width="1.5"/>
<text x="230" y="147" text-anchor="middle" style="fill:var(--mn-text); font-size:16px; font-family:inherit; font-weight:600;">S &#160;·&#160; semantic space</text>
<line x1="230" y1="170" x2="230" y2="200" style="stroke:var(--mn-text-muted);" stroke-width="2"/>
<polygon points="224,198 236,198 230,208" style="fill:var(--mn-text-muted);"/>
<text x="244" y="191" style="fill:var(--mn-text-muted); font-size:13px; font-family:inherit;">truth / satisfaction</text>
<rect x="90" y="208" width="280" height="58" rx="10" style="fill:var(--mn-surface); stroke:var(--mn-accent);" stroke-width="1.5"/>
<text x="230" y="243" text-anchor="middle" style="fill:var(--mn-text); font-size:16px; font-family:inherit; font-weight:600;">W &#160;·&#160; world space</text>
</svg>
<figcaption class="md">The three spaces: linguistic forms $X$, the semantic structures $S$ they map to under interpretation, and the worlds $W$ those structures are about.</figcaption>
</figure>

The three spaces play distinct roles:

- **$X$** is the space of *forms*: what can be expressed.
- **$S$** is the space of *meanings*: what can be expressed *as*.
- **$W$** is the space of *situations*: what meanings can be *about*.

The map $\pi: X \to S$ is the act of interpretation; the relation $S \models W$ is the act of reference or truth. Meaning lives in the *composition* of these two: a form $x$ is meaningful and true to the extent that there is a well-defined path $x \mapsto \pi(x) \models w$ for some world $w$.

This three-space picture is, we believe, the right *topology* for a theory of meaning. It separates the three things that are often conflated — expression, interpretation, and reference — and it makes precise the sense in which meaning is a *mediated* relation between language and world.
</div>

<div class="md">
## Semantics as structure, not label

The most important conceptual shift in this chapter is a single one: a meaning is not a *label* attached to a point of $X$. A label is a name we paste on a configuration — "this point means *DOG-CHASES-CAT*." The geometric view replaces labels with *structure*: a meaning is the *pattern of relations* that a region of $X$ participates in, and it is that pattern — not any intrinsic property of the point — that constitutes the meaning.

Two consequences follow. First, *synonymy and paraphrase* are explained naturally: two different points (two different forms) have the same meaning precisely because they sit in the *same structural position* — the same relations to their neighbourhood, the same place in the web. Same structure, same meaning, different label. Second, *novel meaning* is explained naturally: a new form is meaningful when it is *absorbed into the existing structure* — when it takes up a structural position in the web, even though no label has ever been attached to it before. Productivity is the ability to create new points that fit the existing structure.

This is the topological version of the classic insight that "meaning is use," or that "the meaning of a word is its role in the language." Stated geometrically, it becomes precise: the role of a form *is* its position in a structured space, and that position is a geometric object.
</div>

<div class="md">
## Clusters, filaments, and voids

We now turn to the geometric features of $X$ (and, derivatively, of $S$). The central claim of this chapter is that a meaningful language space has a characteristic *shape*, and that the shape is best described by three kinds of feature:

**Clusters** are regions of $X$ that are densely populated and internally cohesive. They correspond to *conventional* or *frequent* linguistic configurations: idioms, collocations, grammatical frames, topic domains. A cluster is a place where many utterances are close to one another and where the interpretation map $\pi$ is relatively stable and predictable.

**Filaments** are thin, elongated regions of moderate density that *connect* clusters. They correspond to *productive* patterns: grammatical operations, constructions, and schemas that allow one to move from one conventional region to another by a regular, rule-like transformation. A filament is a *bridge* between clusters, and it is the structural basis of *productivity* — the ability to generate and understand novel utterances.

**Voids** are regions of $X$ that are sparsely or not at all populated. They correspond to *ungrammatical*, *infelicitous*, or simply *unused* configurations. A void is not merely "missing data"; it is a *meaningful absence*. The shape of the voids is as informative as the shape of the clusters, because the voids define the boundaries of the possible.

Together, clusters, filaments, and voids define the *landscape* of the language space. The landscape is not uniform: it is a hierarchy of dense regions connected by thin bridges, set against a background of empty space. This is precisely the shape that is observed in other complex, scale-free systems — most famously, the large-scale structure of the universe.

The importance of this trichotomy is that it gives a *geometric* account of three central linguistic phenomena:

- **Convention** is *cluster-ness*: the tendency of frequent usage to form dense, stable regions.
- **Productivity** is *filament-ness*: the existence of regular, connective structure that allows generalization.
- **Constraint** (grammaticality, felicity) is *void-ness*: the existence of large, structured regions of the possible that are simply not realized.

A theory of meaning that captures these three features captures, we argue, the essential *shape* of linguistic structure.

The picture generalizes in a natural way. There is not one landscape but a *stack* of coupled ones: a syntactic landscape, a semantic landscape, a grounding landscape, and an epistemic landscape, each with its own clusters, voids, and boundaries, and each correlated with the others. Strong syntax tends to make semantic structure more likely; grounding imposes further constraints on what can be meaningful; and the epistemic layer records where the system is certain and where it is still open. Meaning is strong where these layers align, and weak or absent where they diverge.
</div>

<div class="ps-card" id="ps-web-card">
	<div class="ps-card-title"><span class="dot"></span>A simulated cosmic web of language</div>
	<p class="ps-lead">Each point is a hypothetical sentence. <strong>Clusters</strong> are semantically related regions, <strong>filaments</strong> connect them, and the <strong>voids</strong> are deserts of nonsense. Move your mouse over the map — it zooms in locally, and you see the <em>same structure at a finer scale</em>.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>Number of clusters <b id="ps-web-kL">6</b></label><input type="range" id="ps-web-k" min="2" max="20" value="6"></div>
		<div class="ps-control"><label>Cluster density <b id="ps-web-dL">0.50</b></label><input type="range" id="ps-web-d" min="0" max="1" step="0.01" value="0.5"></div>
		<div class="ps-control"><label>Filament strength <b id="ps-web-fL">0.40</b></label><input type="range" id="ps-web-f" min="0" max="1" step="0.01" value="0.4"></div>
		<div class="ps-control"><label>Noise points in the void <b id="ps-web-nL">80</b></label><input type="range" id="ps-web-n" min="0" max="500" value="80"></div>
	</div>
	<canvas id="ps-web-canvas" class="ps-canvas" width="1000" height="560"></canvas>
	<div class="ps-legend" id="ps-web-legend">
		<span class="ps-legend-item"><span class="ps-legend-dot"></span>Cluster (dense meaning)</span>
		<span class="ps-legend-item"><span class="ps-legend-dot"></span>Filament (transition)</span>
		<span class="ps-legend-item"><span class="ps-legend-dot"></span>Void noise (unstructured nonsense)</span>
	</div>
	<p class="ps-lead">The central claim: <em>this structure is self-similar.</em> Zoom into a cluster and you see sub-clusters, sub-filaments, and sub-voids — the same shape, one level down.</p>
</div>

<figure style="max-width:560px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 360" class="no-smart" role="img" aria-label="A stack of four coupled landscapes: syntactic, semantic, grounding, and epistemic, each with clusters, voids, and boundaries" style="width:100%; height:auto; display:block; margin:0 auto;">
<rect x="20" y="16" width="420" height="64" rx="10" style="fill:var(--mn-surface); stroke:var(--mn-border);" stroke-width="1"/>
<text x="36" y="44" style="fill:var(--mn-text); font-size:15px; font-family:inherit; font-weight:600;">syntactic landscape</text>
<text x="36" y="62" style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">clusters · voids · boundaries</text>
<g style="fill:var(--mn-accent);"><circle cx="300" cy="44" r="4"/><circle cx="316" cy="40" r="4"/><circle cx="330" cy="48" r="4"/><circle cx="308" cy="54" r="4"/></g>
<line x1="402" y1="34" x2="402" y2="62" style="stroke:var(--mn-coral);" stroke-width="2"/>
<line x1="230" y1="80" x2="230" y2="96" style="stroke:var(--mn-text-muted);" stroke-width="2"/>
<polygon points="225,96 235,96 230,104" style="fill:var(--mn-text-muted);"/>
<rect x="20" y="104" width="420" height="64" rx="10" style="fill:var(--mn-surface); stroke:var(--mn-border);" stroke-width="1"/>
<text x="36" y="132" style="fill:var(--mn-text); font-size:15px; font-family:inherit; font-weight:600;">semantic landscape</text>
<text x="36" y="150" style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">clusters · voids · boundaries</text>
<g style="fill:var(--mn-accent);"><circle cx="300" cy="132" r="4"/><circle cx="316" cy="128" r="4"/><circle cx="330" cy="136" r="4"/><circle cx="308" cy="142" r="4"/></g>
<line x1="402" y1="122" x2="402" y2="150" style="stroke:var(--mn-coral);" stroke-width="2"/>
<line x1="230" y1="168" x2="230" y2="184" style="stroke:var(--mn-text-muted);" stroke-width="2"/>
<polygon points="225,184 235,184 230,192" style="fill:var(--mn-text-muted);"/>
<rect x="20" y="192" width="420" height="64" rx="10" style="fill:var(--mn-surface); stroke:var(--mn-border);" stroke-width="1"/>
<text x="36" y="220" style="fill:var(--mn-text); font-size:15px; font-family:inherit; font-weight:600;">grounding landscape</text>
<text x="36" y="238" style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">clusters · voids · boundaries</text>
<g style="fill:var(--mn-accent);"><circle cx="300" cy="220" r="4"/><circle cx="316" cy="216" r="4"/><circle cx="330" cy="224" r="4"/><circle cx="308" cy="230" r="4"/></g>
<line x1="402" y1="210" x2="402" y2="238" style="stroke:var(--mn-coral);" stroke-width="2"/>
<line x1="230" y1="256" x2="230" y2="272" style="stroke:var(--mn-text-muted);" stroke-width="2"/>
<polygon points="225,272 235,272 230,280" style="fill:var(--mn-text-muted);"/>
<rect x="20" y="280" width="420" height="64" rx="10" style="fill:var(--mn-surface); stroke:var(--mn-border);" stroke-width="1"/>
<text x="36" y="308" style="fill:var(--mn-text); font-size:15px; font-family:inherit; font-weight:600;">epistemic landscape</text>
<text x="36" y="326" style="fill:var(--mn-text-muted); font-size:12px; font-family:inherit;">certainty · uncertainty · voids</text>
<g style="fill:var(--mn-accent);"><circle cx="300" cy="308" r="4"/><circle cx="316" cy="304" r="4"/><circle cx="330" cy="312" r="4"/><circle cx="308" cy="318" r="4"/></g>
<line x1="402" y1="298" x2="402" y2="326" style="stroke:var(--mn-coral);" stroke-width="2"/>
</svg>
<figcaption class="md">A stack of coupled landscapes: each layer has its own clusters, voids, and boundaries, and the layers are correlated with one another. Meaning is strong where the layers align.</figcaption>
</figure>

<div class="md">
## Metaphor as a filament

Consider the sentence *time is a river*. The concepts **TIME** and **RIVER** normally occupy quite different neighbourhoods of the semantic space: one is abstract and temporal, the other concrete and physical. And yet the sentence is immediately, richly meaningful. What makes it work?

The picture of the previous section suggests an answer. A metaphor does not place a new point inside an existing cluster; it **creates a connection between two regions that are not ordinarily adjacent**. It weaves a *filament* — a narrow bridge of structure — across the void that separates them.

**[SPECULATION]** Metaphor is therefore a mechanism that creates or strengthens *long-range* connections between otherwise separated semantic regions. This makes it structurally different from ordinary local similarity ("dog" sits near "cat"): local similarity moves *within* a cluster, whereas metaphor opens a *new filament* between clusters.

Seen through the lens of **homotopy type theory**, this is exactly the right way to think about it. In HoTT a *path* between two points is not a bare assertion that they are related — it is a *witness of a transformation* that carries one to the other. A metaphorical filament is precisely such a path: it does not merely link TIME and RIVER, it *transports structure* from one region to the other. The words *flow, current, depth, bank, source, mouth* are the local data of the path — the specific relations it carries across. Two metaphors can connect the same two regions by *different* paths (different mappings), and it is the content of the path that makes one metaphor fruitful and another empty. In this sense a metaphor is a **meaningful transformation**: a path whose interior structure is itself semantic content.
</div>

<div class="ps-card" id="ps-meta-card">
	<div class="ps-card-title"><span class="dot"></span>Activating the metaphorical bridge</div>
	<p class="ps-lead">Pick a metaphor and watch a filament form between two semantic regions that are otherwise far apart. The words along the filament are the *structure the path carries* — the mapping from source to target.</p>
	<div class="ps-row" id="ps-meta-btns"></div>
	<canvas id="ps-meta-canvas" class="ps-canvas" width="1000" height="500"></canvas>
	<div class="ps-readout" id="ps-meta-readout"></div>
	<p class="ps-lead">Structurally, metaphor differs from *local* semantic similarity: it creates <em>topologically new</em> connections between distant regions — a long-range path, not a short step inside a cluster.</p>
</div>

<div class="md">
## The fiber-bundle view: meaning as a family of structures

The map $\pi: X \to S$ invites a more sophisticated geometric treatment. If we view $\pi$ as a **fiber bundle** projection, then each point $s \in S$ (a meaning) has a **fiber** $\pi^{-1}(s) \subseteq X$ over it: the set of all linguistic forms that express that meaning.

The fiber-bundle view has several consequences:

1. **Meanings are the base; forms are the fibers.** The "real" structure is in the base space $S$; the forms in $X$ are the many-to-one covering of that structure. Two forms that are far apart in $X$ may lie in the same fiber, and hence express the same meaning.

2. **Paraphrase is a path within a fiber.** To paraphrase is to move from one point in a fiber to another, staying over the same meaning. The geometry of a fiber is the geometry of *paraphrase*: the space of all ways of saying the same thing.

3. **Synonymy is a property of fibers, not of points.** Two words are synonyms not in an absolute sense, but relative to a meaning: they are close in $X$ *within the same fiber*. Synonymy is a fiber-local relation.

4. **The bundle can have non-trivial topology — and paths act on fibers.** The fibers need not be trivial products; the bundle over $S$ can have *twists* and *monodromy*. In the language of homotopy type theory each fiber is a *type* sitting over its base point, and a *path* in the base $S$ *transports* a point of one fiber to a point of another — the action of a path, also called *monodromy*. Travel once around a loop in $S$ and a form can be carried back to a *different* form in the same fiber. This is the precise sense in which "the way of saying" a meaning can depend on the *path* by which one arrives at it: meaning is path-dependent, exactly as identity types are in a type theory.

The fiber-bundle picture is, we think, the right level of mathematical abstraction for the relation between form and meaning. It captures the many-to-one nature of interpretation, the locality of paraphrase and synonymy, and the global complexity of the form–meaning relation.

<figure style="max-width:660px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 320" class="no-smart" role="img" aria-label="Fiber bundle: many linguistic forms in X project down to a few semantic structures in S" style="width:100%; height:auto; display:block; margin:0 auto;">
<text x="22" y="16" style="fill:var(--mn-text-muted); font-size:13px; font-family:inherit;">X — linguistic forms</text>
<rect x="20" y="24" width="420" height="112" rx="8" style="fill:var(--mn-surface); stroke:var(--mn-border);" stroke-width="1"/>
<text x="22" y="182" style="fill:var(--mn-text-muted); font-size:13px; font-family:inherit;">S — semantic structures</text>
<rect x="20" y="190" width="420" height="112" rx="8" style="fill:var(--mn-surface); stroke:var(--mn-border);" stroke-width="1"/>
<g style="stroke:var(--mn-text-muted); stroke-width:0.8; opacity:0.35;">
<line x1="65" y1="55" x2="100" y2="245"/><line x1="90" y1="48" x2="100" y2="245"/><line x1="115" y1="62" x2="100" y2="245"/><line x1="78" y1="88" x2="100" y2="245"/><line x1="105" y1="98" x2="100" y2="245"/>
<line x1="195" y1="52" x2="230" y2="245"/><line x1="220" y1="45" x2="230" y2="245"/><line x1="248" y1="60" x2="230" y2="245"/><line x1="205" y1="85" x2="230" y2="245"/><line x1="238" y1="98" x2="230" y2="245"/>
<line x1="325" y1="55" x2="360" y2="245"/><line x1="350" y1="48" x2="360" y2="245"/><line x1="378" y1="62" x2="360" y2="245"/><line x1="335" y1="88" x2="360" y2="245"/><line x1="368" y1="98" x2="360" y2="245"/>
</g>
<g style="fill:var(--mn-accent);">
<circle cx="65" cy="55" r="3.5"/><circle cx="90" cy="48" r="3.5"/><circle cx="115" cy="62" r="3.5"/><circle cx="78" cy="88" r="3.5"/><circle cx="105" cy="98" r="3.5"/>
<circle cx="195" cy="52" r="3.5"/><circle cx="220" cy="45" r="3.5"/><circle cx="248" cy="60" r="3.5"/><circle cx="205" cy="85" r="3.5"/><circle cx="238" cy="98" r="3.5"/>
<circle cx="325" cy="55" r="3.5"/><circle cx="350" cy="48" r="3.5"/><circle cx="378" cy="62" r="3.5"/><circle cx="335" cy="88" r="3.5"/><circle cx="368" cy="98" r="3.5"/>
</g>
<g style="fill:var(--mn-coral);">
<circle cx="100" cy="245" r="7"/><circle cx="230" cy="245" r="7"/><circle cx="360" cy="245" r="7"/>
</g>
<text x="222" y="165" style="fill:var(--mn-text-muted); font-size:15px; font-family:inherit;">π</text>
</svg>
<figcaption class="md">A fiber bundle: each meaning in $S$ (bottom) is covered by a fiber of many linguistic forms in $X$ (top). Paraphrase moves within a fiber; the projection $\pi$ forgets the "way of saying."</figcaption>
</figure>
</div>

<div class="ps-card" id="ps-fib-card">
	<div class="ps-card-title"><span class="dot"></span>The bundle in 3D: $X$ over $S$</div>
	<p class="ps-lead">The floor is the semantic base space $S$. Over each point $s \in S$ stands a <em>fiber</em> (a vertical column) holding every linguistic realisation of that meaning. Drag to rotate, scroll to zoom, and use the buttons to isolate a single fiber.</p>
	<div class="ps-row">
		<button class="ps-btn ghost" id="ps-fib-chase">Fiber over &ldquo;X chases Y&rdquo;</button>
		<button class="ps-btn ghost" id="ps-fib-sleep">Fiber over &ldquo;X sleeps&rdquo;</button>
		<button class="ps-btn ghost" id="ps-fib-all">All fibers</button>
	</div>
	<div id="ps-fib-3d" class="ps-3d"></div>
	<div class="ps-readout" id="ps-fib-readout">Drag to rotate. Each vertical column is the set of all sentences that express the same meaning.</div>
	<p class="ps-lead">Paraphrase is a *path within a fiber*: moving from one realisation to another while staying over the same meaning. In the language of homotopy type theory, a path in the base *transports* a point of one fiber to another — the "way of saying" can depend on the path by which you arrive.</p>
</div>

<div class="md">
## The three spaces as a commutative diagram

We can now state the central structural claim of the theory as a *commutativity* condition. The three spaces $X$, $S$, and $W$, together with the interpretation map $\pi: X \to S$ and the satisfaction relation between $S$ and $W$, should be organized so that the different routes from a form to a world *agree*.

Concretely, suppose a linguistic transformation $f: X \to X'$ takes a form $x$ to a form $x'$, and a semantic transformation $g: S \to S'$ takes its meaning $s$ to a meaning $s'$. For interpretation to be coherent, the diagram below — with every symbol labeled — must **commute**:
$$
\begin{array}{ccc}
\underbrace{X}_{\text{forms}}
& \xrightarrow{\;\underbrace{f}_{\text{linguistic}}\;}
& \underbrace{X'}_{\text{forms}'} \\[14pt]
\underbrace{\pi}_{\text{interpret}}\!\downarrow
& &
\downarrow\!\underbrace{\pi'}_{\text{interpret}} \\[14pt]
\underbrace{S}_{\text{meanings}}
& \xrightarrow{\;\underbrace{g}_{\text{semantic}}\;}
& \underbrace{S'}_{\text{meanings}'}
\end{array}
$$
In words: the two routes from $X$ to $S'$ must give the same result,
$$
\underbrace{\pi' \circ f}_{\substack{\text{transform,}\\[-1pt]\text{then interpret}}}
\;=\;
\underbrace{g \circ \pi}_{\substack{\text{interpret,}\\[-1pt]\text{then transform}}}
$$
that is, *transforming the form and then interpreting* gives the same result as *interpreting and then transforming the meaning*.

<figure style="max-width:600px; margin:1.5em auto; text-align:center;">
<svg viewBox="0 0 460 320" class="no-smart" role="img" aria-label="A commutative square seen as two paths from X to S prime, with a shaded homotopy region between them" style="width:100%; height:auto; display:block; margin:0 auto;">
<rect x="1" y="1" width="458" height="318" rx="10" style="fill:var(--mn-bg-subtle); stroke:var(--mn-border);" stroke-width="1"/>
<polygon points="110,70 350,70 350,250 110,250" style="fill:var(--mn-accent); opacity:0.09;"/>
<line x1="110" y1="70" x2="350" y2="70" style="stroke:var(--mn-sky);" stroke-width="3"/>
<polygon points="340,64 340,76 352,70" style="fill:var(--mn-sky);"/>
<line x1="350" y1="70" x2="350" y2="250" style="stroke:var(--mn-sky);" stroke-width="3"/>
<polygon points="344,240 356,240 350,252" style="fill:var(--mn-sky);"/>
<line x1="110" y1="70" x2="110" y2="250" style="stroke:var(--mn-coral);" stroke-width="3"/>
<polygon points="104,240 116,240 110,252" style="fill:var(--mn-coral);"/>
<line x1="110" y1="250" x2="350" y2="250" style="stroke:var(--mn-coral);" stroke-width="3"/>
<polygon points="340,244 340,256 352,250" style="fill:var(--mn-coral);"/>
<g style="fill:var(--mn-text);">
<circle cx="110" cy="70" r="6"/><circle cx="350" cy="70" r="6"/><circle cx="110" cy="250" r="6"/>
</g>
<circle cx="350" cy="250" r="6" style="fill:var(--mn-emerald);"/>
<circle cx="350" cy="250" r="13" fill="none" style="stroke:var(--mn-emerald);" stroke-width="2"/>
<g style="fill:var(--mn-text); font-size:16px; font-family:inherit; font-weight:600;">
<text x="82" y="60">X</text><text x="360" y="60">X'</text><text x="82" y="272">S</text><text x="360" y="272">S'</text>
</g>
<g style="fill:var(--mn-text-muted); font-size:15px; font-family:inherit;">
<text x="222" y="59">f</text><text x="364" y="166">&#960;'</text><text x="76" y="166">&#960;</text><text x="222" y="274">g</text>
</g>
<text x="230" y="150" text-anchor="middle" style="fill:var(--mn-text-muted); font-size:13px; font-family:inherit;">the two paths</text>
<text x="230" y="172" text-anchor="middle" style="fill:var(--mn-emerald); font-size:13px; font-family:inherit; font-weight:600;">are homotopic</text>
</svg>
<figcaption class="md">The commutative square as two paths from $X$ to $S'$ (blue: transform then interpret; coral: interpret then transform), with the shaded region the homotopy that deforms one into the other.</figcaption>
</figure>

Seen through the lens of **homotopy type theory**, this is not a bare equation but a statement about *paths*. The two composites $\pi' \circ f$ and $g \circ \pi$ are two *paths* from $X$ to $S'$, and the commutativity condition says that these two paths are **homotopic** — equal up to a path. The shaded square is the witness: a two-dimensional region that continuously deforms one route into the other. In this view the agreement of the two meanings is not a mere point but a *space of reasons* — the collection of all the ways the two routes agree. Compositionality is the assertion that this space of homotopies is nonempty, and (in the strongest version) contractible.

Commutativity is the precise sense in which the map $\pi$ is a *structure-preserving* map — a morphism in the appropriate category. It is the condition that makes $\pi$ a genuine *interpretation* rather than an arbitrary assignment of meanings to forms. A map that did not commute would be one in which the meaning of a transformed form is not the transformation of the meaning — a fundamentally incoherent semantics.

This is, we believe, the cleanest mathematical statement of the requirement that **meaning be compositional**: the meaning of a whole should be determined by the meanings of its parts and the way they are combined. Compositionality is the commutativity of the interpretation map with respect to the operations of the language.
</div>

<div class="ps-card" id="ps-comm-card">
	<div class="ps-card-title"><span class="dot"></span>Walk the commutative square</div>
	<p class="ps-lead">Two routes from a sentence $x$ to a transformed meaning $S'$. Walk both and watch them land on the *same* point. That meeting is compositionality.</p>
	<div class="ps-row">
		<button class="ps-btn ghost" id="ps-comm-p1">Path 1: transform the form, then interpret ($\pi' \circ f$)</button>
		<button class="ps-btn ghost" id="ps-comm-p2">Path 2: interpret, then transform the meaning ($g \circ \pi$)</button>
		<button class="ps-btn ghost" id="ps-comm-reset">Reset</button>
	</div>
	<canvas id="ps-comm-canvas" class="ps-canvas" width="1000" height="420"></canvas>
	<div class="ps-readout" id="ps-comm-readout">Example: $x$ = &ldquo;The dog chases the cat.&rdquo;, $f$ = passivisation, $\pi$ = meaning extraction. Press the two paths to see they meet at the same meaning.</div>
	<p class="ps-lead">The green ring appears only when <em>both</em> paths have been taken: the two routes agree, $\pi' \circ f = g \circ \pi$. In the homotopy view, that agreement is itself a space — the homotopy witnessing it.</p>
</div>

<div class="md">
## Tarski and the world: where meaning meets fact

Tarski's semantic conception of truth begins with the sentence "Snow is white" and points out the difference between the *expression* and the *state of affairs* it expresses. In the geometric view, that difference becomes a map.

The linguistic expression "Snow is white" lives in the linguistic space $X$. Its meaning — the proposition that snow is white — lives in the semantic space $S$. And the *fact* that makes it true (the state of affairs that snow is white) lives in the world space $W$. The chain is:

$$
\underbrace{\text{linguistic expression}}_{\in X}
\;\to\;
\underbrace{\text{proposition}}_{\in S}
\;\to\;
\underbrace{\text{world condition (truth condition)}}_{\in W},
$$

and the final step is a *truth*: the world condition is satisfied in some world $w \in W$.

In model-theoretic terms, the interpretation assigns to each sentence $s$ the set of worlds in which it is true:

$$
\llbracket s \rrbracket \;=\; \{\, w \in W \mid s \text{ is true in } w \,\}.
$$

Meaning is, in Tarski's sense, *about the world*: it is the set of possible worlds in which the sentence holds. Two sentences with the same truth conditions have the same meaning. This is exactly the fiber-bundle picture: all the linguistic forms that are true in precisely the same set of worlds lie in the same fiber over $S$.

The three-space picture ($X \to S \leftrightarrow W$) thus has a sharp, testable reading: the semantic space $S$ is not a free-floating abstract object, but is *tethered to the world* by the truth-conditions of its points. And the commutativity of the diagram guarantees that this tethering is independent of which linguistic form you use to get there.
</div>

<div class="ps-card" id="ps-tars-card">
	<div class="ps-card-title"><span class="dot"></span>The Tarskian chain, live</div>
	<p class="ps-lead">A fixed set of sentences, a slider that changes the world. The interpretation $\llbracket s \rrbracket$ — the set of worlds in which $s$ is true — is what we mean by the sentence's meaning. Change the world and the truth values of the *same* sentences change.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>World <b id="ps-tars-wL"></b></label><input type="range" id="ps-tars-w" min="0" max="4" step="1" value="0"></div>
	</div>
	<div id="ps-tars-plot" class="ps-plot"></div>
	<p class="ps-lead">Meaning as a function from language to worlds: the blue bars are the sentences true in the current world, the grey ones the sentences false there. The same sentence, different world, different truth — that is what it is for meaning to be *about* the world.</p>
</div>

<div class="md">
## Topological invariants and the "shape" of meaning

If the shape of $X$ is the object of study, then the right tools are *topological invariants*: quantities that capture the shape of a space without depending on a particular embedding or coordinate system.

The most important of these, for our purposes, are:

1. **Connected components.** The zeroth-level structure: how many separate "islands" of language are there, and how are they connected? A language with many disconnected components is one in which some regions of meaning are simply unreachable from others.

2. **Holes (higher homotopy / homology groups).** The presence of non-trivial loops and voids in $X$. A "hole" in the language space is a region that is surrounded by language but not itself filled — a *systematic gap*. The topology of the holes is a measure of the *complexity* of the space: how many independent ways can one go "around" a void?

3. **Persistent homology.** Because $X$ is multi-scale, the right invariant is not a single set of homology groups but a *family* of them, indexed by scale. Persistent homology tracks which topological features (components, loops, voids) appear at one scale and persist or disappear at another. This is exactly the tool needed to study a scale-free, self-similar space, and it is already a mature method in topological data analysis.

The claim of this section is that the **topological invariants of $X$ are the "shape of meaning"**. Two language spaces with the same topological invariants have the same *shape*, even if their metrics, measures, and embeddings differ. Meaning, in this view, is *topological*: it is a property of the shape of the space, invariant under continuous deformation.

This is a strong and checkable claim. It says that the meaningful content of a language is not in the particular words or the particular frequencies, but in the *persistent shape* of the space of possible utterances. It is the claim that two very different languages (or two very different models of the same language) that have the same persistent homology are, in the deep structural sense, *the same language*.

### How one measures the shape: the Vietoris–Rips filtration

Concretely, suppose a discourse is represented by points $P_T = \{x_1,\dots,x_k\}$ in a high-dimensional representation space. Temporarily ignoring order, one builds the **Vietoris–Rips filtration** $VR(P_T,\epsilon)$: two points are joined by an edge whenever their distance is at most $\epsilon$, and a triangle is filled in whenever all three of its edges are present. As $\epsilon$ grows from zero, points connect, components merge, loops appear, and holes fill in. Persistent homology records, for each topological feature, the $\epsilon$ at which it is *born* and the $\epsilon$ at which it *dies*.

The result is not automatically a two-dimensional surface — it is a simplicial complex with potentially high-dimensional topology. The multiscale "shape signature" of the discourse is the family

$$
\Phi(T) \;=\; \bigl(\beta_0(\epsilon),\ \beta_1(\epsilon),\ \beta_2(\epsilon),\ \dots\bigr)_{\epsilon},
$$

the Betti numbers at every scale. Two configurations can then be compared by a distance between their persistence structures,

$$
d_{\mathrm{topo}}(T_1,T_2) \;=\; d\bigl(\Phi(T_1),\ \Phi(T_2)\bigr),
$$

and the empirical question becomes: *do semantically related structures have systematically related topological signatures?*

### Topology is a measurement tool, not the theory

It is worth stressing what persistent homology is — and is not. It is a possible **measurement tool**, not the theory itself. The deeper hypothesis is that meaningful language possesses *stable multiscale relational organisation*. Several complementary perspectives probe the same space from different angles:

- **Topology** asks: *which structures survive a change of scale?*
- **Fractal analysis** asks: *how does structural complexity scale?*
- **Geometry** asks: *how are structures separated and clustered?*
- **Network analysis** asks: *which structures connect to which others?*
- **Information geometry** asks: *how are probability distributions and uncertainties organised?*

None of these is the whole story; together they are the instrument panel of the geometric view.
</div>

<div class="ps-card" id="ps-ph-card">
	<div class="ps-card-title"><span class="dot"></span>Vietoris–Rips filtration, live</div>
	<p class="ps-lead">The left canvas shows the point cloud at the current $\epsilon$ (edges where distance $\le \epsilon$, triangles where all three edges are present). The right canvas is the <em>barcode</em>: each bar is a topological feature, born at one $\epsilon$ and dying at another. Long bars = real structure, short bars = noise.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>Scale parameter &epsilon; <b id="ps-ph-eL">0.050</b></label><input type="range" id="ps-ph-e" min="0" max="0.5" step="0.005" value="0.05"></div>
		<div class="ps-control"><label>Point configuration</label>
			<select id="ps-ph-conf" class="ps-select">
				<option value="two">Two clusters</option>
				<option value="ring">Ring (loop &rarr; H1)</option>
				<option value="three">Three clusters + bridge</option>
				<option value="hier">Hierarchy: clusters of clusters</option>
			</select>
		</div>
	</div>
	<div class="ps-grid2">
		<canvas id="ps-ph-pts" class="ps-canvas" width="500" height="500"></canvas>
		<canvas id="ps-ph-bar" class="ps-canvas" width="500" height="500"></canvas>
	</div>
	<div class="ps-readout" id="ps-ph-readout"></div>
	<p class="ps-lead">Persistent features (long bars) are the stable, scale-spanning structure. Translated: <em>which semantic relations survive a change of zoom?</em> Those are the candidates for "real" meaning.</p>
</div>

<div class="md">
## Learning as the construction of $\pi$

We can now give a geometric account of **language learning**. To learn a language is to construct, from experience, an approximation to the interpretation map $\pi: X \to S$.

The learner is presented with pairs $(x, s)$ — forms and their meanings (or, more realistically, forms and situations in $W$ that the form is used in) — and must infer the map $\pi$ that sends forms to meanings. This is a *function-learning* problem, but with a crucial geometric structure: the map $\pi$ is not arbitrary. It is constrained by the geometry of $X$ (the learner can only learn from the regions of $X$ that are actually encountered) and by the commutativity condition (the map must preserve structure).

The geometric view explains several well-known facts about learning:

- **The poverty of the stimulus** is a *coverage* problem: the learner only sees a small, biased sample of $X$, concentrated in the high-frequency clusters. Learning requires *generalizing* from the clusters to the filaments and the (unseen) structure of the tail.
- **Productivity in acquisition** — the child's ability to produce and understand novel sentences — is the emergence of *filaments*: the learner has inferred the connective structure that links clusters, not merely memorized the clusters themselves.
- **The "critical period"** may be a *topological* phenomenon: early in development, the geometry of $X$ is still being laid down, and the topology is plastic; later, the topology becomes fixed, and only local (metric) adjustments are possible.

The geometry also predicts *how* generalization works, and here the theory meets a classic result from cognition. Shepard proposed a **universal law of generalization**: the probability that a response learned to one stimulus transfers to another is an exponentially decreasing function of the distance between the two stimuli in a *psychological space* \cite{shepard1987universal}.

$$
P(x \to x') \;=\; A\, e^{-\,b\, d(x, x')},
$$

where $d(x,x')$ is the distance in the representational space. The bold claim is that this form is *universal* — across species, tasks, and modalities — because it is the form any internalized, distance-based decision rule must take. In the language of this chapter, the law says **generalization is local in $X$**: the closer an unseen form is to a known one, the more reliably its meaning transfers, and the more distant it is, the less. Shepard's exponential kernel is precisely what turns the metric of $X$ into a *learning* signal — and one of the clearest pieces of evidence that the right language for meaning is the language of spaces and distances.

The upshot is that learning is not the accumulation of facts but the *construction of a map between spaces*, under geometric constraints. This reframes the central problem of language acquisition as a problem in *topological inference*: inferring the shape of a space and the structure of a map from partial, noisy observations.

## Open problems and a research programme

This chapter has laid out a scaffold. The open problems are the places where the scaffold needs to be turned into a building. We close with the most important of them.

**Problem 1 (Existence and construction of $X$).** We have described $X$ as the space of all potential linguistic configurations, but we have not *constructed* it. What is the precise topological space? A metric space, a simplicial complex, a topos? The answer will determine which invariants are available.

**Problem 2 (The interpretation map $\pi$).** We have treated $\pi$ as a given. But $\pi$ is not observed directly; it is inferred. What are the precise constraints that determine $\pi$? Is it a morphism in a specific category? The commutativity condition is a start, but it is not a full specification.

**Problem 3 (The heavy tail and meaning).** We have claimed that meaning lives in the heavy tail. This needs to be made precise and tested. What is the measurable signature of "meaning in the tail"? Can it be detected in persistent homology, in the geometry of the tail, or in the behavior of $\pi$ on low-frequency forms?

**Problem 4 (Self-similarity and scale).** The claim that $X$ is approximately self-similar needs a precise formulation. Is there a genuine scaling symmetry, or only statistical scale-invariance? What are the exponents, and do they vary across languages?

**Problem 5 (The three spaces and truth).** The space $W$ of worlds, and the satisfaction relation $S \models W$, are the least developed parts of the picture. How does the geometry of $W$ interact with the geometry of $S$? This is where the theory must connect to formal semantics and to the philosophy of truth.

These five problems are not independent. They form a programme: construct the spaces, specify the maps, identify the invariants, test the heavy-tail claim, and connect the geometry to truth. A theory of meaningful language spaces is complete when it can answer all five.

The aim of this chapter has not been to answer these questions, but to make them *visible*. The hope is that the geometric and topological language gives a shared vocabulary in which the right questions can be asked, and in which progress can be measured.
</div>

<div class="md">
## The research programme: four levels

The five problems are best read as a four-level programme, each level providing the infrastructure for the next:

- **Level 1 — Formal foundations.** Construct the space $X$ and the semantic space $S$; define the interpretation map $\pi$ and the satisfaction relation $S \models W$; and fix the class of structure-preserving maps. *Deliverables:* a precise definition of the three spaces; a specification of $\pi$; a proof that the diagram commutes.
- **Level 2 — Topological and geometric invariants.** Identify the invariants (connected components, holes, persistent homology, fractal dimension, clustering statistics) that should be preserved by $\pi$ and by the structure-preserving maps. *Deliverables:* a catalogue of invariants; a proof that they are well-defined on $X$ and $S$; a comparison of the invariant signatures of two related structures.
- **Level 3 — Empirical testing.** Represent real linguistic data as points in $X$, compute the invariants, and test the predictions. *Deliverables:* a benchmark of invariant signatures across corpora and languages; a demonstration that semantically related structures have closer invariant signatures; a demonstration that the heavy tail carries persistent structure.
- **Level 4 — Integration and unification.** Show that the invariants of $X$, $S$, and $W$ fit together into a single coherent picture, and that the theory *explains* — not merely describes — compositionality, ambiguity, metaphor, and learning. *Deliverables:* a unified account; a set of novel, testable predictions; a bridge to formal semantics and to the cognitive science of meaning.

The levels are cumulative. Nothing at Level 3 is meaningful without the invariants of Level 2, and nothing at Level 2 without the spaces of Level 1. The programme is complete when Level 4 produces a unified, predictive, and testable account of meaning.
</div>

<div class="md">
## What would count as evidence

A research programme must be *falsifiable*, and the geometric view makes that explicit. The most important empirical predictions, in increasing order of ambition, are:

1. **Persistent topology.** The persistent-homology signature of a meaningful corpus is stable across paraphrase, translation, and register change, while the detailed metric is not.
2. **Topological similarity.** Semantically related structures (same meaning, different form) have topologically similar signatures; unrelated structures do not.
3. **Heavy-tail structure.** The low-frequency tail carries *persistent* topological structure (not merely noise), systematically related to the high-frequency core.
4. **Compositional commutativity.** The interpretation map approximately commutes with composition — the meaning of a composition is close to the composition of the meanings — and the failure to commute is small and structured.
5. **Scale-free invariants.** The topological and clustering invariants are approximately scale-free, with exponents that are stable across languages (universality) rather than language-specific.
6. **Metaphor as structure.** Productive metaphors map a *structured* source region onto a *structured* target region and preserve the relevant invariants; dead metaphors and random word-pairings do not.
7. **Learning as topological inference.** Language learning is best described as the progressive construction of the topology of $X$ — clusters first, then filaments, then the large-scale shape.
8. **Universality classes.** Distantly related or unrelated languages that share a domain of meaning fall into the same universality class: the same large-scale invariants, different micro-structure.
9. **The world-anchor.** The satisfaction relation $S \models W$ is itself structured: worlds that are close in a natural geometry satisfy similar sets of semantic structures, and this geometry is detectable.

Each of these is, in principle, checkable with existing methods — persistent homology, clustering, scaling analysis. None has yet been checked in this way. That is the work the programme describes.
</div>

<div class="md">
## A methodological caution

To remain honest, the framework must confront its own methodological risks:

- **The risk of emptiness.** A theory stated in the language of "spaces" and "maps" can always be made true by choosing the right spaces and the right maps. The defence is the research programme: the spaces must be *constructed*, the maps *specified*, and the invariants *computed on real data*. A framework that cannot produce a number is a metaphor, not a theory.
- **The risk of circularity.** Defining meaning by reference to meaning (via $\pi$) risks circularity. The defence is the world-anchor: the satisfaction relation $S \models W$ ties meaning to the world independently of the linguistic map, and the geometry of $W$ must be specified by something other than $\pi$.
- **The risk of the map being the territory.** The spaces $X$ and $S$ are *models* of language, not language itself. Their worth is measured by the accuracy and scope of their predictions, not by their aesthetic appeal. The cosmic-web analogy is a *structural* claim, not an identity claim.
- **The burden of precision.** Every claim in this chapter is currently at the level of a conjecture with an illustration, not a theorem with a proof. The value of the chapter is that it makes the conjectures *precise enough to be checked*; its failure mode is to remain forever at the level of illustration. The four-level programme is the answer to that failure mode.
</div>

<div class="md">
## The central picture

Put together, the pieces give a single picture. There is a space $X$ of all possible linguistic configurations, a space $S$ of semantic structures, and a space $W$ of worlds. A map $\pi: X \to S$ (interpretation) and a relation $S \models W$ (truth) connect them in a diagram that commutes. The space $X$ is a structured landscape — clusters of common forms, filaments of compositionality, voids of systematic gaps — that is approximately scale-free. Meaning is the *structure* of this landscape and of the map $\pi$, not a list of labels attached to points. Learning is the construction of $\pi$; metaphor is a path between distant clusters; and the deep content of a language is the *persistent shape* of its space.

That is the central claim of this chapter, stated as plainly as it can be: **meaning is the geometry and topology of the space of possible utterances, and understanding is the knowledge of that shape.**
</div>

<div class="ps-card" id="ps-final-card">
	<div class="ps-card-title"><span class="dot"></span>The whole picture, in four windows</div>
	<p class="ps-lead">One control — a slider from *semantic structure* to *pure noise* — drives all four views at once. Watch what survives as the structure is dissolved: the point-cloud, the coherence profile, the topological signature, and the scale-invariance all degrade together.</p>
	<div class="ps-controls">
		<div class="ps-control"><label>Structure &rarr; noise <b id="ps-final-tL">0.0</b></label><input type="range" id="ps-final-t" min="0" max="1" step="0.05" value="0"></div>
		<div class="ps-row">
			<button class="ps-btn ghost" id="ps-final-sem">Semantic</button>
			<button class="ps-btn ghost" id="ps-final-prag">Pragmatic</button>
			<button class="ps-btn ghost" id="ps-final-noise">Noise</button>
		</div>
	</div>
	<div class="ps-grid2">
		<canvas id="ps-final-pts" class="ps-canvas" width="500" height="420"></canvas>
		<canvas id="ps-final-radar" class="ps-canvas" width="500" height="420"></canvas>
		<canvas id="ps-final-topo" class="ps-canvas" width="500" height="420"></canvas>
		<canvas id="ps-final-scale" class="ps-canvas" width="500" height="420"></canvas>
	</div>
	<div class="ps-readout" id="ps-final-readout"></div>
	<p class="ps-lead">At the semantic end, all four windows show stable structure. At the noise end, all four collapse. The *simultaneity* of the collapse — geometry, coherence, topology, and scale-invariance degrading together — is the signature of a single underlying structured space.</p>
</div>

<div class="optional md" data-headline="Sources and further reading">
This chapter develops a geometric and topological view of meaningful language. The central ideas — meaning as structure, the three-space picture, and the landscape of clusters, filaments, and voids — draw on several traditions.

**Structural semantics and the relational nature of meaning.** The view that meaning is relational and that a sign's value comes from its differences within a system is classical. The model-theoretic treatment of meaning, truth, and satisfaction is due to Tarski, whose definition of truth for formal languages is the direct ancestor of the satisfaction relation $S \models W$ used here.

- \citeauthor{tarski1935wahrheitsbegriff}, \citealternativetitle{tarski1935wahrheitsbegriff} (\citeyear{tarski1935wahrheitsbegriff}).
- \citeauthor{hodges1993modeltheory}, \citealternativetitle{hodges1993modeltheory} (\citeyear{hodges1993modeltheory}) — a modern, accessible account of the model theory that underlies the $S$–$W$ relation.

**Metaphor and structural mapping.** The claim that metaphor works by mapping relational structure from a source domain to a target domain is the central result of the cognitive-linguistic programme on metaphor.

- \citeauthor{lakoff1993metaphor}, \citealternativetitle{lakoff1993metaphor} (\citeyear{lakoff1993metaphor}) — the standard statement of the conceptual-metaphor thesis.
- \citeauthor{gentner1983structuremapping}, \citealternativetitle{gentner1983structuremapping} (\citeyear{gentner1983structuremapping}) — the structure-mapping theory that motivates the "common structural skeleton" condition on fruitful metaphors.

**Topological data analysis and the shape of data.** The use of topological invariants — connected components, holes, and above all persistent homology — to extract the "shape" of a high-dimensional data set is the methodological core of the geometric view.

- \citeauthor{edelsbrunner2002persistent}, \citealternativetitle{edelsbrunner2002persistent} (\citeyear{edelsbrunner2002persistent}) — the founding paper on persistent homology.
- \citeauthor{carlsson2009tda}, \citealternativetitle{carlsson2009tda} (\citeyear{carlsson2009tda}) — the survey that introduced topological data analysis to a broad audience.

**Algebraic topology.** The background definitions of topological spaces, homotopy, homology, and fiber bundles used throughout the chapter are standard.

- \citeauthor{hatcher}, \citealternativetitle{hatcher} (\citeyear{hatcher}) — the standard reference for algebraic topology.
- \citeauthor{cohensteiner2007}, \citealternativetitle{cohensteiner2007} (\citeyear{cohensteiner2007}) — for the category-theoretic and homotopical viewpoint.
- \citeauthor{fiber_bundle_wiki}, \citealternativetitle{fiber_bundle_wiki} — a concise entry-level account of fiber bundles.

**The cosmic web as a model landscape.** The picture of a space organized into clusters, filaments, and voids is borrowed directly from the observed large-scale structure of the universe.

- \citeauthor{cosmic_web_image}, \citealternativetitle{cosmic_web_image} (\citeyear{cosmic_web_image}) — the cosmic-web visualization used as the model for the landscape of a language space.

**Scale-free structure and heavy tails in language.** The empirical facts about Zipf's law and heavy-tailed distributions in language are well documented.

- \citeauthor{zipf1949human}, \citealternativetitle{zipf1949human} (\citeyear{zipf1949human}) — the original statement of Zipf's law.
- \citeauthor{statisticsofextremes}, \citealternativetitle{statisticsofextremes} — on the statistics of heavy-tailed phenomena.

**Generalization and psychological space.** The claim that generalization falls off with distance in a representational space is the classic "universal law of generalization."

- \citeauthor{shepard1987universal}, \citealternativetitle{shepard1987universal} (\citeyear{shepard1987universal}) — the original statement: the probability of generalizing a response decays exponentially with distance in a psychological space.

The chapter is a synthesis of these traditions into a single geometric framework. It is a proposal, not a consensus; the open problems in the final section are where the framework meets its tests.
</div>

<div class="optional md" data-headline="A note on the cosmic-web analogy">
The analogy between the large-scale structure of the universe and the structure of a language space is sometimes dismissed as mere decoration. It is worth saying why it is not.

The cosmic web is not just *similar in appearance* to the landscape we have described; it is *the same mathematical object*. Both are high-dimensional spaces with a measure (mass density, or utterance frequency) that is concentrated in clusters, connected by filaments, and separated by voids. Both are believed to be approximately scale-free. And both are studied with the same tools: statistics of the density field, and increasingly, topological data analysis.

The difference is only in the *physics* that generates the structure: gravity and dark matter in the universe; grammar, convention, and use in language. The *geometry* is shared. That is what makes the analogy a genuine structural one, and what makes the cosmologist's toolkit — clustering statistics, filament detection, void analysis, persistent homology — directly transferable to the study of language.

The claim is not that language *is* a universe. It is that language, like the universe, is a *structured distribution in a high-dimensional space*, and that the mathematics of such distributions is the same in both cases.
</div>
