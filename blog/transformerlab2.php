<?php include_once("functions.php"); ?>

<style>
    :root {
        --accent-blue: #38bdf8;
        --accent-purple: #c084fc;
        --border-color: #334155;
        --panel-bg: #1e293b;
    }

    .analysis-panel {
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        margin: 2rem 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .visualizer-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 20px;
    }

    .plot-container {
        border: 1px solid #444;
        border-radius: 8px;
        min-height: 350px;
        width: 100%;
    }

    /* Tab Styles for Multi-Head */
    .tab-nav { display: flex; overflow-x: auto; gap: 5px; border-bottom: 1px solid var(--border-color); margin-bottom: 15px; }
    .tab-link { padding: 8px 12px; cursor: pointer; border: none; background: none; color: #888; }
    .tab-link.active { color: var(--accent-blue); border-bottom: 2px solid var(--accent-blue); }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
</style>

<div class="md">
## What Transformers do, conceptually
</div>

<div id="transformer-controls" class="control-panel analysis-panel">
    <h3>Model Configuration & Training</h3>
    
    <div class="input-group">
        <label for="train-text">Training Data (Corpus):</label>
        <textarea id="train-text" class="input-field" rows="3">the king is wise and the queen is brave</textarea>
    </div>

    <div class="input-group">
        <label for="input-text">Prompt / Input Text:</label>
        <textarea id="input-text" class="input-field" rows="2" placeholder="Enter starting text..."></textarea>
    </div>

    <div class="settings-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
        <div class="setting-item">
            <label for="temp-setting">Temperature:</label>
            <input type="number" id="temp-setting" class="input-field" value="0.7" step="0.1" min="0">
        </div>
        <div class="setting-item">
            <label for="nr-epochs">Epochs:</label>
            <input type="number" id="nr-epochs" class="input-field" value="10" min="1">
        </div>
        <div class="setting-item">
            <label for="nr-attention-heads">Attention Heads:</label>
            <input type="number" id="nr-attention-heads" class="input-field" value="8" min="1">
        </div>
        <div class="setting-item">
            <label for="nr-stack-depth">Stack Depth (L):</label>
            <input type="number" id="nr-stack-depth" class="input-field" value="6" min="1">
        </div>
    </div>

    <div class="action-row" style="margin-top: 20px;">
        <button id="start-training-btn" class="btn-primary" style="width: 100%; padding: 12px;">Start Training</button>
    </div>
</div>

<div class="md">
After a sentence is split into tokens via **Byte-Pair-Encoding (BPE)**, it is converted into vectors. However, because Transformers process all tokens in a sentence simultaneously to achieve massive parallelism, the model inherently has no sense of word order, to the attention mechanism, "The dog bit the man" and "The man bit the dog" look identical. To fix this, we use **Positional Encoding**.
</div>

<div id="bpe-section" class="analysis-panel">
    <h3>BPE Tokenization & ID Mapping</h3>
    <div class="visualizer-grid">
        <div id="plotly-bpe-vocab" class="plot-container"></div>
        <div id="plotly-bpe-merges" class="plot-container"></div>
    </div>
</div>

<div class="md">
Before the first transformer module, we add a unique "position signal" to each token's embedding. This is typically done using sine and cosine functions of different frequencies, ensuring that each position has a unique signature that the model can use to navigate the sequence:

<div class="formula-display">
$$h_{0} = \underbrace{\text{Embedding}(\text{Token})}_{\in \mathbb{R}^{d_\text{model}}} + \underbrace{\text{PositionalEncoding}(\text{pos})}_{\in \mathbb{R}^{d_\text{model}}}$$
</div>
</div>

<div id="pe-section" class="analysis-panel">
    <h3>Positional Encoding Signal</h3>
    <div class="visualizer-grid">
        <div id="plotly-pe-waves" class="plot-container"></div>
        <div id="plotly-pe-matrix" class="plot-container"></div>
    </div>
</div>

<div class="md">
The task of the subsequent modules is to position this **Hidden State** $h$ within a high-dimensional **Feature Space** so that it represents the sentence’s meaning relative to specific types of information. For example, in the sentence *"I will learn how transformers work"*, one attention head might link *"will"* strongly with *"learn"* to capture temporal meaning (future tense). Another might react to the relationship between *"learn"* and *"work"*. However, because of BPE tokenization, the model often works with sub-word units. In German, where "I go" is *"Ich laufe"* and "you go" is *"du läufst"*, the LLM might encode the stem *"lauf-"* (and *"läuf-"* very near to *"lauf-"*) as a core entity, while the endings *"##e"* and *"##st"* provide the grammatical context. The **Hidden State** of a token is essentially a vector being pulled in different directions by these relationships.
</div>

<div id="feature-space-section" class="analysis-panel">
    <h3>High-Dimensional Feature Space</h3>
    <div class="visualizer-grid">
        <div id="plotly-embedding-clusters" class="plot-container"></div>
        <div id="plotly-vector-pull" class="plot-container"></div>
    </div>
</div>

<div class="md">
#### The Architecture of Attention
We stack these layers deeply, sometimes hundreds of levels high. To prevent the gradient during training from vanishing (the \citealternativetitle{hochreiter1991vanishing}) into insignificance, we use the residual connection method pioneered by \citeauthor{he2015resnet}. We add the original input to the output of the attention mechanism:

<div class="formula-display">
$$h_1 = h_0 + \text{Attention}(\text{LayerNorm}(x))$$
</div>
</div>

<div id="residual-section" class="analysis-panel">
    <h3>Residual Connection & LayerNorm</h3>
    <div class="visualizer-grid">
        <div id="plotly-residual-flow" class="plot-container"></div>
        <div id="plotly-norm-distribution" class="plot-container"></div>
    </div>
</div>

<div class="md">
Each layer contains multiple **Attention Heads** working in parallel. It is important to remember that these heads do not have a human-defined "purpose." This is similar to the \citealternativetitle{grandmotherneuron}, an urban legend in neuroscience claiming a single neuron represents one's grandmother. In the reality of the human brain, and in Transformers, meaning is emergent and distributed. As \citeauthor{heraclitus500fragments} noted: *"The hidden harmony is better than the obvious"* (which goes in the same direction as the \citealternativetitle{sutton2019bitter}). The dimensions in this space are often too abstract for human language to name and should not be antromorphized.
</div>

<div id="mha-section" class="analysis-panel">
    <h3>Multi-Head Attention Layers</h3>
    <div class="tab-wrapper" id="attention-heads-container">
        <div class="tab-nav" id="mha-tabs">
            <button class="tab-link active" data-head="0">Head 1</button>
            <button class="tab-link" data-head="all">All Heads (Summary)</button>
        </div>
        <div class="tab-content">
            <div id="plotly-mha-viz" class="plot-container"></div>
        </div>
    </div>
</div>

<div class="md">
#### The Feed-Forward Network: The "Knowledge" Store
Once the attention heads have finished looking around the sentence to see which words relate to each other, their results are concatenated and projected back into the main Feature Space. This combined information is then passed into the **Feed-Forward Neural Network (FFN)**:

<div class="formula-display">
$$h_2 = h_1 + \text{FFN}(\text{LayerNorm}(y))$$
</div>

While the attention mechanism decides *what* to look at, the FFN decides *what to do* with that information. Most researchers consider the FFN, usually consisting of two dense layers with an activation function like **ReLU** or **GeLU**, to be the place where the model's "world knowledge" is stored (see \citetitle{keyvalmem}). It transforms the context-aware vector into a final state that "points" toward the most logical next concept in the embedding space.
</div>

<div id="ffn-section" class="analysis-panel">
    <h3>FFN: Knowledge Projection</h3>
    <div class="visualizer-grid">
        <div id="plotly-ffn-neurons" class="plot-container"></div>
        <div id="plotly-ffn-output" class="plot-container"></div>
    </div>
</div>

<div class="md">
#### From Hidden States to Probabilities
After the hidden state has passed through all layers, it is used to predict the next token. The final hidden state is compared against every token in the model's vocabulary. This is done by multiplying the state by the transpose of the original vocabulary matrix to create **Logits**:

<div class="formula-display">
$$\text{Logits} = h_{\text{final}} \cdot W_{\text{Vocab}}^T$$
</div>

The Logits represent raw scores for every possible word. To turn these into something we can use, we pass them through a **SoftMax** function to create a probability distribution:

<div class="formula-display">
$$\text{SoftMax}(\text{Logits}) \rightarrow \text{Probability of all tokens}$$
</div>

Finally, we apply **Temperature**. A **Low Temperature** makes the distribution "sharper," picking only the most likely words for accuracy. A **High Temperature** spreads the likelihood out, allowing the model to pick less obvious tokens, which results in more creative or "human-like" responses.
</div>

<div id="output-section" class="analysis-panel">
    <h3>Final Prediction: Logits & Softmax</h3>
    <div class="visualizer-grid">
        <div id="plotly-logits-bar" class="plot-container"></div>
        <div id="plotly-softmax-pie" class="plot-container"></div>
    </div>
</div>

<div id="prediction-result-section" class="analysis-panel" style="border-top: 4px solid var(--accent-purple);">
    <h3>Final Output: Next Word Prediction</h3>

    <div class="visualizer-grid">
        <div class="visualizer-column">
            <h4>Sampling the Distribution</h4>
            <div id="plotly-final-prediction" class="plot-container"></div>

            <div class="prediction-highlight" style="margin-top: 20px; padding: 20px; background: rgba(192, 132, 252, 0.1); border-radius: 8px; text-align: center;">
                <span style="font-size: 0.9rem; color: #94a3b8; display: block; margin-bottom: 5px;">SELECTED TOKEN</span>
                <div id="predicted-word-display" style="font-size: 2.5rem; font-weight: 800; color: var(--accent-purple);">...</div>
                <div id="prediction-confidence" style="font-family: monospace; color: var(--accent-blue);">Confidence: --%</div>
            </div>
        </div>

        <div class="visualizer-column">
            <h4>Live Updated Equations</h4>
            <div class="formula-display">
                <span style="color: #888;">// Finding the max index after Softmax</span><br>
                $$\hat{y} = \text{arg max}_{i \in \text{Vocab}} (P_i)$$
            </div>

            <div id="token-history-container" style="margin-top: 15px;">
                <h4>Generation History</h4>
                <div id="generation-path" style="padding: 10px; border: 1px dashed var(--border-color); border-radius: 4px; min-height: 50px; font-style: italic; color: #cbd5e1;">
                    The predicted tokens will appear here as the model generates...
                </div>
            </div>

            <div id="plotly-sampling-logic" class="plot-container" style="min-height: 200px; margin-top: 20px;"></div>
        </div>
    </div>
</div>

<div class="md">
This architecture subordinates to the \citealternativetitle{sutton2019bitter}: it favors massive computation and data over hand-crafted linguistic rules. By using GPUs to process these vectors in parallel, the Transformer builds a context-dependent, geometrical representation of "meaning" that effectively reconstructs the world, one token at a time.
</div>

<script>
$(document).ready(function() {
    // Dynamic Tab Handling for MHA
    $(document).on('click', '.tab-link', function() {
        $('.tab-link').removeClass('active');
        $(this).addClass('active');
        // Logic to update plotly-mha-viz will go here
    });

    // Function to generate head tabs based on settings
    function updateHeadTabs() {
        const numHeads = $('#nr-attention-heads').val();
        let html = '';
        for(let i=0; i<numHeads; i++) {
            html += `<button class="tab-link ${i===0?'active':''}" data-head="${i}">Head ${i+1}</button>`;
        }
        html += `<button class="tab-link" data-head="all">All Heads</button>`;
        $('#mha-tabs').html(html);
    }

    $('#nr-attention-heads').on('change', updateHeadTabs);
});
</script>
