<?php include_once("functions.php"); ?>

<div class="panel" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
    <div class="md">
        <h1 style="color: #1e293b; border-bottom: 3px solid #3b82f6; display: inline-block;">The Mechanical Mind: 8 Stages of Attention</h1>
        <p style="font-size: 1.1rem; color: #475569; margin-top: 20px;">
            How does a computer understand that "Bank" in "Bank of the river" is different from "Bank of England"? 
            It's not magic—it's <b>Linear Algebra</b>. We represent words as points in space and let them "pull" on each other.
        </p>
    </div>

    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #3b82f6; margin: 30px 0;">
        <label style="font-weight: 800; color: #3b82f6; font-size: 0.8rem; text-transform: uppercase;">Neural Engine Input</label>
        <input type="text" id="sa-input" value="The hunter sees the bear" oninput="VisualAttentionLab.update()" 
               style="width: 100%; border: 2px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 1.2rem; margin-top: 10px; font-family: 'Courier New', monospace;">
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div class="lab-card">
            <h4 style="color:#2563eb">1. The Connectivity Web</h4>
            <p class="small-desc">Which words are "talking" to each other right now?</p>
            <div id="plot-web" style="height: 350px;"></div>
        </div>
        <div class="lab-card">
            <h4 style="color:#f59e0b">2. Contextual Flow ($Z$)</h4>
            <p class="small-desc">The "Arrow of Thought": How context moves the word's meaning.</p>
            <div id="plot-flow" style="height: 350px;"></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div class="lab-card">
            <h4 style="color:#1e293b">3. The Attention Matrix ($\alpha$)</h4>
            <div id="sa-matrix-container"></div>
            <div class="math-explanation" style="margin-top:15px; padding:15px; background:#f1f5f9; border-radius:8px;">
                <p><b>How to read this:</b> Look at the row "Hunter". The percentages tell you how much the model focuses on other words to define what "Hunter" means in this specific sentence.</p>
                $$\alpha_{i,j} = \text{Softmax}(\frac{Q_i K_j^T}{\sqrt{d_k}})$$
            </div>
        </div>
        <div class="lab-card" style="background: #f8fafc;">
            <h4 style="color:#6366f1">4. Raw Energy (Pre-Softmax)</h4>
            <div id="plot-dot-products" style="height: 350px;"></div>
            <p class="small-desc">These are the raw "resonance" scores. Notice how some are much higher before the Softmax forces them to become probabilities.</p>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div class="lab-card">
            <h4>5. Semantic Clustering</h4>
            <p class="small-desc">Static dictionary positions (Embeddings).</p>
            <div id="plot-space" style="height: 350px;"></div>
        </div>
        <div class="lab-card">
            <h4>6. Query-Key Alignment</h4>
            <p class="small-desc">Heatmap of mathematical "Compatibility".</p>
            <div id="plot-alignment" style="height: 350px;"></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div class="lab-card">
            <h4>7. Attention Landscape</h4>
            <p class="small-desc">A 3D "topography" of focus.</p>
            <div id="plot-energy" style="height: 350px;"></div>
        </div>
        <div class="lab-card">
            <h4>8. Focus Depth (Entropy)</h4>
            <p class="small-desc">Higher bars = The model is "confused" or spreading focus.</p>
            <div id="plot-entropy" style="height: 350px;"></div>
        </div>
    </div>

    <div class="md" style="margin-top: 50px; background: #fff; padding: 20px; border-top: 5px solid #3b82f6;">
        <h2 style="color: #1e293b;">The Deep Math of $1+1=2$ to Language</h2>
        <p>
            In the beginning of this page, we saw $1+1=2$. In ChatGPT, we do the same, but with <b>512-dimensional vectors</b>. 
            The transformation follows three rigid steps:
        </p>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top:30px;">
            <div style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <h5 style="color:#2563eb">Step A: The Query ($Q$)</h5>
                <p style="font-size:0.85rem;">"What am I looking for?"<br>The word <b>Hunter</b> sends out a Query asking for "Actions" or "Objects".</p>
            </div>
            <div style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <h5 style="color:#ef4444">Step B: The Key ($K$)</h5>
                <p style="font-size:0.85rem;">"What do I offer?"<br>The word <b>sees</b> has a Key that says "I am an Action".</p>
            </div>
            <div style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <h5 style="color:#10b981">Step C: The Value ($V$)</h5>
                <p style="font-size:0.85rem;">"Who am I really?"<br>The actual information that gets moved to the next layer of the brain.</p>
            </div>
        </div>
    </div>
</div>
