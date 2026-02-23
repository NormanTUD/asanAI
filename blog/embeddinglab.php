<?php include_once("functions.php"); ?>

<div class="smart-quote" data-cite="wittgenstein1953investigations">
  The meaning of a word is its use in the language.
</div>

<div class="md">
In the architecture of a Transformer, a word possesses no intrinsic "soul" or static dictionary definition. Instead, its identity is defined entirely by its context, its **use**. This philosophical principle is operationalized through a high-dimensional **Embedding Space**, where semantic concepts are mapped as coordinates in a continuous geometric manifold.

Even though in this example, we treat tokens as words, they can also be parts of words or single characters like a comma or a semicolon due to *Byte-Pair-Encodings*.

In the history of linguistics, the work of \citeauthor{firth1957distributive} (\citeyear{firth1957distributive}) provides the theoretical bedrock for modern word embeddings. Known as the Distributional Hypothesis, his famous maxim, "You shall know a word by the company it keeps" (p. 11), suggests that words occurring in similar contexts share similar meanings. This shift away from fixed dictionary definitions to context-based identity allowed later researchers like \citeauthor{mikolov2013word2vec} to mathematically map language into the vector spaces we see in modern LLMs today.



## One Dimension
To visualize this, consider a simple **1D Embedding Space** representing temperature. We assign words a single numerical coordinate on an axis:
* **Freezing**: $-30$
* **Cold**: $5$
* **Warm**: $35$
* **Boiling**: $100$

In this one-dimensional world, "Cold" is mathematically proximal to "Frosty" but distant from "Boiling".

This allows you to do calculations like $\underbrace{\text{Boiling}}_{100} - \underbrace{\text{Hot}}_{60} \approx \underbrace{\text{Warm}}_{40}$. Warm, by definition here, is 35, so it is only approximate, but it's the closest match and makes some sense.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-1d" style="height: 180px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div>
        <input type="text" id="input-1d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;" placeholder="e.g., Cold + Warm" onkeyup="if(event.key==='Enter') calcEvo('1d')">
        <div id="res-1d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #3b82f6; overflow-x: auto;">Match: -</div>
    </div>
    <div class="embedding-table-container" id="editor-1d" data-space="1d"></div>
</section>

<div class="md">
## Two dimensions

Human language is far too nuanced for a single axis. To capture independent features such as gender, power, or biological species, we project tokens into a **vector space** with multiple dimensions. In this space, each dimension represents a latent semantic feature discovered by the model during training.

Because these positions are derived from logical relationships in data, the space itself becomes "computable". We can perform algebraic operations on these vectors to navigate human concepts:

$$ \vec{v}_{\text{King}} - \vec{v}_{\text{Man}} + \vec{v}_{\text{Woman}} \approx \vec{v}_{\text{Queen}} $$

This specific property, that word vectors capture semantic relationships through linear offsets, was popularized by \citeauthor{mikolov2013word2vec} (\citeyear{mikolov2013word2vec}) during the development of Word2Vec.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-2d" style="height: 400px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div>
        <input type="text" id="input-2d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;" placeholder="e.g., Man + Power" onkeyup="if(event.key==='Enter') calcEvo('2d')">
        <div id="res-2d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #10b981; overflow-x: auto;">Match: -</div>
    </div>
    <div class="embedding-table-container" id="editor-2d" data-space="2d"></div>
</section>

<div class="md">
## Three Dimensions: The Limits of Visualization

While **3 dimensions** are the maximum we can easily visualize in a graph, modern LLMs operate in much higher dimensionality, often 768, 1,536, or more. Each added dimension allows the model to capture more granular distinctions between concepts that might appear identical in lower-dimensional projections.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-3d" style="height: 500px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div>
        <input type="text" id="input-3d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;" placeholder="e.g., King + Animal" onkeyup="if(event.key==='Enter') calcEvo('3d')">
        <div id="res-3d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #6366f1; overflow-x: auto;">Match: -</div>
    </div>
    <div class="embedding-table-container" id="editor-3d" data-space="3d"></div>
</section>

<div class="md">
## Quantifying Semantic Proximity
In a vector space, "meaning" is a function of distance. If two words appear in similar linguistic environments, their vectors converge toward the same neighborhood.

### Euclidean Distance
To determine the degree of similarity between two vectors $\mathbf{A}$ and $\mathbf{B}$ in $n$-dimensional space, we can calculate the straight-line gap known as **Euclidean Distance**:

$$ d(\mathbf{A}, \mathbf{B}) = \sqrt{\sum_{i=1}^{n} (B_i - A_i)^2} $$

### The Semantic Manifold: Cosine Similarity
</div>

<div class="smart-quote" data-cite="heraclitus500fragments">
War (as in 'the tension between opposites') is the father of all things.
</div>

<div class="md">
While Euclidean distance measures the physical gap between points, modern LLMs often rely on **Cosine Similarity**. This measures the cosine of the angle $\theta$ between two vectors, determining their directional alignment regardless of their magnitude. A similarity of 1 means the vectors point in the same direction.

$$ \text{similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} $$

In a 1,536-dimensional model, "meaning" isn't a static definition; it's a **positional relationship**. Imagine a direction in space that represents "Royalty." Moving a vector in that direction transforms "Man" into "King.".


The **red arc** below visualizes the **Cosine Distance**, the "conceptual shift" between two points. The **dashed line** is the **Euclidean Distance**, or the "energy" required to move from one token to another. In the geometry of meaning, words that appear in similar contexts are pulled together by gravity, forming clusters that represent human knowledge.
</div>

<section style="width: 100%; padding: 20px; margin-bottom: 40px; box-sizing: border-box;">
    <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; width: 100%;">
        <div id="plot-comparison-3d" style="height: 500px; background: #fff; border-radius: 8px; width: 100%;"></div>
        
        <div id="comparison-stats-3d" style="width: 100%;"></div>
    </div>
</section>

<div class="md">
### Similiarity
To find the dot product of two vectors, you multiply the numbers in the same positions and then add all those results together. In general, the equation is:

$$ \underbrace{\vec{A} \cdot \vec{B}}_{\substack{n \text{ entries} \\ \text{each}}} = \sum_{i=1}^{n} a_i b_i $$

If we have two vectors $\vec{A}$ and $\vec{B}$:
$$\vec{A} = \begin{pmatrix} a_1 \\ a_2 \end{pmatrix}, \vec{B} = \begin{pmatrix} b_1 \\ b_2 \end{pmatrix}$$

The Dot Product $\vec{A} \cdot \vec{B}$ is:
$$\vec{A} \cdot \vec{B} = (a_1 \times b_1) + (a_2 \times b_2)$$

The Dot Product has a beautiful geometric property:
* **High Positive Number:** The arrows point in roughly the same direction (They are "Similar").
* **Zero:** The arrows are at a right angle (They are "Unrelated").
* **Negative Number:** The arrows point in opposite directions (They are "Opposites").

In a Transformer (like ChatGPT), this is the "Handshake." When a word "looks" at another word, it calculates the Dot Product. If the result is high, the AI knows those words are contextually related. This will be explained in more detail later on.
</div>

<div class="lab-container">
    <div id="dot-product-plot" style="width:100%; max-width:500px; height:400px; margin: 0 auto;"></div>
    <div class="controls" style="text-align: center; padding: 20px;">
        <label>Vector A: <input type="range" id="angle-a" min="0" max="360" value="45"> <span id="val-a">45</span>°</label><br>
        <label>Vector B: <input type="range" id="angle-b" min="0" max="360" value="90"> <span id="val-b">90</span>°</label>
    </div>
    <div id="dot-product-result" style="font-family: monospace; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 10px;">
        </div>
</div>

<div class="md">
### Scale Invariance: Direction Is Meaning, Magnitude Is Noise

There's a subtle but critical property that explains *why* cosine similarity is preferred over Euclidean distance in most embedding applications: **scale invariance**. Two vectors can point in exactly the same direction, encoding the same semantic content, but differ wildly in magnitude. Euclidean distance would call them "far apart." Cosine similarity correctly identifies them as identical in meaning.

Why does magnitude vary? During training, tokens that appear more frequently accumulate more gradient updates, inflating their vector norms. A rare synonym of "King" might encode the same directional relationships but have a much shorter vector. Cosine similarity is blind to this artifact; Euclidean distance is fooled by it.

Below, drag the **magnitude slider** to stretch or shrink a token's vector without changing its direction. Watch how Euclidean distance changes dramatically while cosine similarity stays perfectly constant.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-scale-invariance" style="height: 420px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 10px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Magnitude of Token B:</b>
            <input type="range" id="scale-magnitude" min="0.3" max="3.0" step="0.05" value="1.0" style="width: 200px; vertical-align: middle;">
            <span id="scale-mag-val" style="font-weight: bold; color: #3b82f6;">1.0×</span>
        </label>
    </div>
    <div id="scale-invariance-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-width: 500px; margin: 0 auto;"></div>
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>Key insight:</b> As you drag the slider, Token B (the diamond) moves along its direction ray, getting closer or farther from the origin. The <span style="color:#ef4444; font-weight:bold;">Euclidean distance</span> (dashed line) changes dramatically. But the <span style="color:#10b981; font-weight:bold;">cosine similarity</span> (the angle between the vectors) stays <i>perfectly constant</i>. This is why cosine similarity is the standard metric in embedding spaces: it measures <b>what</b> a token means, not <b>how often</b> it was seen during training.
    </div>
</section>

<div class="md">
## The Illusion of Interpretability
</div>

<div class="smart-quote" data-cite="processandreality" data-page=471>
Mathematical physics translates the saying of Heraclitus, 'All things flow,' into its own language. It then becomes, All things are vectors.
</div>

<div class="md">
It is tempting to label specific axes as "Gender," "Power," or "Temperature," but this is often a human-imposed simplification. In modern LLMs, dimensions are **latent features**, mathematical patterns discovered through statistical co-occurrence rather than human-defined categories.

While we can find "directions" in the vector space that correlate with human concepts, most of the 768+ dimensions do not have a name in any human language.
* **Meaning is Simulated:** The computer does not "understand" what a King is; it only understands that the token "King" consistently appears in specific geometric relationships with other tokens.
* **No Inherent Soul:** The coordinates are products of linear algebra, not internal experience. Meaning is a human concept we project onto the model's output; the machine is simply navigating a continuous geometric manifold.

## The Outliers of Geometry: Hapax Legomena and Glitch Tokens

While the semantic manifold relies on "use" to define meaning, the system falters when a word lacks a statistical history. [**Hapax legomena**](https://en.wikipedia.org/wiki/Hapax_legomenon), terms that appear only once in an entire corpus, present a unique challenge for embedding spaces. Because a token's identity is defined entirely by its context, a single occurrence provides insufficient data points to anchor it. In a high-dimensional space, these words become "homeless"; the model cannot triangulate their coordinates through repeated relationships. Without the "gravity" of multiple linguistic environments to pull them into a meaningful neighborhood, their vectors often reside in noisy, semi-random locations, rendering them mathematically isolated from the manifold of human knowledge.

Even more disruptive are **Glitch Tokens** (described by Yuxi Li et al. in \citeyear{glitchtokens}), which reveal the cracks in the machine's geometric logic. These often arise from anomalies like the Reddit username `SolidGoldMagikarp`, a bot that appeared in thousands of entries within a specific counting thread. Because these strings appeared frequently enough to be assigned a dedicated token but lacked varied, human-semantic context, they do not possess a stable "positional relationship" in the space. When an LLM encounters these tokens, it often suffers a "hallucination of meaning" or total logic failure. In the geometry of meaning, these tokens act like "voids" or "gravity wells", they are products of statistical co-occurrence that do not correlate with any human concept.

## Rotational Invariance and Translation as Path-Finding

A critical property of embedding spaces is their **rotational invariance**. If you take an entire embedding space and rotate it, spinning every single vector by the same angle, nothing changes semantically. "King" is still near "Queen," "Cat" is still far from "Democracy." This is because meaning in these spaces is not encoded in absolute coordinates, but in the **relational geometry** between points: their distances, angles, and cluster structures (\cite{smith2017orthogonal}).

This has a profound implication for **cross-lingual translation**. When a Transformer is trained on two languages, each language develops its own embedding space. Remarkably, these spaces tend to be **isomorphic**, they share the same internal geometric structure, just rotated and scaled relative to each other (\cite{mikolov2013exploiting}). The word for "king" in French and the word for "king" in English occupy analogous positions within their respective manifolds. Aligning two such spaces often requires nothing more than a linear transformation, a rotation matrix and a scaling factor, because the underlying topology of human concepts is, to a significant degree, language-invariant (\cite{conneau2018word}).

A **translation Transformer**, then, can be understood as a system that performs a kind of geometric **path-finding**. Given a sequence of tokens in the source language, the encoder maps them into a trajectory through embedding space, a path that weaves through clusters of meaning. The decoder's task is not to look up word-for-word equivalents, but to find a **corresponding path** through the target language's embedding space that preserves the same relational structure: the same turns, the same cluster transitions, the same semantic "shape."

In other words, the Transformer doesn't translate *words*. It translates **paths through meaning-space**. It identifies the geometric signature of the input, which clusters were visited, in what order, with what transitions, and reconstructs an analogous trajectory in the output space. This is why translations can be fluent even when there is no one-to-one word correspondence between languages: the model is matching *shapes*, not *points*.

This is also why the Attention mechanism is so central. Attention computes pairwise relationships (via dot products) between all tokens in a sequence, effectively building a map of the local geometry, which points are near each other, which are aligned, which are orthogonal (\cite{vaswani2017attention}). This relational map is what gets preserved and transferred, not any individual coordinate (\cite{elhage2021mathematical}).

</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-crosslingual-align" style="height: 500px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <button id="btn-align" onclick="animateCrossLingualAlignment()" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">▶ Align Languages</button>
        <button id="btn-reset-align" onclick="resetCrossLingualAlignment()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">↺ Reset</button>
        <span id="align-status" style="font-size: 0.85em; color: #64748b; font-family: sans-serif;">Ready, Japanese is rotated 55° from English.</span>
    </div>
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> English (●&nbsp;circles) and Japanese (◆&nbsp;diamonds) encode the same concepts in different orientations. 
        The <span style="color:#3b82f6; font-weight:bold;">blue arrows</span> show the <code>Man → King → Queen</code> path in English; 
        the <span style="color:#10b981; font-weight:bold;">green arrows</span> show the same path in Japanese. 
        When you click <b>Align</b>, Japanese is smoothly rotated to match English, the diamonds slide into position next to their circle counterparts. 
        The internal geometry (all distances and angles between words) is <i>perfectly preserved</i>.
    </div>
</section>

<div class="md">
The real magic is in the **transformation itself**. Below, you can watch Japanese's embedding space smoothly rotate and scale to align with English. This is exactly what algorithms like Procrustes alignment do: they find the optimal rotation matrix $\mathbf{W}$ such that $\mathbf{X}_B \mathbf{W} \approx \mathbf{X}_A$, minimizing the distance between corresponding word pairs across languages (\cite{smith2017orthogonal}, \cite{conneau2018word}).

Click **"Align"** to animate the transformation. Notice how the internal structure, the distances between King/Queen, Man/Woman, is perfectly preserved. Only the orientation changes. This is rotational invariance made visible.
</div>

<div class="md">
### The Limits of Isomorphism

While the cross-lingual alignment story is compelling, the isomorphism between language embedding spaces is not perfect. The alignment quality degrades significantly for typologically distant language pairs, English to Japanese, for instance, is far harder to align than English to Spanish (\cite{sogaard2018limitations}). This suggests that the "universal geometric structure of human concepts" has real limits. Languages don't just rotate the same space; they can **warp** it. Cultures that carve up semantic space differently, languages with different color term boundaries, or kinship systems, produce embedding geometries that are locally similar but globally distorted. The rotation-plus-scaling model is a first-order approximation, not the full story.

## The Manifold Hypothesis

The deeper theoretical reason the path-finding framing works is the **Manifold Hypothesis**: the idea that high-dimensional data, like language, actually lies on or near a much lower-dimensional manifold embedded in the high-dimensional space (\cite{bengio2013representation}). If sentences trace paths on a manifold, then translation is literally a mapping between two manifolds that share the same topology. The Transformer's attention layers can be seen as learning the **local coordinate charts** of these manifolds, the rules for how to navigate the surface at each point.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-manifold" style="height: 550px; background: #fff; border-radius: 8px; width: 100%;"></div>
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6;">
        <b>The Manifold Hypothesis visualized.</b> The translucent blue surface is the <b>semantic manifold</b>, a lower-dimensional curved sheet embedded in the full 3D space. All meaningful word vectors (colored dots) live <i>on</i> this surface, not scattered through the volume. The grey dots represent the unused ambient dimensions, noise with no semantic content. The <span style="color:#3b82f6; font-weight:bold;">blue path</span> is a <b>geodesic</b>: the shortest route <i>along the surface</i> from Man → Prince → King → Queen, following the curvature of meaning. The <span style="color:#ef4444; font-weight:bold;">red dashed line</span> is the Euclidean shortcut, a straight line that cuts through empty, meaningless space. A Transformer's residual stream follows the geodesic, not the shortcut.
    </div>
</section>

<div class="md">
## Attention as Metric Tensor

There is an even more geometric way to think about attention. In differential geometry, a **metric tensor** defines how distances are measured locally on a manifold, it tells you the "shape" of space at each point. The attention matrix in a Transformer does something analogous: it dynamically redefines which tokens are "close" to which other tokens at each layer, effectively warping the local geometry of the embedding space as the representation is processed. This is not merely a metaphor, the connections between attention mechanisms and geometric structures on manifolds have been formalized in the framework of Geometric Deep Learning (\cite{bronstein2021geometric}).

### Interactive: Attention Warps the Geometry of Meaning

Below is a 2D grid representing the local geometry of embedding space. Each colored dot is a token. **Click on any token** to "attend" to it, watch how the grid warps, pulling semantically related tokens closer and pushing unrelated ones further away. This is what the attention mechanism does at every layer: it dynamically redefines which tokens are "near" each other, bending the metric of the space itself.

The grid lines show the distortion, like a rubber sheet being pinched. In differential geometry, this is exactly what a **metric tensor** does: it tells you how to measure distances locally, and attention changes that measurement at every step.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-metric-tensor" style="height: 550px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px; cursor: pointer;"></div>
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <button onclick="resetMetricTensor()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">↺ Reset Grid</button>
        <span id="metric-status" style="font-size: 0.85em; color: #64748b; font-family: sans-serif;">Click any token to apply attention.</span>
    </div>
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>How to read this:</b> The grid represents the "fabric" of embedding space. In the unwarped state, all tokens are equally spaced, the metric is flat (Euclidean). When you click a token, attention <i>warps</i> the metric: related tokens are pulled closer (the grid compresses between them), and unrelated tokens are pushed away (the grid stretches). The <span style="color:#8b5cf6; font-weight:bold;">purple halo</span> shows the attention "field", stronger near the attended token, fading with semantic distance.
    </div>
</section>


<div class="md">
## The Residual Stream as Geodesic

Building on the mechanistic analysis of Transformer circuits (\cite{elhage2021mathematical}), there is an elegant way to think about the **residual stream**. Each layer of the Transformer adds a small update to the residual, it does not replace the representation, it *nudges* it. This is structurally identical to how a **geodesic**, the shortest path on a curved surface, is computed: you take small steps, each determined by the local curvature. The residual stream, then, traces something like a geodesic through meaning-space, with each attention head and MLP layer contributing a local correction based on the geometry it perceives. The Transformer does not jump from input to output. It *walks* there, one careful step at a time, along the surface of the manifold.

## Translation Invariance: The Parallelogram Law

Rotational invariance tells us that spinning the entire space preserves meaning. But there's a second, equally profound invariance: **translation invariance of relational offsets**. The vector from "Man" to "King", the "royalty direction", is approximately the same as the vector from "Woman" to "Queen." This isn't a coincidence; it's a geometric regularity that emerges from training on co-occurrence statistics (\cite{mikolov2013word2vec}).

This means concepts like "royalty," "gender," or "youth" aren't points in the space, they're **directions**. And those directions are consistent everywhere. You can pick up the "royalty" vector from one pair and transplant it onto another. This is the **parallelogram law** of analogies, and it's what makes vector arithmetic on words possible at all.

Below, you can explore this interactively. Select different "concept directions" and watch the same offset vector produce valid analogies across multiple word pairs, forming perfect parallelograms in the embedding space.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-parallelogram" style="height: 480px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <label style="font-family: sans-serif; font-size: 0.9em; font-weight: bold; color: #475569;">Concept Direction:</label>
        <button class="parallelogram-btn" onclick="setParallelogramConcept('royalty')" id="btn-para-royalty" style="background: #3b82f6; color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-weight: bold;">👑 Royalty</button>
        <button class="parallelogram-btn" onclick="setParallelogramConcept('gender')" id="btn-para-gender" style="background: #64748b; color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-weight: bold;">⚤ Gender</button>
        <button class="parallelogram-btn" onclick="setParallelogramConcept('age')" id="btn-para-age" style="background: #64748b; color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-weight: bold;">📅 Age</button>
    </div>
    <div id="parallelogram-status" style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> The <span style="color:#3b82f6; font-weight:bold;">blue arrows</span> show the same concept offset applied to different word pairs. If the arrows are parallel and equal in length, the analogy holds, the concept is a <i>consistent direction</i> in the space, not tied to any specific word.
    </div>
</section>
