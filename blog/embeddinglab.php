<?php include_once("functions.php"); ?>

<div class="md">
## Embeddings: The Geometry of Meaning
<div style="padding: 15px; border-left: 5px solid #2e7d32; background-color: #f9f9f9; font-style: italic; margin-bottom: 20px;">
  "The meaning of a word is its use in the language." <br>
  — Ludwig Wittgenstein, Philosophical Investigations
</div>

In the architecture of a Transformer, a word possesses no intrinsic "soul" or static dictionary definition. Instead, its identity is defined entirely by its context—its **use**. This philosophical principle is operationalized through a high-dimensional **Embedding Space**, where semantic concepts are mapped as coordinates in a continuous geometric manifold.

### 1D Linear Scales
To visualize this, consider a simple **1D Embedding Space** representing temperature. We assign words a single numerical coordinate on an axis:
* **Freezing**: $-30$
* **Cold**: $5$
* **Warm**: $35$
* **Boiling**: $100$

In this one-dimensional world, "Cold" is mathematically proximal to "Frosty" but distant from "Boiling".
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
        <div>
            <input type="text" id="input-1d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., Cold + Warm" onkeyup="if(event.key==='Enter') calcEvo('1d')">
            <div id="res-1d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #3b82f6;">Match: -</div>
        </div>
        <div id="plot-1d" style="height: 180px; background: #fff; border-radius: 8px;"></div>
    </div>

<div class="embedding-table-container" id="editor-1d" data-space="1d"></div>
</section>

<div class="md">
### 2 dimensions

Human language is far too nuanced for a single axis. To capture independent features such as gender, power, or biological species, we project tokens into a **vector space** with multiple dimensions. In this space, each dimension represents a latent semantic feature discovered by the model during training.

Because these positions are derived from logical relationships in data, the space itself becomes "computable". We can perform algebraic operations on these vectors to navigate human concepts:

$$ \vec{v}_{\text{King}} - \vec{v}_{\text{Man}} + \vec{v}_{\text{Woman}} \approx \vec{v}_{\text{Queen}} $$
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
        <div>
            <input type="text" id="input-2d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., Man + Power" onkeyup="if(event.key==='Enter') calcEvo('2d')">
            <div id="res-2d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #10b981;">Match: -</div>
        </div>
        <div id="plot-2d" style="height: 400px; background: #fff; border-radius: 8px;"></div>
    </div>
<div class="embedding-table-container" id="editor-2d" data-space="2d"></div>
</section>

<div class="md">
### The Limits of Visualization
While **3 dimensions** are the maximum we can easily visualize in a graph, modern LLMs operate in much higher dimensionality—often 768, 1,536, or more. Each added dimension allows the model to capture more granular distinctions between concepts that might appear identical in lower-dimensional projections.
</div>

<section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
        <div>
            <input type="text" id="input-3d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., King + Animal" onkeyup="if(event.key==='Enter') calcEvo('3d')">
            <div id="res-3d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #6366f1;">Match: -</div>
        </div>
        <div id="plot-3d" style="height: 500px; background: #fff; border-radius: 8px;"></div>
    </div>
<div class="embedding-table-container" id="editor-3d" data-space="3d"></div>
</section>

<div class="md">
### Quantifying Semantic Proximity
In a vector space, "meaning" is a function of distance. If two words appear in similar linguistic environments, their vectors converge toward the same neighborhood.

#### Euclidean Distance
To determine the degree of similarity between two vectors $\mathbf{A}$ and $\mathbf{B}$ in $n$-dimensional space, we can calculate the straight-line gap known as **Euclidean Distance**:

$$ d(\mathbf{A}, \mathbf{B}) = \sqrt{\sum_{i=1}^{n} (B_i - A_i)^2} $$

#### Cosine Similarity
While Euclidean distance measures the physical gap between points, modern LLMs often rely on **Cosine Similarity**. This measures the cosine of the angle $\theta$ between two vectors, determining their directional alignment regardless of their magnitude. A similarity of 1 means the vectors point in the same direction.

$$ \text{similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} $$

</div>

<div class="md">
## The Semantic Manifold

In a 1,536-dimensional model, "meaning" isn't a static definition; it's a **positional relationship**. Imagine a direction in space that represents "Royalty." Moving a vector in that direction transforms "Man" into "King." 
The **red arc** below visualizes the **Cosine Distance**—the "conceptual shift" between two points. The **dashed line** is the **Euclidean Distance**, or the "energy" required to move from one token to another. In the geometry of meaning, words that appear in similar contexts are pulled together by gravity, forming clusters that represent human knowledge.
</div>

<section style="width: 100%; padding: 20px; margin-bottom: 40px; box-sizing: border-box;">
    <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; width: 100%;">
        <div id="plot-comparison-3d" style="height: 500px; background: #fff; border-radius: 8px; width: 100%;"></div>
        
        <div id="comparison-stats-3d" style="width: 100%;"></div>
    </div>
</section>

<div class="md">
### The Illusion of Interpretability
It is tempting to label specific axes as "Gender," "Power," or "Temperature," but this is often a human-imposed simplification. In modern LLMs, dimensions are **latent features**—mathematical patterns discovered through statistical co-occurrence rather than human-defined categories.

While we can find "directions" in the vector space that correlate with human concepts, most of the 768+ dimensions do not have a name in any human language.
* **Meaning is Simulated:** The computer does not "understand" what a King is; it only understands that the token "King" consistently appears in specific geometric relationships with other tokens.
* **No Inherent Soul:** The coordinates are products of linear algebra, not internal experience. Meaning is a human concept we project onto the model's output; the machine is simply navigating a continuous geometric manifold.

### Rotational Invariance in Embedding Spaces

In representation learning, an embedding space is considered <b>rotationally invariant</b> if the semantic relationships (measured by dot products or Euclidean distances) between vectors remain unchanged under orthogonal transformations. Mathematically, for any rotation matrix $R$, the identity $(R\vec{u}) \cdot (R\vec{v}) = \vec{u} \cdot \vec{v}$ holds. This visualization shows a subspace (the cube) being transformed within a static 3D coordinate system. Despite the change in global coordinates, the "shape" of the data—and thus the information it encodes—remains perfectly preserved. This is because what counts is not the concrete values of an embedding, but it's relations to other points in the embedding space alone.
</div>

<div id="embedding-invariant-plot"></div>
