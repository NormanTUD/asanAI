<?php include_once("functions.php"); ?>

<div class="md">

## The Geometry of Meaning: Word Embeddings
<div style="padding: 15px; border-left: 5px solid #2e7d32; background-color: #f9f9f9; font-style: italic; margin-bottom: 20px;">
  "The meaning of a word is its use in the language." <br>
  — Ludwig Wittgenstein, Philosophical Investigations
</div>

In the architecture of a Transformer, a word possesses no intrinsic "soul" or static dictionary definition. Instead, its identity is defined entirely by its context—its **use**. This philosophical principle is operationalized through a high-dimensional **Embedding Space**, where semantic concepts are mapped as coordinates in a continuous geometric manifold.

### From 1D Linear Scales to Multi-Dimensional Manifolds
To visualize this, consider a simple **1D Embedding Space** representing temperature. We assign words a single numerical coordinate on an axis:
* **Freezing**: $-30$
* **Cold**: $5$
* **Warm**: $35$
* **Boiling**: $100$

In this one-dimensional world, "Cold" is mathematically proximal to "Warm" but distant from "Boiling". However, human language is far too nuanced for a single axis. To capture independent features such as gender, power, or biological species, we project tokens into a **vector space** with hundreds of dimensions. In this space, each dimension represents a latent semantic feature discovered by the model during training.


### Quantifying Semantic Proximity
In a vector space, "meaning" is a function of distance. If two words appear in similar linguistic environments, the model’s training process forces their vectors to converge toward the same neighborhood. 

To determine the degree of similarity between two vectors $\mathbf{A}$ and $\mathbf{B}$ in $n$-dimensional space, we calculate the **Euclidean Distance**:

$$ d(\mathbf{A}, \mathbf{B}) = \sqrt{\sum_{i=1}^{n} (B_i - A_i)^2} $$

While Euclidean distance measures the straight-line gap between points, modern LLMs often rely on **Cosine Similarity**, which measures the angle between vectors to determine directional alignment regardless of magnitude.

### Latent Semantic Algebra
Because these positions are derived from logical relationships in data, the space itself becomes "computable." We can perform algebraic operations on these vectors to navigate human concepts. For example, the vector offset between gendered pairs is often so consistent that the model can solve analogies through simple arithmetic:

$$ \vec{v}_{\text{King}} - \vec{v}_{\text{Man}} + \vec{v}_{\text{Woman}} \approx \vec{v}_{\text{Queen}} $$

This proves that the model has not merely memorized a vocabulary, but has constructed a mathematical map of the **underlying structure** of human thought based solely on statistical usage.
</div>

<div id="evolution-lab" style="display: flex; flex-direction: column; gap: 60px; margin-top: 30px;">
    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #64748b;">Stage 1: 1D</h2>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div>
                <input type="text" id="input-1d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., Cold + Warm" onkeyup="if(event.key==='Enter') calcEvo('1d')">
                <div id="res-1d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #3b82f6;">Match: -</div>
            </div>
            <div id="plot-1d" style="height: 180px; background: #fff; border-radius: 8px;"></div>
        </div>
    </section>

    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #64748b;">Stage 2: 2D</h2>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div>
                <input type="text" id="input-2d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., Man + Power" onkeyup="if(event.key==='Enter') calcEvo('2d')">
                <div id="res-2d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #10b981;">Match: -</div>
            </div>
            <div id="plot-2d" style="height: 400px; background: #fff; border-radius: 8px;"></div>
        </div>
    </section>

    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #64748b;">Stage 3: 3D</h2>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div>
                <input type="text" id="input-3d" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="e.g., King + Animal" onkeyup="if(event.key==='Enter') calcEvo('3d')">
                <div id="res-3d" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 8px; font-weight: bold; border-left: 4px solid #6366f1;">Match: -</div>
            </div>
            <div id="plot-3d" style="height: 500px; background: #fff; border-radius: 8px;"></div>
        </div>
    </section>
</div>
