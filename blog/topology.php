<?php include_once("functions.php"); ?>

<div class="md">
## Topology and the Geometry of Thought

In an LLM, words and concepts are mapped to high-dimensional vectors. However, these vectors don't fill the space uniformly. They tend to lie on a **Manifold**—a lower-dimensional surface embedded in the high-dimensional space.

### What is Topology in AI?
While geometry deals with exact distances, **Topology** deals with properties that are preserved under continuous deformation. In an LLM:
* **Homeomorphism**: If two concepts can be "stretched" into one another without tearing, they share topological properties.
* **Connectivity**: The model learns that "Man" is to "Woman" as "King" is to "Queen" because the topological "path" between them is preserved across different regions of the manifold.

### Topological Calculations
The model uses these shapes for several tasks:
1.  **Attention Mechanism**: Acts as a way to "navigate" the manifold to find relevant neighbors.
2.  **Feature Extraction**: Identifying "loops" or "clusters" (Persistent Homology) to determine if a model has truly understood a concept or is just memorizing noise.
</div>

<div style="margin-bottom: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <strong>Latent Space Manifold:</strong><br>
    Adjust the <b>Warp Factor</b> to see how the manifold deforms while maintaining its underlying connectivity.
    <br><br>
    Warp Factor: <input type="range" id="topo-warp" min="0" max="1" step="0.05" value="0.3">
</div>

<div id="topology-plot" class="plot-container" style="height: 500px; margin-bottom: 40px;"></div>

<div class="md">
## Feature Spaces
A **Feature Space** is a specific slice of this manifold. For example, a model might have a "Sentiment" dimension. By moving a vector along that specific topological curve, we can change a sentence from "sad" to "happy" without losing the original meaning of the words.
</div>
