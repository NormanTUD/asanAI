<?php include_once("functions.php"); ?>

<div class="smart-quote" data-cite="wittgenstein1953investigations">
  The meaning of a word is its use in the language.
</div>

<div class="md">
In the architecture of a Transformer, a word possesses no intrinsic "soul" or static dictionary definition. Instead, its identity is defined entirely by its context, its **use**. This philosophical principle is operationalized through a high-dimensional **Embedding Space**, where semantic concepts are mapped as coordinates in a continuous geometric manifold.

Even though in this example, we treat tokens as words, they can also be parts of words or single characters like a comma or a semicolon due to \citealternativetitle{gage1994bpe}.

In the history of linguistics, the work of \citeauthor{firth1957distributive} (\citeyear{firth1957distributive}) provides the theoretical bedrock for modern word embeddings. Known as the Distributional Hypothesis, his famous maxim, "You shall know a word by the company it keeps" (p. 11), suggests that words occurring in similar contexts share similar meanings. This shift away from fixed dictionary definitions to context-based identity allowed later researchers like \citeauthorlastnameand{mikolov2013word2vec} to mathematically map language into the vector spaces we see in modern LLMs today.



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
        <input type="text" id="input-1d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;" placeholder="e.g., Cold + Warm" onkeyup="calcEvo('1d')">
        <div id="res-1d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #3b82f6; overflow-x: auto;">Match: -</div>
    </div>
    <div class="embedding-table-container" id="editor-1d" data-space="1d"></div>
</section>

<div class="md">
## Two dimensions

Human language is far too nuanced for a single axis. To capture independent features such as gender, power, or biological species, we project tokens into a **vector space** with multiple dimensions. In this space, each dimension represents a latent semantic feature discovered by the model during training.

Because these positions are derived from logical relationships in data, the space itself becomes "computable". We can perform algebraic operations on these vectors to navigate human concepts:

$$ \vec{v}_{\text{King}} - \vec{v}_{\text{Man}} + \vec{v}_{\text{Woman}} \approx \vec{v}_{\text{Queen}} $$

This specific property, that word vectors capture semantic relationships through linear offsets, was popularized by \citeauthor{mikolov2013word2vec} during the development of Word2Vec.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-2d" style="height: 400px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div>
        <input type="text" id="input-2d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;" placeholder="e.g., Man + Power" onkeyup="calcEvo('2d')">
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
        <input type="text" id="input-3d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;" placeholder="e.g., King + Animal" onkeyup="calcEvo('3d')">
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
</div>

<div class="optional md" data-headline="The Outliers of Geometry: Hapax Legomena and Glitch Tokens">
While the semantic manifold relies on "use" to define meaning, the system falters when a word lacks a statistical history. [**Hapax legomena**](https://en.wikipedia.org/wiki/Hapax_legomenon), terms that appear only once in an entire corpus, present a unique challenge for embedding spaces. Because a token's identity is defined entirely by its context, a single occurrence provides insufficient data points to anchor it. In a high-dimensional space, these words become "homeless"; the model cannot triangulate their coordinates through repeated relationships. Without the "gravity" of multiple linguistic environments to pull them into a meaningful neighborhood, their vectors often reside in noisy, semi-random locations, rendering them mathematically isolated from the manifold of human knowledge.

Even more disruptive are **Glitch Tokens** (described by Yuxi Li et al. in \citeyear{glitchtokens}), which reveal the cracks in the machine's geometric logic. These often arise from anomalies like the Reddit username `SolidGoldMagikarp`, a bot that appeared in thousands of entries within a specific counting thread. Because these strings appeared frequently enough to be assigned a dedicated token but lacked varied, human-semantic context, they do not possess a stable "positional relationship" in the space. When an LLM encounters these tokens, it often suffers a "hallucination of meaning" or total logic failure. In the geometry of meaning, these tokens act like "voids" or "gravity wells", they are products of statistical co-occurrence that do not correlate with any human concept.
</div>

<div class="md">
## Rotational Invariance and Translation as Path-Finding

A critical property of embedding spaces is their **rotational invariance**. If you take an entire embedding space and rotate it, spinning every single vector by the same angle, nothing changes semantically. "King" is still near "Queen," "Cat" is still far from "Democracy." This is because meaning in these spaces is not encoded in absolute coordinates, but in the **\cite[relational geometry]{smith2017orthogonal}** between points: their distances, angles, and cluster structures.

This has a profound implication for **cross-lingual translation**. When a Transformer is trained on two languages, each language develops its own embedding space. Remarkably, these spaces tend to be **isomorphic**, they share the same internal geometric structure, \cite[just rotated and scaled relative to each other]{mikolov2013exploiting}. The word for "king" in French and the word for "king" in English occupy analogous positions within their respective manifolds. Aligning two such spaces often requires nothing more than a linear transformation, a rotation matrix and a scaling factor, because the underlying topology of human concepts is, to a significant degree, \cite[language-invariant]{conneau2018word}.

A **translation Transformer**, then, can be understood as a system that performs a kind of geometric **path-finding**. Given a sequence of tokens in the source language, the encoder maps them into a trajectory through embedding space, a path that weaves through clusters of meaning. The decoder's task is not to look up word-for-word equivalents, but to find a **corresponding path** through the target language's embedding space that preserves the same relational structure: the same turns, the same cluster transitions, the same semantic "shape."

In other words, the Transformer doesn't translate *words*. It translates **paths through meaning-space**. It identifies the geometric signature of the input, which clusters were visited, in what order, with what transitions, and reconstructs an analogous trajectory in the output space. This is why translations can be fluent even when there is no one-to-one word correspondence between languages: the model is matching *shapes*, not *points*.

This is also why the Attention mechanism is so central. Attention computes pairwise relationships (via dot products) between all tokens in a sequence, effectively building a map of the local geometry, which points are near each other, which are aligned, which are \cite[orthogonal]{vaswani2017attention}. This relational map is what gets preserved and transferred, \cite[not any individual coordinate]{elhage2021mathematical}.

</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-crosslingual-align" style="height: 500px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <button id="btn-align" onclick="animateCrossLingualAlignment()" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">▶ Align Languages</button>
        <button id="btn-reset-align" onclick="resetCrossLingualAlignment()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">↺ Reset</button>
        <span id="align-status" style="width: 100%; text-align: center; font-size: 0.85em; color: #64748b; font-family: sans-serif;">Ready, Japanese is rotated 55° from English.</span>
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
The real magic is in the **transformation itself**. You can watch Japanese's embedding space smoothly rotate and scale to align with English. This is exactly what algorithms like Procrustes alignment do: they find the optimal rotation matrix $\mathbf{W}$ such that $\mathbf{X}_B \mathbf{W} \approx \mathbf{X}_A$, minimizing the distance between corresponding word pairs across languages (\cite{smith2017orthogonal}, \citeauthorlastnameand{conneau2018word}).

Click **"Align"** to animate the transformation. Notice how the internal structure, the distances between King/Queen, Man/Woman, is perfectly preserved. Only the orientation changes. This is rotational invariance made visible.
</div>

<div class="md">
### The Limits of Isomorphism

While the cross-lingual alignment story is compelling, the isomorphism between language embedding spaces is not perfect. The alignment quality degrades significantly for typologically distant language pairs, English to Japanese, for instance, is far harder to align than \cite[English to Spanish]{sogaard2018limitations}. This suggests that the "universal geometric structure of human concepts" has real limits. Languages don't just rotate the same space; they can **warp** it. Cultures that carve up semantic space differently, languages with different color term boundaries, or kinship systems, produce embedding geometries that are locally similar but globally distorted. The rotation-plus-scaling model is a first-order approximation, not the full story.

## The Manifold Hypothesis

The deeper theoretical reason the path-finding framing works is the **\cite[Manifold Hypothesis]{bengio2013representation}**: the idea that high-dimensional data, like language, actually lies on or near a much lower-dimensional manifold embedded in the high-dimensional space. If sentences trace paths on a manifold, then translation is literally a mapping between two manifolds that share the same topology. The Transformer's attention layers can be seen as learning the **local coordinate charts** of these manifolds, the rules for how to navigate the surface at each point.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-dual-manifolds" style="height: 600px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>

    <!-- Sliders -->
    <div style="display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Rotation:</b>
            <input type="range" id="dm-rotation" min="0" max="180" step="1" value="55" oninput="updateDualManifold()" style="width: 140px; vertical-align: middle;">
            <span id="dm-rot-val" style="font-weight: bold; color: #8b5cf6;">55°</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569;">
            <b>Separation:</b>
            <input type="range" id="dm-separation" min="0" max="8" step="0.1" value="5" oninput="updateDualManifold()" style="width: 140px; vertical-align: middle;">
            <span id="dm-sep-val" style="font-weight: bold; color: #8b5cf6;">5.0</span>
        </label>
    </div>

    <!-- Toggles -->
    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="dm-correspondence" checked onchange="toggleDualManifold()"> Correspondence lines
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="dm-paths" checked onchange="toggleDualManifold()"> Translation paths
        </label>
    </div>

    <!-- Buttons -->
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <button id="btn-dm-align" onclick="animateDualManifoldAlignment()" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">▶ Align Manifolds</button>
        <button onclick="resetDualManifold()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">↺ Reset</button>
        <span id="dm-status" style="font-size: 0.85em; color: #64748b; font-family: sans-serif;">Ready, Japanese manifold is rotated 55° and separated.</span>
    </div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>Translation as path-finding on manifolds.</b>
        The <span style="color:#3b82f6; font-weight:bold;">blue surface</span> is the English semantic manifold;
        the <span style="color:#10b981; font-weight:bold;">green surface</span> is the Japanese manifold.
        Both encode the same conceptual relationships, the same internal distances and angles, but live in different orientations and positions in the ambient space.
        The <span style="color:#8b5cf6; font-weight:bold;">purple dashed lines</span> bridge corresponding word pairs across languages.
        The <span style="color:#3b82f6; font-weight:bold;">blue path</span> traces Man → King → Queen along the English surface;
        the <span style="color:#10b981; font-weight:bold;">green path</span> traces 男 → 王様 → 女王 along the Japanese surface, the <i>same semantic journey</i> on a different manifold.
        Use the <b>sliders</b> to rotate and separate the surfaces manually, or click <b>Align</b> to watch the Japanese manifold smoothly merge into the English one, proving the internal geometry is preserved.
    </div>
</section>

<div class="md">
## Attention as Metric Tensor

There is an even more geometric way to think about attention. In differential geometry, a **metric tensor** defines how distances are measured locally on a manifold, it tells you the "shape" of space at each point. The attention matrix in a Transformer does something analogous: it dynamically redefines which tokens are "close" to which other tokens at each layer, effectively warping the local geometry of the embedding space as the representation is processed. This is not merely a metaphor, the connections between attention mechanisms and geometric structures on manifolds have been formalized in the \cite[framework of Geometric Deep Learning]{bronstein2021geometric}.

## The Residual Stream as Geodesic

Building on \cite[the mechanistic analysis of Transformer circuits]{elhage2021mathematical}, there is an elegant way to think about the **residual stream**. Each layer of the Transformer adds a small update to the residual, it does not replace the representation, it *nudges* it. This is structurally identical to how a **geodesic**, the shortest path on a curved surface, is computed: you take small steps, each determined by the local curvature. The residual stream, then, traces something like a geodesic through meaning-space, with each attention head and MLP layer contributing a local correction based on the geometry it perceives. The Transformer does not jump from input to output. It *walks* there, one careful step at a time, along the surface of the manifold.

## Translation Invariance: The Parallelogram Law

Rotational invariance tells us that spinning the entire space preserves meaning. But there's a second, equally profound invariance: **translation invariance of relational offsets**. The vector from "Man" to "King", the "royalty direction", is approximately the same as the vector from "Woman" to "Queen." This isn't a coincidence; it's a geometric regularity that \cite[emerges from training on co-occurrence statistics]{mikolov2013word2vec}).

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

<h2>The Platonic Representation Hypothesis</h2>

<div class="smart-quote" data-cite="plato380republic">
To them, I said, the truth would be literally nothing but the shadows of the images.
</div>

<div class="md">
Perhaps the most provocative recent finding is \citetitle{huh2024platonic}: different models trained on completely different data modalities, text, images, audio, appear to be converging toward the same underlying representation of reality. Vision models and language models, when aligned, share similar geometric structures. This suggests that there may be a "platonic" embedding space, an optimal geometry for representing the statistical structure of the real world, and that all sufficiently powerful models are independently discovering it.

The analogy to Plato's theory of Forms is deliberate. Just as Plato argued that the physical world is a shadow of a more perfect realm of ideal Forms, the Platonic Representation Hypothesis suggests that all model embeddings are **projections**, different rotations and scalings of a single, underlying geometric truth. A vision model that learns "dog" from millions of photographs, a language model that learns "dog" from billions of sentences, and an audio model that learns "dog" from spectrograms of barking, all three converge to place "dog" in the *same neighborhood*, near "cat" and "wolf," far from "piano" and "thunder." The internal distances and angles between concepts are preserved across modalities, even though no model ever saw another's training data.

This would explain why cross-lingual alignment works (as we saw above): not just because human languages share syntactic structure, but because **the world they describe has a fixed geometry**. French and English converge not merely because both are human languages, but because both are attempting to model the same underlying reality, and that reality has a unique optimal embedding. As models grow more powerful and see more data, they are all climbing the same mountain from different sides, converging toward the summit: the platonic representation.

Below, three independently trained models, a **Language model** (●), a **Vision model** (◆), and an **Audio model** (■), have each learned to embed the same real-world concepts. Each model lives in its own rotated coordinate frame. But the **internal geometry**, which concepts are near which, what clusters form, what distances separate them, is identical across all three. Click **Align** to watch all three modalities converge onto a single shared structure, revealing the "platonic" geometry underneath.

This hypothesis allows so-called **Brain-Swapping**: since models learn similiar representation when trained on data about the same real world, their embedding spaces have similiar manifolds in them, and can be changed after being rotated without too big of an impact on the validity of the results.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-platonic" style="height: 600px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>

    <!-- Toggles -->
    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="platonic-correspondence" checked onchange="togglePlatonicOption()"> Correspondence lines
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="platonic-structure" checked onchange="togglePlatonicOption()"> Cluster structure
        </label>
    </div>

    <!-- Buttons -->
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <button id="btn-platonic-align" onclick="animatePlatonicAlignment()" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">▲ Align Modalities</button>
        <button onclick="resetPlatonicAlignment()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">↻ Reset</button>
        <span id="platonic-status" style="font-size: 0.85em; color: #64748b; font-family: sans-serif;">Ready, three models, three different orientations, one shared geometry.</span>
    </div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b>
        Three models trained on entirely different data:
        the <span style="color:#3b82f6; font-weight:bold;">Language model</span> (● circles) learned from text,
        the <span style="color:#f59e0b; font-weight:bold;">Vision model</span> (◆ diamonds) learned from images,
        and the <span style="color:#10b981; font-weight:bold;">Audio model</span> (■ squares) learned from sound.
        Each model discovered its own coordinate frame, but the internal structure is the same.
        <span style="color:#ef4444;">Animals</span> cluster together,
        <span style="color:#ec4899;">instruments</span> cluster together,
        <span style="color:#14b8a6;">nature sounds</span> cluster together, in <i>every</i> modality.
        The <span style="color:#8b5cf6; font-weight:bold;">purple dashed lines</span> connect the same concept across modalities.
        Click <b>Align</b> to rotate all three into the same frame and watch them collapse onto one geometry: the <b>platonic representation</b>.
    </div>
</section>

<div class="md">
## Anisotropy

Embedding spaces are typically **anisotropic**, the vectors are not uniformly distributed through the space but instead cluster in a narrow cone or occupy only a subregion of the available volume. \citeauthor{ethayarajh2019contextual} (\citeyear{ethayarajh2019contextual}) showed that in models like BERT and GPT-2, embeddings at later layers become increasingly anisotropic, meaning the average cosine similarity between random word pairs is surprisingly high (often 0.5–0.9). This is problematic because it compresses the effective range of cosine similarity, making it harder to distinguish genuinely similar words from merely average ones. Techniques like **whitening** or **isotropy calibration** are used to counteract this.

To understand why this matters, consider the geometry. In a perfectly **isotropic** space, word vectors are scattered uniformly across all directions. A random pair of words would have an expected cosine similarity near zero, leaving the full range from $-1$ to $+1$ available to encode genuine semantic relationships. But when the distribution collapses into a narrow cone, as it does in the deeper layers of most Transformers, even unrelated words end up pointing in roughly the same direction. The cosine similarity between "Democracy" and "Sandwich" might be $0.7$, while the similarity between "King" and "Queen" might be $0.85$. The *absolute* numbers look high in both cases; only a narrow band of $0.15$ separates meaningful relatedness from noise. This is the anisotropy problem: the metric that is supposed to measure "how similar are these concepts?" becomes almost useless when the entire vocabulary is squeezed into a small angular region of the space.

Below, drag the **anisotropy slider** from isotropic (vectors spread uniformly) to highly anisotropic (vectors crushed into a narrow cone). Watch how the histogram of pairwise cosine similarities collapses from a wide distribution into a tight spike, and how the effective discriminative range shrinks to almost nothing.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="">
        <div id="plot-anisotropy-scatter" style="height: 450px; background: #fff; border-radius: 8px; width: 100%;"></div>
        <div id="plot-anisotropy-histogram" style="height: 450px; background: #fff; border-radius: 8px; width: 100%;"></div>
    </div>
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin: 15px 0;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Anisotropy:</b>
            <input type="range" id="anisotropy-slider" min="0" max="1" step="0.01" value="0" style="width: 260px; vertical-align: middle;">
            <span id="anisotropy-val" style="font-weight: bold; color: #3b82f6;">0% (Isotropic)</span>
        </label>
    </div>
    <div id="anisotropy-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; max-width: 700px; margin: 0 auto;"></div>
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> The left panel shows word vectors emanating from the origin. In an <b>isotropic</b> space (slider at 0%), vectors spread uniformly in all directions. As <b>anisotropy</b> increases, vectors collapse into a <span style="color:#ef4444; font-weight:bold;">narrow cone</span> (shaded red wedge). The right panel shows the distribution of <i>all pairwise cosine similarities</i>. Notice how it shifts from a wide spread centered near 0 to a narrow spike near 1.0, the <span style="color:#ef4444; font-weight:bold;">effective bandwidth</span> for distinguishing "truly similar" from "merely average" shrinks dramatically.
    </div>
</section>

<div class="md">
## Polysemanticity and the Superposition Hypothesis

Modern research into Transformers reveals that the brain-inspired "one neuron, one concept" model, often critiqued as the **"Grandmother Neuron"** (coined by \cite[Jerome Lettvin]{grandmotherneuron} in 1969), is an illusion. Instead, models utilize two critical phenomena to represent information:

### Distributed Representations
A concept like "cat" is not stored in a single neuron. Instead, it is a **direction** in a high-dimensional vector space. To represent a specific concept, the model activates a pattern across dozens of neurons. Shifting a single activation in this ensemble slightly alters the meaning (e.g., from "cat" to "kitten").

### Polysemanticity (The Multi-Tasking Neuron)
The observable consequence of this structure is **polysemanticity**: individual neurons fire in response to multiple, seemingly unrelated concepts. For example, a single neuron might activate for:
* Text related to the Golden Gate Bridge.
* Mathematical formulas involving integers.
* The concept of "reliability" or "French cuisine."

### Why Superposition Happens
Polysemanticity is not a training failure; it is a predictable result of the model compressing $M$ features into $N$ dimensions where $M \gg N$ (analogous to the **Pigeonhole Principle**). 

The core mechanism is **\cite[Superposition]{elhage2022superposition}**. The model exploits the **sparsity** of natural language, the fact that "legal terminology" and "French cuisine" rarely co-occur in the same context. By assigning concepts to nearly orthogonal directions in high-dimensional space, the model packs exponentially more features than it has physical neurons, accepting occasional "crosstalk" (interference) as a tolerable trade-off for massive representational capacity.

### Golden-Gate-Claude

A vivid demonstration of these principles is \citetitle{goldengateclaude}, in which researchers from Anthropic used \cite[Sparse Autoencoders]{sparseautoencoders} to isolate a specific feature direction within Claude Sonnet's activation space corresponding to the concept of the Golden Gate Bridge. By artificially amplifying this single direction during inference, the model became fixated on the bridge, mentioning it in nearly every response regardless of topic. This confirms that concepts are encoded as **directions** in high-dimensional space, not in individual neurons, and that these directions are causally active: amplifying one is sufficient to dominate the model's output. It is also a direct consequence of superposition — because "Golden Gate Bridge" shares neuronal substrate with countless other features via near-orthogonal packing, isolating it required the decomposition tools described above rather than simply toggling a single neuron.

**The Dimensionality Trade-off:** In a 2D space, you can only have two perfectly orthogonal (zero interference) features. In a 768+ dimensional model, thousands of "near-orthogonal" features can coexist, though this proximity is exactly why individual neurons appear polysemantic.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-superposition" style="height: 480px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>

    <!-- Slider -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Features to represent (N):</b>
            <input type="range" id="superposition-n" min="2" max="12" step="1" value="2" style="width: 220px; vertical-align: middle;">
            <span id="superposition-n-val" style="font-weight: bold; color: #3b82f6;">2</span>
        </label>
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            Available dimensions: <b style="color: #ef4444;">2</b>
        </span>
    </div>

    <!-- Stats cards -->
    <div id="superposition-stats" style="max-width: 650px; margin: 0 auto 15px auto;"></div>

    <!-- Interference matrix -->
    <div id="superposition-matrix" style="max-width: 650px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 8px;">
        <b>What you're seeing:</b> Each <b>arrow</b> is a feature direction on the unit circle in 2D.
        With N &le; 2, features are perfectly orthogonal (the <span style="color:#10b981; font-weight:bold;">green</span> right-angle marker confirms it).
        The moment N exceeds 2, features must share angular space &mdash; this is <b>superposition</b>.
        The <span style="color:#ef4444; font-weight:bold;">red lines</span> between arrow tips show interference: thicker and more opaque means a higher |dot product|.
        The matrix below shows every pairwise value. In a real LLM with 768+ dimensions,
        the model can fit <i>thousands</i> of near-orthogonal features, but "near" still means
        each neuron ends up <b>polysemantic</b> &mdash; responding to multiple features at once.
    </div>
</section>

<div class="md">
## The Geometry of In-Context Learning

One of the most active research frontiers concerns what happens when you give a model a handful of examples directly in the prompt. Rather than updating any weights, the model appears to construct an implicit **task vector** in activation space on the fly. \citeauthor{hendel2023incontext} demonstrated in \citeyear{hendel2023incontext} that the function learned via in-context learning can be compressed into a single vector, extracted by computing the difference between the model's internal activations *with* the few-shot examples and *without* them, and then **injected** into a blank prompt to reproduce the same behavior.

To see this concretely, imagine prompting a model with:

*Q: What is the capital of France?  A: Paris*

*Q: What is the capital of Germany?  A: Berlin*

*Q: What is the capital of Japan?  A: Tokyo*

*Q: What is the capital of Italy?  A: ???*

Each example pair creates an **offset vector** in the model's internal activation space, a directional arrow pointing from where "France" lives to where "Paris" lives. These individual arrows are noisy: the *France → Paris* offset is not identical to the *Germany → Berlin* offset because each word occupies a slightly different region of the high-dimensional manifold. But when the model averages across all the examples, a single coherent **task direction** emerges, a vector that encodes "move from a country token to its capital-city token." When the query token "Italy" enters the residual stream, this task direction **steers** it toward the correct answer region, landing it near "Rome", without any weight update whatsoever.

This is why in-context learning is so powerful and so mysterious: the model is not being retrained. It is performing a geometric operation, constructing a direction from examples and applying it to a query, entirely within the forward pass. The task vector is not stored in any weight matrix; it exists only as a transient pattern in the activation geometry, assembled and discarded with each new prompt.

Below, you can watch this process unfold. The **left panel** shows the geometric view: each **colored arrow** connects a country to its capital in activation space, and the **right panel** shows the actual prompt the model receives, color-coded to match. The arrows are averaged into a single **task vector** (blue). Use the slider to add or remove examples and watch the task vector stabilize, with too few examples the averaged direction is noisy and may miss the answer region; with enough examples, it converges precisely on the correct answer.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">

    <!-- Two-column: Plot + Prompt Panel -->
    <div style="display: grid; gap: 20px; align-items: start; margin-bottom: 15px;">
        <div id="plot-icl-task-vector" style="height: 540px; background: #fff; border-radius: 8px; width: 100%;"></div>
        <div id="icl-prompt-preview"></div>
    </div>

    <!-- Controls -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Few-shot examples:</b>
            <input type="range" id="icl-num-examples" min="1" max="6" step="1" value="3" style="width: 200px; vertical-align: middle;">
            <span id="icl-num-val" style="font-weight: bold; color: #3b82f6;">3</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <button id="btn-icl-inject" onclick="animateICLInjection()" style="background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">⚡ Inject Task Vector</button>
        <button onclick="resetICL()" style="background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">↺ Reset</button>
        <span id="icl-status" style="font-size: 0.85em; color: #64748b; font-family: sans-serif;">Ready, adjust examples and click Inject.</span>
    </div>

    <!-- Stats -->
    <div id="icl-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; max-width: 700px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> Each <b>colored arrow</b> on the left panel connects a country to its capital in the model's internal activation space.
        The same color appears in the <b>prompt panel</b> on the right, so you can trace every sentence to its geometric effect.
        The offset vectors Δ are shown beside each prompt line and averaged into the
        <span style="color:#3b82f6; font-weight:bold;">blue Task Vector</span>.
        The <span style="color:#ef4444; font-weight:bold;">red diamond</span> is the query token "Italy."
        Click <b>Inject</b> to steer "Italy" along the task vector toward the
        <span style="color:#10b981; font-weight:bold;">green answer region</span> around "Rome."
        With 1 noisy example the vector misses; add more examples and watch it converge.
    </div>
</section>

<div class="md">
## The Manifold Hypothesis Explains Why High-Dimensional Models Don't Overfit

Classical statistics tells us that fitting a model with $P$ parameters to $N$ data
points requires $N \gg P$ to avoid overfitting. GPT-3 has **175 billion parameters**
but was trained on **~300 billion tokens**, a ratio of roughly **1.7:1**, which
classical theory says should catastrophically overfit.

The resolution is the **Manifold Hypothesis**: although the parameter space is
175-billion-dimensional, the data lives on a much **lower-dimensional manifold**.
The effective dimensionality of the problem is determined by the *intrinsic
dimension* of the data manifold, not the ambient parameter space. Natural language,
despite its surface complexity, has a much lower intrinsic dimension because of the
constraints of grammar, logic, physics, and human cognition.

LLMs don't overfit despite having more parameters than data
points because the data constrains them to a low-dimensional manifold in parameter
space. The 175 billion parameters are not 175 billion independent degrees of
freedom, they're 175 billion coordinates describing a position on a manifold
whose intrinsic dimension might be **orders of magnitude smaller**.

This is why **scaling works**: adding more parameters doesn't add proportionally more
degrees of freedom, it adds more *resolution* for describing the same
low-dimensional structure. It's like going from a 100×100 pixel image to a
1000×1000 pixel image of the same scene, more numbers, but the same underlying
reality.

$$
\underbrace{d_{\text{intrinsic}}}_{\text{effective DoF}} \ll
\underbrace{D_{\text{ambient}}}_{\text{175B params}} \implies
\text{No overfitting even when } N \approx D
$$

This was first described by \citeauthorlastnameand{belkin2019}.
</div>

<div class="md">
## The Geometry of Negation

One of the most counter-intuitive failures of embedding spaces is that **negation doesn't work geometrically** the way you'd expect. The vector for "not happy" is closer to "happy" than to "sad", because "not" and "happy" co-occur in the same sentences, and distributional semantics encodes co-occurrence, not logical opposition. This is a deep structural limitation: embedding spaces capture **associative similarity**, not **logical relationships**.

In a distributional model, the meaning of "not" is itself a vector, learned from all the contexts where "not" appears. When you compose "not happy" (by adding the vectors), the "not" component provides only a small perturbation, a slight directional nudge, rather than a $180°$ reversal to the antonym. The result is a vector that still sits firmly in the neighborhood of "happy," surrounded by words like "cheerful," "pleased," and "joyful." The actual antonym, "sad," remains far away in a completely different region of the space.

$$\vec{v}_{\text{not happy}} = \vec{v}_{\text{not}} + \vec{v}_{\text{happy}} \approx \vec{v}_{\text{happy}} + \varepsilon \quad \neq \quad \vec{v}_{\text{sad}}$$

This negation problem has been \cite[extensively studied]{kassner2020negated} and remains partially unsolved even in large contextual models like BERT and GPT. While Transformers with attention can handle negation better than static embeddings, because the surrounding context modulates the representation across layers, the underlying geometric limitation persists in the embedding layers themselves. The word "not" simply does not encode a logical inversion operator in vector space; it encodes "the kinds of sentences where 'not' appears," which overwhelmingly co-occur with the very concepts being negated.

Below, select any word (or type "not X") and observe how "not X" drifts only slightly from X in embedding space, rather than jumping to its logical antonym. The faded circle marks where "not X" *should* land if geometry respected logic.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-negation" style="height: 520px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>

    <!-- Text input -->
    <div style="margin-bottom: 12px;">
        <input type="text" id="input-negation"
            style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;"
            placeholder='Type a word or "not X" (e.g., not Happy, Love, Cold...)'
            oninput="handleNegationInput(this.value)">
    </div>

    <!-- Buttons -->
    <div style="display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; font-weight: bold; color: #475569;">Try negating:</label>
        <button class="negation-btn" id="btn-neg-happy" onclick="setNegationWord('Happy')" style="background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Happy</button>
        <button class="negation-btn" id="btn-neg-good" onclick="setNegationWord('Good')" style="background: #64748b; opacity: 0.7; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Good</button>
        <button class="negation-btn" id="btn-neg-love" onclick="setNegationWord('Love')" style="background: #64748b; opacity: 0.7; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Love</button>
        <button class="negation-btn" id="btn-neg-alive" onclick="setNegationWord('Alive')" style="background: #64748b; opacity: 0.7; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Alive</button>
        <button class="negation-btn" id="btn-neg-hot" onclick="setNegationWord('Hot')" style="background: #64748b; opacity: 0.7; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Hot</button>
        <button class="negation-btn" id="btn-neg-big" onclick="setNegationWord('Big')" style="background: #64748b; opacity: 0.7; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Big</button>
    </div>

    <!-- Stats cards -->
    <div id="negation-stats" style="max-width: 650px; margin: 0 auto 12px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6;">
        <b>What you're seeing:</b> The <span style="color:#3b82f6; font-weight:bold;">blue dot</span> is the original word.
        The <span style="color:#ef4444; font-weight:bold;">red diamond</span> is "not [word]", its <i>actual</i> position in embedding space,
        computed by adding the "not" vector. The <span style="color:#10b981; font-weight:bold;">green dot</span> is the logical antonym.
        The <span style="color:rgba(239,68,68,0.4);">faded red circle</span> shows where "not [word]" <i>should</i> land if negation worked logically.
        Notice the red diamond barely moves from the blue dot, because in distributional semantics,
        "not happy" co-occurs in the same contexts as "happy," so they end up as neighbors.
        The <span style="color:#f59e0b; font-weight:bold;">gold arrow</span> is the tiny "not" perturbation; the
        <span style="color:rgba(16,185,129,0.4);">faded green line</span> is the path logic <i>expects</i>.
        <b>Negation is invisible to the geometry.</b>
    </div>
</section>

<div class="md">
## Hyperbolic Embeddings

Standard embedding spaces use Euclidean geometry, but human language is rife with hierarchical structure, taxonomies (animal → mammal → dog → poodle), hypernymy chains, parse trees, organizational hierarchies. Euclidean space is fundamentally ill-suited for representing trees: the number of nodes at depth $d$ in a tree with branching factor $b$ grows as $\mathcal{O}(b^d)$, exponentially, but the volume of a Euclidean ball of radius $r$ in $n$ dimensions grows only polynomially as $\mathcal{O}(r^n)$. This mismatch means that as a tree grows deeper, a Euclidean embedding must either introduce severe distance distortion or consume prohibitively many dimensions to accommodate the exponential proliferation of leaf nodes.

**Hyperbolic space** resolves this tension. Spaces of constant negative curvature exhibit **exponential volume growth**, the circumference of a hyperbolic circle of radius $r$ grows as $\sim e^r$, not $\sim r$, making them the natural geometric habitat for embedding hierarchies with minimal distortion. In the **\cite[Poincaré disk model]{nickel2017poincare}**, the entire hyperbolic plane is mapped to the interior of a unit disk. Points near the **center** represent general, high-level concepts ("entity"), while points near the **boundary** represent increasingly specific leaves ("golden retriever"). The metric that governs this world is:

$$ d_{\mathbb{H}}(\mathbf{u}, \mathbf{v}) = \operatorname{arccosh}\!\left(1 + 2\,\frac{\|\mathbf{u} - \mathbf{v}\|^2}{(1 - \|\mathbf{u}\|^2)(1 - \|\mathbf{v}\|^2)}\right) $$

Notice the denominator: as either point approaches the boundary ($\|\mathbf{u}\| \to 1$), the distance **explodes**, even for vanishingly small Euclidean displacements. This is the geometric mechanism that provides "exponential room" near the edge, exactly where the exponentially many leaf nodes of a deep taxonomy need to reside. Geodesics in the Poincaré disk are not straight lines but **arcs of circles orthogonal to the boundary**, curving inward through the disk, \cite[a striking visual signature of negative curvature]{nickel2017poincare}.

Below, a taxonomy tree is embedded in the Poincaré disk. The **highlighted chain** traces Entity → Animal → Mammal → Dog → Poodle from center to boundary. Drag the **curvature slider** from Euclidean (flat, uniformly spaced depth rings, straight edges) to Hyperbolic (exponentially compressed rings, inward-curving geodesics) and watch the geometry transform, a stark contrast to the flat Euclidean grids explored above.

\citeauthorlastnameand{poincareembeddings} have shown that, by chosing a Poincaré Embedding Space, the number of dimensions required could be drastically removed in some instances.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; gap: 20px; align-items: start;">
        <div id="plot-poincare-disk" style="height: 560px; background: #fff; border-radius: 8px; width: 100%;"></div>
        <div id="poincare-stats" style="width: 100%;"></div>
    </div>

    <!-- Curvature slider -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin: 15px 0;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Curvature:</b>
            <input type="range" id="poincare-curvature" min="0" max="1" step="0.01" value="1" style="width: 280px; vertical-align: middle;">
            <span id="poincare-curvature-val" style="font-weight: bold; color: #8b5cf6;">Hyperbolic</span>
        </label>
    </div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> A taxonomy tree embedded in the <span style="color:#8b5cf6; font-weight:bold;">Poincaré disk</span>.
        General concepts like "Entity" sit near the <b>center</b>; specific concepts like "Poodle" and "Tabby" crowd near the <b>boundary</b>.
        The <span style="color:#6366f1; font-weight:bold;">curved arcs</span> are <b>geodesics</b>, shortest paths in hyperbolic space, which bend inward through the disk.
        The <span style="color:#f59e0b; font-weight:bold;">amber chain</span> highlights Entity → Animal → Mammal → Dog → Poodle.
        Drag the <b>curvature slider</b> to 0 (Euclidean) and watch the depth rings become evenly spaced and the edges straighten; slide to 1 (Hyperbolic) and the outer rings compress toward the boundary while geodesics curve inward, exponential room for exponentially many leaves.
    </div>
</section>

<div class="md">
## Topology: Clumps and Branches

So far, we've treated the embedding space as a smooth, continuous manifold where words drift through a uniform fog of dimensions. But the actual *topology* of the feature space tells a different story. It is not a uniform fog at all — it is **highly structured**, full of empty voids and narrow corridors.

### High-Dimensional Narrow Cones

In a 768-dimensional space, you might expect data points to spread out evenly in all directions. They don't. Empirically, the data concentrates in **narrow cones** — thin, elongated regions that radiate outward from the origin like the spines of a sea urchin. The vast majority of the theoretical volume is *empty*. No token lives there. No sentence ever visits it.

This is a direct consequence of the **concentration of measure** phenomenon in high-dimensional geometry: in $n$ dimensions, almost all the volume of a hypersphere is concentrated in a thin shell near the surface, and almost all pairs of random vectors are nearly orthogonal. The result is that meaningful data doesn't fill the space — it clings to a sparse skeleton of low-dimensional structures threading through the void.

This has practical consequences:
* **Nearest-neighbor search** is harder than it looks, because "nearest" in 768 dimensions doesn't mean what your 3D intuition suggests. Most of the space between any two points is empty.
* **Clustering** reveals that the space is not a single blob but a network of **filaments and clumps** — dense knots of semantically related tokens connected by thin bridges, surrounded by vast uninhabited regions.
* **Interpolation** between two tokens (e.g., averaging their vectors) can land you in one of these empty voids, producing a vector that corresponds to *no* meaningful concept — a "semantic vacuum."

The visualization below gives you an intuition for this. In 2D, points can spread out uniformly. But as you increase the effective dimensionality (simulated here by compressing the angular distribution), the points collapse into narrow cones, and the fraction of "occupied" space shrinks dramatically. The **gray region** represents the empty void — the space where no data lives.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-topology-cones" style="height: 480px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>

    <!-- Slider -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Effective Dimensionality:</b>
            <input type="range" id="topology-dim-slider" min="0" max="1" step="0.01" value="0" style="width: 240px; vertical-align: middle;">
            <span id="topology-dim-val" style="font-weight: bold; color: #8b5cf6;">Low (2D-like)</span>
        </label>
    </div>

    <!-- Stats -->
    <div id="topology-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; max-width: 700px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> Each <b>dot</b> is a token vector emanating from the origin.
        At low effective dimensionality (slider left), vectors spread uniformly — the space is well-utilized.
        As you increase the slider, vectors collapse into <span style="color:#8b5cf6; font-weight:bold;">narrow cones</span>,
        simulating how high-dimensional concentration of measure forces data into thin corridors.
        The <span style="color:rgba(148,163,184,0.4); font-weight:bold;">gray wedges</span> mark the <b>empty void</b> — regions of the space where no data lives.
        The <span style="color:#ef4444; font-weight:bold;">occupied fraction</span> shrinks dramatically,
        illustrating why most of a 768-dimensional space is a semantic desert.
    </div>
</section>

<div class="md">
## Semantic Folding & Fractal Self-Similarity

How does a model that operates in a fixed-size vector space manage to encode hierarchies that are, in principle, arbitrarily deep? The answer appears to involve a form of **geometric folding**: the model reuses the same spatial logic at every level of abstraction, nesting finer distinctions inside coarser ones like a fractal.

### The Geometry of the Niche

Consider the concept "Dog." In the embedding space, "Dog" occupies a region — a neighborhood of vectors that all relate to dog-ness. But zoom into that region and you find it is not a featureless blob. Inside it, the vectors for "Dachshund," "Shepherd," and "Poodle" are arranged relative to each other using the same geometric principles that organize the level above. The axis that separates "domestic" from "wild" at the Animal level reappears, at a smaller scale, to separate "lap dog" from "working dog" at the Breed level. The axis that separates "large" from "small" among Mammals reappears to separate "Great Dane" from "Chihuahua" among Dogs.

### Self-Similarity

This is **self-similarity** — the hallmark of fractal structure. The model applies the same set of learned distinction directions (size, danger, domestication, function) at every hierarchical level, each time at a smaller spatial scale. The result is a space that is "folded" in on itself: what looks like a single point at a coarse zoom level unfolds, upon magnification, into a rich sub-structure that mirrors the parent geometry.

$$ \text{Structure}(\text{Breeds within Dog}) \;\approx\; \alpha \cdot \text{Structure}(\text{Species within Animal}) $$

where $\alpha < 1$ is a spatial scaling factor — the sub-structure is a shrunken copy of the super-structure.

This has practical consequences:
* **Few-shot generalization**: Because the same geometric logic repeats at every level, a model that has learned to distinguish "domestic vs. wild" at the Animal level can immediately apply that distinction at the Breed level, even for breeds it has rarely seen.
* **Compositionality**: Hierarchical concepts can be navigated by composing coarse and fine direction vectors — move to "Dog" first (coarse), then move along the "small + domestic" direction within that region (fine).
* **Compression**: A fractal structure is extraordinarily efficient. Instead of learning a unique geometry for every sub-category, the model reuses a small set of distinction templates, scaled and translated, at every depth.

Below, you can explore this fractal folding interactively. The visualization shows a three-level hierarchy: **Animals → Species → Breeds**. At **Zoom Level 1**, you see the coarse structure — clusters of Animals. Zoom in to Level 2 and the "Dog" cluster unfolds into individual species. Zoom to Level 3 and individual breeds appear inside each species — arranged in a geometry that mirrors the level above. The **distinction axes** (size, domestication) are drawn at each level to show how they repeat at smaller scales.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div id="plot-fractal-folding" style="height: 540px; background: #fff; border-radius: 8px; width: 100%; margin-bottom: 15px;"></div>

    <!-- Zoom slider -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Zoom Level:</b>
            <input type="range" id="fractal-zoom-slider" min="1" max="3" step="0.01" value="1" style="width: 260px; vertical-align: middle;">
            <span id="fractal-zoom-val" style="font-weight: bold; color: #8b5cf6;">Level 1 — Animals</span>
        </label>
    </div>

    <!-- Toggle -->
    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="fractal-show-axes" checked onchange="renderFractalFolding()"> Show distinction axes
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="fractal-show-hulls" checked onchange="renderFractalFolding()"> Show cluster boundaries
        </label>
    </div>

    <!-- Stats -->
    <div id="fractal-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; max-width: 700px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> At <b>Level 1</b>, you see the coarse animal kingdom —
        <span style="color:#ef4444; font-weight:bold;">Mammals</span>,
        <span style="color:#3b82f6; font-weight:bold;">Birds</span>, and
        <span style="color:#10b981; font-weight:bold;">Reptiles</span> as clusters.
        As you zoom in (slide right), each cluster <b>unfolds</b> to reveal its internal species,
        and then each species unfolds further into individual breeds or variants.
        The <span style="color:#8b5cf6; font-weight:bold;">purple dashed axes</span> show the
        <b>same distinction directions</b> (size ↔ small, wild ↔ domestic) repeating at every level,
        each time at a smaller spatial scale. This is <b>fractal self-similarity</b>:
        the geometry of the whole is mirrored in every part.
    </div>
</section>

<div class="md">
## Holographic Information Storage

There is a deep analogy between how LLMs store information in their embedding spaces and how **holograms** store images. In a photograph, each pixel records a single point of the scene — scratch the photo and you lose that point forever. In a hologram, every part of the recording medium stores information about the **entire scene** from a slightly different angle. Cut a hologram in half and you don't lose half the image — you lose half the *resolution*. Both halves still contain the full picture, just blurrier.

### Distributed, Not Localized

Neural network embeddings work the same way. The concept "Dog" is not stored in dimension 42, or in any single neuron. It is stored as a **pattern across all dimensions simultaneously** — a direction in the full 768-dimensional space. Every dimension participates in encoding every concept, just as every point on a holographic plate participates in encoding every part of the scene. This is why you can't point to a single weight and say "this is where the model knows about dogs." The knowledge is *everywhere and nowhere* — distributed holographically across the entire vector.

### Graceful Degradation

This has a remarkable consequence: **graceful degradation**. If you zero out a random subset of dimensions in an embedding vector, the concept doesn't vanish — it gets noisier, like a scratched hologram. The remaining dimensions still carry partial information about the full pattern. This is fundamentally different from a lookup table, where deleting an entry destroys the information completely.

The fraction of information retained scales smoothly with the fraction of dimensions preserved:

$$ \text{Signal Quality} \approx \sqrt{\frac{k}{d}} $$

where $k$ is the number of surviving dimensions and $d$ is the total dimensionality. Even with half the dimensions zeroed out, you retain roughly $\sqrt{0.5} \approx 71\%$ of the signal — enough to still identify the concept.

### Interference as the Price of Compression

The flip side of holographic storage is **interference**. Because every concept is spread across every dimension, concepts inevitably overlap. The dot product between "Dog" and "Cat" is not zero — their patterns share components, just as two holograms recorded on the same plate create ghost images of each other. This is the same superposition phenomenon we explored earlier, but seen from the holographic perspective: the embedding space is a shared recording medium, and every concept is written across its entire volume.

Below, you can explore this holographic property directly. A set of concept vectors are embedded in a simulated space. Use the **Damage slider** to randomly zero out increasing fractions of the dimensions. Watch how the **pairwise similarity structure** — which concepts are near which — degrades gracefully rather than catastrophically. The **similarity matrix** on the right preserves its overall pattern even under severe damage, just as a scratched hologram preserves the full scene at lower resolution.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; margin-bottom: 15px;">
        <div id="plot-holographic-scatter" style="height: 480px; background: #fff; border-radius: 8px; width: 100%;"></div>
        <div id="plot-holographic-matrix" style="height: 480px; background: #fff; border-radius: 8px; width: 100%;"></div>
    </div>

    <!-- Damage slider -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Dimension Damage:</b>
            <input type="range" id="holographic-damage" min="0" max="0.95" step="0.01" value="0" style="width: 280px; vertical-align: middle;">
            <span id="holographic-damage-val" style="font-weight: bold; color: #3b82f6;">0% (intact)</span>
        </label>
    </div>

    <!-- Toggle -->
    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="holographic-show-ghost" checked onchange="renderHolographic()"> Show ghost vectors (original)
        </label>
        <button onclick="rerollHolographicDamage()" style="background: #64748b; color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85em;">🎲 Re-roll damage pattern</button>
    </div>

    <!-- Stats -->
    <div id="holographic-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> The <b>left panel</b> shows concept vectors projected into 2D.
        <span style="color:rgba(148,163,184,0.5);">Faded circles</span> are the <b>original</b> (undamaged) positions;
        <b>solid markers</b> are the positions after randomly zeroing out dimensions.
        The <b>right panel</b> is the pairwise cosine similarity matrix — the "fingerprint" of the space's relational structure.
        As you increase damage, individual vectors drift (like a scratched hologram losing sharpness),
        but the <b>overall pattern of the matrix is preserved</b> — similar concepts stay similar, dissimilar ones stay dissimilar.
        This is <b>holographic graceful degradation</b>: information is distributed across all dimensions,
        so partial destruction reduces resolution without erasing content.
        Compare this to a <b>lookup table</b>, where deleting an entry destroys the information completely.
    </div>
</section>

<div class="md">
## Voronoi Cells: The Territories of Meaning

Imagine the embedding space as a vast, empty continent. Each token the model knows — every word, subword, and symbol — plants a flag at its vector position. Now ask: **for every possible point in the space, which token's flag is closest?** The answer carves the entire space into territories — one per token — where every point inside a territory is closer to that territory's token than to any other. These territories are called **Voronoi cells**.

### What Is a Voronoi Diagram?

Formally, given a set of seed points $S = \{s_1, s_2, \ldots, s_n\}$, the Voronoi cell for seed $s_i$ is the set of all points closer to $s_i$ than to any other seed:

$$ V(s_i) = \{ \mathbf{x} \in \mathbb{R}^d \mid \| \mathbf{x} - s_i \| \leq \| \mathbf{x} - s_j \| \;\; \forall j \neq i \} $$

The boundaries between cells are **equidistant surfaces** — the set of points exactly halfway between two neighboring seeds. In 2D, these boundaries are line segments; in 768 dimensions, they are high-dimensional hyperplanes.

This is not just a mathematical curiosity. The Voronoi tessellation is **mathematically equivalent to the decision boundary of a nearest-neighbor classifier**: any new point that lands in a cell gets assigned to that cell's token. When an LLM's decoder maps a hidden state back to a token, it is essentially asking "which token's Voronoi cell does this vector fall into?"

### Why This Matters for LLMs

* **Decoding as territory lookup:** The final layer of a language model computes a score for each token in the vocabulary. The token with the highest score wins. Geometrically, this is equivalent to finding which Voronoi cell the output vector falls into — the cell boundaries *are* the decision boundaries.
* **Cell size encodes frequency:** Common words like "the" or "is" tend to have **large Voronoi cells** — they occupy more of the space, making them easier to "land in." Rare words like "defenestration" have tiny cells, requiring the model to aim precisely.
* **Neighbors reveal semantics:** The tokens whose Voronoi cells share a boundary are **semantic or functional neighbors**. "Dog" and "Cat" share a long boundary; "Dog" and "Quantum" do not.
* **Interpolation risks:** When you average two token vectors (e.g., for smoothing or mixing), the result might land in a *third* token's Voronoi cell entirely — a concept that is neither of the two you intended. The Voronoi structure explains why naive interpolation in embedding space can produce surprising results.

Below, you can explore a 2D Voronoi diagram that simulates how an embedding space is partitioned into token territories. **Drag tokens** to see how the boundaries shift in real time. **Click anywhere** in empty space to see which token "owns" that point and how far it is from the boundary. Toggle between different example configurations to see how the geometry changes for different semantic neighborhoods.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <div>
            <canvas id="canvas-voronoi" style="width: 100%; height: 540px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; cursor: crosshair;"></canvas>
        </div>
        <div id="voronoi-info-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">📍 Click anywhere on the map</div>
            <div id="voronoi-click-info">
                Click a point in the space to see which token "owns" it, how far it is from the nearest boundary, and who the neighboring territories are.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">🏷️ Token Legend</div>
            <div id="voronoi-legend"></div>
        </div>
    </div>

    <!-- Preset selector -->
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Preset:</span>
        <button onclick="loadVoronoiPreset('animals')" class="voronoi-preset-btn" id="vp-animals" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🐾 Animals</button>
        <button onclick="loadVoronoiPreset('emotions')" class="voronoi-preset-btn" id="vp-emotions" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">😊 Emotions</button>
        <button onclick="loadVoronoiPreset('code')" class="voronoi-preset-btn" id="vp-code" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">💻 Code Tokens</button>
        <button onclick="loadVoronoiPreset('mixed')" class="voronoi-preset-btn" id="vp-mixed" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🌀 Mixed</button>
    </div>

    <!-- Toggles -->
    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="voronoi-show-gradient" checked onchange="renderVoronoi()"> Distance gradient
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="voronoi-show-boundaries" checked onchange="renderVoronoi()"> Cell boundaries
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="voronoi-show-labels" checked onchange="renderVoronoi()"> Labels
        </label>
    </div>

    <!-- Stats -->
    <div id="voronoi-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> Each <b>colored region</b> is a <b>Voronoi cell</b> — the territory of a single token.
        Every point inside a cell is closer to that cell's token than to any other.
        The <b>color gradient</b> shows distance from the cell's seed: darker near the center (confident),
        lighter near the edges (ambiguous — close to a decision boundary).
        <b>White lines</b> are the cell boundaries — the exact points equidistant between two tokens.
        <b>Drag any token</b> to see how the entire partition restructures in real time.
        <b>Click empty space</b> to query which token owns that point.
        Notice how <b>semantically similar tokens</b> (e.g., "Dog" and "Cat") share long boundaries,
        while dissimilar ones (e.g., "Dog" and "Quantum") may not share a boundary at all.
    </div>
</section>

<div class="md">
## Isosurfaces of Probability: Truth Tunnels

Imagine wrapping a "shell" around every region of the embedding space where the model considers a token or sequence **plausible**. These shells are **isosurfaces** — surfaces of equal probability, like the isobars on a weather map that connect points of equal atmospheric pressure. Inside the shell: plausible continuations. Outside: nonsense.

### From Weather Maps to Thought Corridors

In meteorology, high-pressure zones are broad, stable regions; low-pressure zones are tight, intense. The embedding space works the same way:

* **Open fields:** At the start of a conversation, the probability isosurface is a wide, blob-like region — almost anything could come next. "The" could be followed by thousands of plausible tokens. The isosurface is fat and round.
* **Narrow tunnels:** As the context grows and the argument tightens, the isosurface **collapses into a narrow corridor** — a "truth tunnel." After "The capital of France is," the plausible region shrinks to a tiny pocket around "Paris." The isosurface is now a tight tube.
* **Branching points:** At moments of ambiguity ("The bank of the ___"), the tunnel **forks** — one branch leads toward "river" (geography), another toward "account" (finance). The isosurface develops a bifurcation, like a blood vessel splitting in two.

### The Tube System in Hyperspace

If you could visualize the path of a full conversation through the embedding space, you would see something like a **branching tube system**: wide at the start, narrowing as context accumulates, occasionally forking at ambiguous decision points, and sometimes opening back up when the topic shifts. The walls of the tube are the isosurface — the boundary between "the model considers this plausible" and "the model considers this nonsense."

$$ \mathcal{S}_\tau = \{ \mathbf{x} \in \mathbb{R}^d \mid P(\mathbf{x} \mid \text{context}) = \tau \} $$

where $\tau$ is the probability threshold. A high $\tau$ gives a tight tube (only the most likely continuations); a low $\tau$ gives a wider tube (including less likely but still plausible options).

This is directly related to **temperature** in LLM sampling:
* **Low temperature** ($T \to 0$): The tube collapses to a thin wire — only the single most likely token survives. Deterministic, but rigid.
* **High temperature** ($T \to \infty$): The tube inflates to fill the space — everything becomes equally plausible. Creative, but incoherent.
* **The sweet spot** ($T \approx 0.7\text{–}1.0$): The tube is wide enough for variety but narrow enough for coherence. This is where interesting text lives.

Below, you can explore this interactively. A simulated sentence unfolds step by step through the embedding space. At each step, the **probability isosurface** is drawn as a glowing envelope around the trajectory. Watch how the tunnel **narrows** as context constrains the possibilities, **forks** at ambiguous tokens, and responds to the **temperature slider** in real time.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <canvas id="canvas-isosurface" style="width: 100%; height: 560px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b; cursor: default;"></canvas>
        <div id="iso-sentence-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 560px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">📝 Sentence Builder</div>
            <div id="iso-sentence-display" style="margin-bottom: 12px; font-size: 0.95em; line-height: 1.8;"></div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">🔮 Current Step Info</div>
            <div id="iso-step-info"></div>
        </div>
    </div>

    <!-- Controls -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Temperature:</b>
            <input type="range" id="iso-temperature" min="0.05" max="2.0" step="0.05" value="0.8" style="width: 200px; vertical-align: middle;">
            <span id="iso-temp-val" style="font-weight: bold; color: #f59e0b;">0.80</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Step:</b>
            <input type="range" id="iso-step-slider" min="0" max="10" step="1" value="0" style="width: 200px; vertical-align: middle;">
            <span id="iso-step-val" style="font-weight: bold; color: #8b5cf6;">0 / 10</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Sentence:</span>
        <button onclick="loadIsoSentence('capital')" class="iso-preset-btn" id="iso-capital" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🏛️ Capital</button>
        <button onclick="loadIsoSentence('story')" class="iso-preset-btn" id="iso-story" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">📖 Story</button>
        <button onclick="loadIsoSentence('code')" class="iso-preset-btn" id="iso-code" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">💻 Code</button>
        <button onclick="loadIsoSentence('ambiguous')" class="iso-preset-btn" id="iso-ambiguous" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🔀 Ambiguous</button>
    </div>

    <!-- Stats -->
    <div id="iso-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> The dark canvas represents the embedding space.
        The <span style="color:#60a5fa; font-weight:bold;">blue trajectory</span> is the path of the hidden state as the sentence unfolds token by token.
        The <span style="color:rgba(139,92,246,0.5); font-weight:bold;">glowing envelope</span> around the path is the <b>probability isosurface</b> — the region of plausible next tokens at each step.
        <b>Wide envelopes</b> = many plausible continuations (high entropy).
        <b>Narrow envelopes</b> = few plausible continuations (low entropy, high certainty).
        <b>Forks</b> appear at ambiguous decision points.
        The <b>Temperature slider</b> inflates or deflates the entire tube system.
        Use the <b>Step slider</b> to advance the sentence one token at a time and watch the tunnel evolve.
    </div>
</section>

<div class="md">
## High-Dimensional Holes: The Swiss Cheese of Meaning

The embedding space is not a solid block of uniformly packed vectors. It is more like **Swiss cheese** — riddled with holes, voids, and cavities where no token ever lives. These are not random gaps; they are structurally meaningful absences. Researchers use a technique from algebraic topology called **Persistent Homology** to detect and measure these holes systematically.

### What Is Persistent Homology?

Persistent Homology is an algebraic method for detecting topological features — connected components, loops, cavities — in discrete point cloud data. The core idea is beautifully simple:

1. **Start with your data points** (token vectors in the embedding space).
2. **Grow a ball** around each point, starting at radius $r = 0$.
3. **As $r$ increases**, balls begin to overlap, forming connections. At some radius, a loop appears — a ring of connected points surrounding an empty region. At a larger radius, the loop might fill in and disappear.
4. **Track the birth and death** of each topological feature. Features that persist across a wide range of radii are "real" structure; features that flicker in and out are noise.

The result is a **persistence diagram**: a scatter plot where each point represents a topological feature (a hole), with its birth radius on one axis and death radius on the other. Points far from the diagonal represent **robust, persistent holes** — genuine voids in the data.

$$ \text{Persistence}(h) = r_{\text{death}}(h) - r_{\text{birth}}(h) $$

A feature with high persistence is a real structural void, not an artifact of sparse sampling.

### What the Holes Mean

The holes in the embedding space are not just geometric curiosities. They mark regions where **no coherent concept exists** — logical impossibilities, semantic contradictions, or ideas that human language simply never expresses:

* **Semantic voids:** There is no concept that is simultaneously "very large" and "microscopic," or "definitely true" and "definitely false." The space between these contradictory directions is empty — a topological hole.
* **The negative image of knowledge:** If the filled regions of the space represent everything the model *can* express, the holes represent everything it *cannot*. They are the **negative imprint of our world-understanding** — the shape of the unsayable.
* **Forbidden interpolations:** These holes explain why you can't smoothly interpolate between certain concepts. The path from "alive" to "dead" doesn't pass through a smooth gradient — it passes through a void, because there is no coherent concept "half-alive-half-dead" (at least not in the way the model has learned to organize meaning).
* **Structural constraints:** Some holes reflect grammatical or logical constraints. There is no token that functions simultaneously as a noun, verb, adjective, and preposition — that region of the space is necessarily empty.

The visualization below lets you explore this. A 2D point cloud represents token vectors. As you increase the **radius parameter $r$**, connections form between nearby points, loops appear around empty regions, and the persistent homology algorithm detects and highlights the **holes** — the voids that persist across a wide range of radii. The **persistence diagram** on the right separates real structure from noise.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; margin-bottom: 15px;">
        <div>
            <div style="font-family: sans-serif; font-size: 0.8em; color: #64748b; text-align: center; margin-bottom: 4px; font-weight: bold;">Embedding Space — Simplicial Complex</div>
            <canvas id="canvas-homology-space" style="width: 100%; height: 500px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;"></canvas>
        </div>
        <div>
            <div style="font-family: sans-serif; font-size: 0.8em; color: #64748b; text-align: center; margin-bottom: 4px; font-weight: bold;">Persistence Diagram</div>
            <canvas id="canvas-homology-persistence" style="width: 100%; height: 500px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;"></canvas>
        </div>
    </div>

    <!-- Radius slider -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Connection Radius (r):</b>
            <input type="range" id="homology-radius" min="0" max="1" step="0.005" value="0" style="width: 280px; vertical-align: middle;">
            <span id="homology-radius-val" style="font-weight: bold; color: #8b5cf6;">0.000</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Layout:</span>
        <button onclick="loadHomologyPreset('swiss')" class="homology-preset-btn" id="hp-swiss" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🧀 Swiss Cheese</button>
        <button onclick="loadHomologyPreset('ring')" class="homology-preset-btn" id="hp-ring" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">⭕ Ring</button>
        <button onclick="loadHomologyPreset('clusters')" class="homology-preset-btn" id="hp-clusters" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🔵 Clusters + Void</button>
        <button onclick="loadHomologyPreset('figure8')" class="homology-preset-btn" id="hp-figure8" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">♾️ Figure-8</button>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="homology-show-balls" checked onchange="renderHomology()"> Show radius balls
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="homology-show-triangles" checked onchange="renderHomology()"> Show filled triangles
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="homology-show-holes" checked onchange="renderHomology()"> Highlight holes
        </label>
        <button onclick="animateHomologyRadius()" id="homology-animate-btn" style="background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">▶ Animate</button>
    </div>

    <!-- Stats -->
    <div id="homology-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> The <b>left panel</b> shows token vectors as points in a 2D embedding space.
        As you increase the <b>radius $r$</b>, each point grows a
        <span style="color:rgba(96,165,250,0.4); font-weight:bold;">blue ball</span>.
        When two balls overlap, an <span style="color:#60a5fa; font-weight:bold;">edge</span> connects them.
        When three mutually connected points form a triangle, it is
        <span style="color:rgba(139,92,246,0.2); font-weight:bold;">filled in purple</span>.
        <span style="color:#f59e0b; font-weight:bold;">Yellow highlighted loops</span> mark detected <b>topological holes</b> —
        regions enclosed by edges but <b>not filled</b> by triangles. These are the voids.
        The <b>right panel</b> is the <b>persistence diagram</b>: each dot is a hole,
        plotted by its birth radius (x) and death radius (y).
        Dots far from the <span style="color:#94a3b8;">diagonal</span> are <b>persistent, real holes</b>;
        dots near the diagonal are noise. The <span style="color:#ef4444; font-weight:bold;">red dashed line</span>
        shows the current radius $r$ — features below it have been born, features to its left have died.
    </div>
</section>

<div class="md">
## The Time Axis: How Models Discover History's Arrow

One of the most elegant emergent properties of embedding spaces is how they encode **time**. Nobody tells the model that 1950 comes before 1951, or that the Renaissance preceded the Industrial Revolution. Yet when you extract the embedding vectors for historical dates and events and project them into lower dimensions, something remarkable appears: they form a **near-perfect helix** — a spiral curve winding through the space, with time flowing smoothly along its length.

### The Emergent Timeline

The model discovers the linearity of time not because anyone labeled a "time axis," but because the **statistical neighborhoods** of temporal tokens are geometrically constrained:

* "1950" appears in similar contexts to "1949" and "1951" — so their vectors are close.
* "1950" appears in very different contexts from "1066" — so their vectors are far apart.
* The chain of nearest-neighbor relationships (1949 → 1950 → 1951 → 1952 → …) traces out a **continuous curve** through the space.

But why a **helix** rather than a straight line? Because time has both **linear** and **cyclical** structure. Years progress forward (linear), but seasons, decades, and cultural periods repeat patterns (cyclical). The helix captures both: forward motion along the helix axis encodes linear progression, while the rotation around the axis encodes cyclical recurrence — the "feel" of a decade, the rhythm of centuries.

$$ \mathbf{v}(t) \approx \mathbf{a} \cdot t + r \cdot \cos(\omega t) \cdot \hat{e}_1 + r \cdot \sin(\omega t) \cdot \hat{e}_2 $$

where $\mathbf{a}$ is the linear time direction, $r$ is the helix radius (strength of cyclical patterns), and $\omega$ controls how tightly the helix winds.

### Why This Is Mind-Blowing

The model has **no concept of time**. It has never experienced duration, never watched a clock, never read a calendar with understanding. It has only observed that certain tokens tend to appear near certain other tokens. And from this purely statistical signal, it has reconstructed a geometric structure that mirrors the actual topology of time — linear, directional, and subtly cyclical. The arrow of time is not programmed; it **emerges** from the geometry of language.

This generalizes beyond dates. Any ordered or sequential concept — sizes ("tiny" → "small" → "medium" → "large" → "huge"), temperatures, emotional intensities — tends to form smooth curves in the embedding space. The model discovers **ordinality** from co-occurrence statistics alone.

Below, you can explore this. A set of historical years and events are plotted in a simulated 3D embedding space. The **helix structure** emerges as you watch the points arrange themselves. You can rotate the view, toggle between different time ranges, and switch between the helical (3D) and flattened (2D) projections to see how the cyclical component appears and disappears.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <canvas id="canvas-time-helix" style="width: 100%; height: 560px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b; cursor: grab;"></canvas>
        <div id="time-helix-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 560px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">🕰️ Time Helix Explorer</div>
            <div id="time-helix-info">
                Hover over any point to see the year and associated historical event. The helix structure emerges from statistical co-occurrence alone — no one told the model about time.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">📊 Helix Properties</div>
            <div id="time-helix-properties"></div>
        </div>
    </div>

    <!-- Controls -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Helix Tightness (ω):</b>
            <input type="range" id="time-helix-omega" min="0" max="6" step="0.1" value="2.5" style="width: 180px; vertical-align: middle;">
            <span id="time-helix-omega-val" style="font-weight: bold; color: #8b5cf6;">2.5</span>
        </label>
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Cyclical Strength (r):</b>
            <input type="range" id="time-helix-radius" min="0" max="1" step="0.01" value="0.6" style="width: 180px; vertical-align: middle;">
            <span id="time-helix-radius-val" style="font-weight: bold; color: #f59e0b;">0.60</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Era:</span>
        <button onclick="loadTimeRange('modern')" class="time-preset-btn" id="tp-modern" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🏙️ Modern (1900–2025)</button>
        <button onclick="loadTimeRange('centuries')" class="time-preset-btn" id="tp-centuries" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🏰 Centuries (1000–2000)</button>
        <button onclick="loadTimeRange('deep')" class="time-preset-btn" id="tp-deep" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🏛️ Deep History (500 BC–2000)</button>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="time-show-connections" checked onchange="renderTimeHelix()"> Show timeline thread
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="time-show-events" checked onchange="renderTimeHelix()"> Show event labels
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="time-show-shadow" checked onchange="renderTimeHelix()"> Show 2D shadow
        </label>
    </div>

    <!-- Stats -->
    <div id="time-helix-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> Each <b>dot</b> is a year's embedding vector, projected into 3D.
        The <span style="color:#60a5fa; font-weight:bold;">blue thread</span> connects consecutive years, revealing the <b>helix structure</b>.
        The <b>forward axis</b> (left → right) encodes <b>linear time progression</b>.
        The <b>rotation</b> around this axis encodes <b>cyclical patterns</b> — decades, centuries, cultural periods.
        The <span style="color:rgba(148,163,184,0.3); font-weight:bold;">gray shadow</span> on the floor is the <b>2D projection</b> — what you'd see if you collapsed the cyclical dimension.
        Use <b>Cyclical Strength</b> to flatten the helix into a line (r=0) or amplify the spiral (r=1).
        Use <b>Helix Tightness</b> to control how many "loops per century" the spiral makes.
        <b>Drag</b> to rotate the 3D view. <span style="color:#f59e0b; font-weight:bold;">Gold markers</span> highlight major historical events.
    </div>
</section>

<div class="md">
## Polytope Hulls: The Boundaries of the Conceivable

In geometry, a **polytope** is the high-dimensional generalization of a polygon. In 2D, it's a polygon; in 3D, a polyhedron; in 768 dimensions, it's a shape with thousands of facets that no human can visualize directly. Formally, a polytope can be defined as the **convex hull** of a finite set of points — the smallest convex body that encloses all of them.

Now apply this to the embedding space. Take every concept the model associates with "morally good" — kindness, honesty, generosity, courage, compassion — and compute their convex hull. You get a polytope: the **geometric territory of moral goodness** in the embedding space. Do the same for "morally bad" — cruelty, deception, greed, cowardice — and you get a second polytope.

### Where Polytopes Overlap: The Geometry of Dilemmas

The fascinating part is what happens **between** these polytopes:

* **Wide separation:** Where the "good" and "bad" hulls are far apart, the model is **morally decisive**. "Kindness" is unambiguously inside the good hull and far from the bad one. No dilemma here.
* **Overlap zone:** Where the hulls **interpenetrate**, you find concepts that the model cannot cleanly classify — **moral dilemmas**. "Mercy killing," "white lies," "civil disobedience," "necessary violence" — these concepts live in the geometric intersection of good and bad. The overlap *is* the dilemma, rendered as geometry.
* **Boundary zone:** Concepts near the surface of a hull but not deep inside it are **borderline cases** — the model is uncertain. The distance from a point to the hull surface is a geometric measure of moral confidence.

This generalizes far beyond morality. You can compute polytope hulls for any pair of categories:
* **"Science" vs. "Pseudoscience"** — the overlap contains contested concepts like certain alternative medicine claims.
* **"Formal" vs. "Informal" language** — the overlap contains registers that shift depending on context.
* **"Alive" vs. "Dead"** — the overlap contains viruses, dormant seeds, philosophical zombies.

$$ \text{Dilemma}(A, B) = \text{Hull}(A) \cap \text{Hull}(B) $$

The volume of the intersection is a **geometric measure of conceptual ambiguity** between two categories.

Below, you can explore this interactively. Two conceptual categories are represented as polytope hulls (convex envelopes) in 2D. **Drag individual concept points** to reshape the hulls. Watch the **overlap zone** — the geometric dilemma — grow and shrink in real time. Switch between different category pairs to see how the model's "moral geometry" differs from its "linguistic geometry" or its "ontological geometry."
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <canvas id="canvas-polytope" style="width: 100%; height: 560px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; cursor: crosshair;"></canvas>
        <div id="polytope-info-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 560px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">⬡ Polytope Explorer</div>
            <div id="polytope-click-info">
                Click anywhere in the space to measure its distance to each hull and see whether it falls inside, outside, or in the <b>overlap zone</b>.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">🏷️ Legend</div>
            <div id="polytope-legend"></div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">⚡ Dilemma Concepts</div>
            <div id="polytope-dilemma-list" style="font-size: 0.85em;"></div>
        </div>
    </div>

    <!-- Preset selector -->
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Category Pair:</span>
        <button onclick="loadPolytopePreset('moral')" class="polytope-preset-btn" id="pp-moral" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">⚖️ Good vs. Evil</button>
        <button onclick="loadPolytopePreset('science')" class="polytope-preset-btn" id="pp-science" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🔬 Science vs. Pseudo</button>
        <button onclick="loadPolytopePreset('alive')" class="polytope-preset-btn" id="pp-alive" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🧬 Alive vs. Dead</button>
        <button onclick="loadPolytopePreset('formal')" class="polytope-preset-btn" id="pp-formal" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">📝 Formal vs. Casual</button>
    </div>

    <!-- Toggles -->
    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="polytope-show-hulls" checked onchange="renderPolytope()"> Show hulls
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="polytope-show-overlap" checked onchange="renderPolytope()"> Highlight overlap
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="polytope-show-labels" checked onchange="renderPolytope()"> Labels
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="polytope-show-dilemma-points" checked onchange="renderPolytope()"> Dilemma markers
        </label>
    </div>

    <!-- Stats -->
    <div id="polytope-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> Two <b>convex hulls</b> (polytopes) represent the geometric territories of two conceptual categories.
        The <span style="color:#3b82f6; font-weight:bold;">blue hull</span> encloses one category;
        the <span style="color:#ef4444; font-weight:bold;">red hull</span> encloses the other.
        Where they <span style="color:#a855f7; font-weight:bold;">overlap (purple zone)</span>, the model cannot cleanly separate the categories — this is the <b>geometric dilemma</b>.
        <span style="color:#f59e0b; font-weight:bold;">Gold diamond markers</span> are concepts that live in or near the overlap — the ambiguous, contested, or paradoxical ideas.
        <b>Drag any concept point</b> to reshape the hulls in real time.
        <b>Click empty space</b> to probe which hull(s) contain that point.
        The <b>overlap area</b> is a direct geometric measure of how much ambiguity exists between the two categories.
    </div>
</section>

<div class="md">
## Vector Rotations as Grammar Operators

One of the most surprising geometric discoveries in embedding spaces is that grammatical transformations — like changing a verb from present tense to past tense — are not **translations** (shifting a vector in a direction) but **rotations** (spinning a vector around an axis). Grammar is not a push; it is a turn.

### The Carousel of Tense

Take a cloud of present-tense verb vectors: "run," "eat," "write," "speak," "build." They form a cluster in the embedding space. Now take their past-tense counterparts: "ran," "ate," "wrote," "spoke," "built." These form a second cluster. The relationship between the two clusters is not a simple offset vector (like the famous "king − man + woman = queen" analogy). Instead, the entire cloud has been **rotated** by a consistent angle around a fixed axis in the high-dimensional space.

$$ \mathbf{v}_{\text{past}} \approx \mathbf{R}_{\text{tense}} \cdot \mathbf{v}_{\text{present}} $$

where $\mathbf{R}_{\text{tense}}$ is a **rotation matrix** — the same matrix applied to every verb. The model has discovered that tense is a **rotational symmetry** of language.

### Why Rotation, Not Translation?

This makes deep geometric sense:

* **Tense is cyclical:** Languages often treat time as having a cyclical quality — past patterns repeat, future expectations echo past experiences. A rotation naturally encodes cyclical structure, while a translation implies a one-way shift.
* **Meaning preservation:** A rotation preserves the **magnitude** (length) of a vector — the "importance" or "activation strength" of the concept doesn't change when you change its tense. Only its **direction** changes. "Run" and "ran" are equally "verb-like"; they just point in slightly different directions.
* **Composability:** Rotations compose cleanly. Applying the tense rotation twice doesn't send you to nonsense — it might approximate another grammatical form (e.g., past → pluperfect). Translations, by contrast, would drift further and further from meaningful regions.

This generalizes beyond tense. Other grammatical operations that behave as rotations include:

* **Singular → Plural** (nouns rotate by a consistent angle)
* **Active → Passive** voice
* **Positive → Comparative → Superlative** (adjectives)
* **Nominalization** (verb → noun: "discover" → "discovery")

The embedding space is, in a sense, a **grammar carousel**: each grammatical transformation is a specific rotation, and the model has learned these rotations purely from statistical co-occurrence — nobody programmed the rotation matrices.

Below, you can explore this interactively. A cloud of verbs is shown in their present-tense positions. Apply the **tense rotation** to watch the entire cloud spin to its past-tense configuration. Adjust the **rotation angle** to see how the transformation works, and toggle between different grammatical operations to see that each one is a distinct rotation around a different axis.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; margin-bottom: 15px;">
        <canvas id="canvas-grammar-rotation" style="width: 100%; height: 560px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;"></canvas>
        <div id="grammar-rot-panel" style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; font-family: sans-serif; font-size: 0.85em; color: #475569; line-height: 1.7; max-height: 560px; overflow-y: auto;">
            <div style="font-weight: bold; font-size: 1em; color: #1e293b; margin-bottom: 8px;">🎠 Grammar Carousel</div>
            <div id="grammar-rot-info">
                Watch how grammatical transformations rotate entire word clouds around fixed axes in the embedding space. Each transformation is a consistent angular displacement.
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 0.9em; color: #1e293b; margin-bottom: 6px;">📋 Word Pairs</div>
            <div id="grammar-rot-pairs"></div>
        </div>
    </div>

    <!-- Controls -->
    <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.9em; color: #475569;">
            <b>Rotation Progress:</b>
            <input type="range" id="grammar-rot-angle" min="0" max="1" step="0.005" value="0" style="width: 260px; vertical-align: middle;">
            <span id="grammar-rot-angle-val" style="font-weight: bold; color: #8b5cf6;">0%</span>
        </label>
    </div>

    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <span style="font-family: sans-serif; font-size: 0.9em; color: #475569; font-weight: bold;">Operation:</span>
        <button onclick="loadGrammarOp('tense')" class="grammar-op-btn" id="go-tense" style="background: #8b5cf6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">⏰ Present → Past</button>
        <button onclick="loadGrammarOp('plural')" class="grammar-op-btn" id="go-plural" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">📦 Singular → Plural</button>
        <button onclick="loadGrammarOp('comparative')" class="grammar-op-btn" id="go-comparative" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">📏 Positive → Comparative</button>
        <button onclick="loadGrammarOp('nominalize')" class="grammar-op-btn" id="go-nominalize" style="background: #64748b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">🔄 Verb → Noun</button>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="grammar-show-arcs" checked onchange="renderGrammarRotation()"> Show rotation arcs
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="grammar-show-axis" checked onchange="renderGrammarRotation()"> Show rotation axis
        </label>
        <label style="font-family: sans-serif; font-size: 0.85em; color: #475569; cursor: pointer;">
            <input type="checkbox" id="grammar-show-trails" checked onchange="renderGrammarRotation()"> Show trails
        </label>
        <button onclick="animateGrammarRotation()" id="grammar-animate-btn" style="background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold;">▶ Animate</button>
    </div>

    <!-- Stats -->
    <div id="grammar-rot-stats" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; max-width: 800px; margin: 0 auto 15px auto;"></div>

    <!-- Description -->
    <div style="padding: 12px 16px; font-size: 0.85em; color: #475569; line-height: 1.6; margin-top: 12px;">
        <b>What you're seeing:</b> Each <span style="color:#60a5fa; font-weight:bold;">blue dot</span> is a word in its <b>base form</b> (e.g., present tense).
        As you drag the <b>Rotation Progress</b> slider, the entire cloud rotates around a
        <span style="color:#f59e0b; font-weight:bold;">golden axis</span>, and each word smoothly transforms into its
        <span style="color:#f472b6; font-weight:bold;">pink target form</span> (e.g., past tense).
        The <span style="color:rgba(139,92,246,0.4); font-weight:bold;">purple arcs</span> trace the rotation path of each word.
        Notice that <b>all words rotate by the same angle</b> — the grammatical transformation is a single, consistent rotation applied uniformly.
        The <b>vector magnitudes are preserved</b> (dots stay the same distance from the origin) — only the direction changes.
        This is why grammar is a <b>carousel</b>, not a conveyor belt.
    </div>
</section>
