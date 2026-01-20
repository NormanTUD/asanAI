<?php include_once("functions.php"); ?>

<div class="panel" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; max-width: 1000px; margin: auto;">
    
    <div class="md">
# The Mechanical Mind: 1. Self-Attention

How does a computer understand context? In a sentence like "The hunter sees the bear", the word **The** has no meaning on its own. It only gains meaning by "attending" to the word **hunter**.

In this lab, we visualize the **Attention Mechanism**. Unlike a simple dictionary, a Transformer doesn't look at words in isolation. It calculates a "Compatibility Score" between every word in the sentence. This allows the model to build a dynamic representation of each word based on its surroundings.

The core formula for this focus is the **Scaled Dot-Product Attention**:

$$\alpha_{i,j} = \text{Softmax}\left(\frac{Q_i K_j^T}{\sqrt{d_k}}\right)$$

Where $Q$ (Query) is what a word is looking for, and $K$ (Key) is what other words offer.
    </div>

    <div class="lab-card" style="margin-top: 40px; position: relative; overflow: hidden; padding-top: 80px;">
        <h4 style="color:#2563eb; margin-bottom: 0;">1. The Connectivity Web</h4>
        <p class="small-desc">Hover over the words below to see how the model distributes its focus.</p>
        
        <div id="attention-container" style="position: relative; height: 250px; margin-top: 20px;">
            <canvas id="attn-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 5;"></canvas>
            
            <div id="token-stream" style="display: flex; justify-content: center; gap: 15px; position: absolute; bottom: 40px; width: 100%;">
                </div>
        </div>
    </div>

    <div class="lab-card" style="margin-top: 30px;">
        <h4 style="color:#1e293b">2. The Attention Matrix ($\alpha$)</h4>
        <p class="small-desc">A direct look at the explicit "Relationship Weights" defined for this example.</p>
        <div id="sa-matrix-container" style="overflow-x: auto;"></div>
    </div>

    <div class="md" style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
### Why is this important?
By looking at the matrix, you can see that the second **"the"** (Index 3) has a very high relationship ($80\%$) with **"bear"** (Index 4). This tells the model that these two words form a single entity (a noun phrase). 

The word **"sees"** (Index 2) splits its attention between the **"hunter"** (the actor) and the **"bear"** (the object). This is how the model "understands" the grammar and logic of the English language without being given explicit rules.
    </div>
</div>

<style>
    .lab-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .small-desc { font-size: 0.9rem; color: #64748b; margin-bottom: 20px; }
    
    .token-block {
        padding: 10px 20px;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        cursor: default;
        transition: all 0.2s;
        position: relative;
        z-index: 10;
    }
    .token-block:hover {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #1e40af;
        transform: translateY(-2px);
    }

    .attn-table { border-collapse: collapse; font-family: 'Inter', sans-serif; width: 100%; font-size: 0.9rem; }
    .attn-table th { padding: 12px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; text-align: center; }
    .attn-table td { width: 60px; height: 60px; text-align: center; border: 1px solid #e2e8f0; font-weight: 500; }
    .row-label { font-weight: bold; background: #f8fafc; width: 100px !important; color: #1e293b; }
</style>
