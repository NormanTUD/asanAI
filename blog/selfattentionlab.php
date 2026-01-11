<?php include_once("functions.php"); ?>

<div class="panel" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
    <div class="md">
        <h1 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">The Mechanical Mind: Self-Attention Deep Dive</h1>
        <p>ChatGPT doesn't read words; it calculates <b>force fields</b>. Below, we break down the 8 steps of how "Attention" transforms static dictionary definitions into context-aware thoughts.</p>
    </div>

    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
        <label style="font-weight: 800; color: #3b82f6; font-size: 0.9rem; text-transform: uppercase;">Sentence Engine</label>
        <input type="text" id="sa-input" value="Der Jäger sieht den Bär" oninput="VisualAttentionLab.update()" 
               style="width: 100%; border: 2px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 1.2rem; margin-top: 10px; font-family: monospace;">
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div class="lab-card">
            <h4>1. The Attention Web</h4>
            <div id="plot-web" style="height: 350px;"></div>
        </div>
        <div class="lab-card">
            <h4>2. Contextual Flow (Output $Z$)</h4>
            <div id="plot-flow" style="height: 350px;"></div>
        </div>
    </div>

    <div class="grid-layout" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div class="lab-card">
            <h4>3. The Attention Matrix (Softmax $\alpha$)</h4>
            <p style="font-size: 0.85rem; color: #64748b;">This table represents the <b>final weights</b>. Each row shows which other words the current word is "listening" to.</p>
            <div id="sa-matrix-container"></div>
        </div>
        <div class="lab-card" style="background: #f1f5f9; border: none;">
            <h4>4. How the Table is Born</h4>
            <div id="plot-dot-products" style="height: 300px;"></div>
            <p style="font-size: 0.8rem; margin-top: 10px;">The plot above shows raw <b>Dot-Products</b> $q \cdot k^T$ before they are squashed into percentages by the Softmax function.</p>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
        <div class="lab-card">
            <h4>5. Semantic Clustering</h4>
            <div id="plot-space" style="height: 300px;"></div>
        </div>
        <div class="lab-card">
            <h4>6. Query-Key "Alignment"</h4>
            <div id="plot-alignment" style="height: 300px;"></div>
        </div>
        <div class="lab-card">
            <h4>7. Energy Landscapes</h4>
            <div id="plot-energy" style="height: 300px;"></div>
        </div>
    </div>

    <div class="lab-card" style="margin-top: 20px;">
        <h4>8. Head Variance (Multi-Head Entropy)</h4>
        <div id="plot-entropy" style="height: 300px;"></div>
    </div>

    <div class="md" style="margin-top: 40px; line-height: 1.7;">
        <hr>
        <h3>Detailed Breakdown: From Raw Data to Context</h3>
        
        <h4>A. The Dot-Product: "Measuring Resonance"</h4>
        <p>The table you see in Step 3 is not random. It is calculated by multiplying the <b>Query (Q)</b> of one word with the <b>Key (K)</b> of every other word. Mathematically:</p>
        <div class="math-tex">
            $$\text{Energy}_{i,j} = \mathbf{q}_i^\top \mathbf{k}_j$$
        </div>
        <p>In Step 4, we visualize this "Energy". If a Query and a Key point in the same direction in 3D space, the energy spikes. This is <b>Resonance</b>. The Transformer uses this to find relevant information.</p>

        <h4>B. The Softmax: "The Competitive Filter"</h4>
        <p>Why do the numbers in the table sum up to 100% (or 1.0)? That's the <b>Softmax</b>. It forces the model to choose. If "Jäger" (Hunter) looks at "sieht" (sees), it takes away attention from "Der" (The).</p>
        <div class="math-tex">
            $$\alpha_{i,j} = \frac{e^{\text{Energy}_{i,j}}}{\sum_k e^{\text{Energy}_{i,k}}}$$
        </div>

        <h4>C. The Output: "Contextualized Embedding"</h4>
        <p>Finally, we use these weights to create the <b>Value (V)</b>. The original word "Jäger" is a static point. But after attention (Step 2), it is "pulled" towards the "Bär" (Bear). The arrow shows the <b>Vector Shift</b>. This shifted vector is what ChatGPT actually "thinks" about.</p>
    </div>
</div>
