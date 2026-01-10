const TransformerLab = {
    vocab: ["Der", "Roboter", "lernt", "KI", "ist", "super", "Mathematik", "macht", "Spaß", "die", "Welt"],
    
    init: function() {
        this.run();
    },

    loadPreset: function(txt) {
        document.getElementById('tf-input').value = txt;
        this.run();
    },

    run: function() {
        const input = document.getElementById('tf-input').value;
        const tokens = input.split(/\s+/).filter(t => t.length > 0);
        
        // 1. Embedding Simulation (jedes Wort bekommt einen 4D Vektor)
        const embeddings = tokens.map(t => this.getWordVector(t));
        this.renderEmbedding(tokens, embeddings);

        // 2. Attention Simulation
        const { attendedValues, weights } = this.simulateAttention(embeddings);
        this.renderAttention(tokens, weights);

        // 3. Add & Norm
        const normOutput = attendedValues.map((v, i) => v.map((val, j) => (val + embeddings[i][j]) / 1.5));
        this.renderAddNorm(normOutput);

        // 4. Feed Forward
        const ffnOutput = normOutput.map(v => v.map(val => Math.max(0, val * 1.2))); // ReLU sim
        this.renderFFN(ffnOutput);

        // 5. Softmax / Output (für das letzte Wort)
        this.renderOutput(ffnOutput[ffnOutput.length - 1]);

        // MathJax Refresh
        if (window.MathJax) MathJax.typesetPromise();
    },

    getWordVector: function(word) {
        // Deterministic pseudo-random vector based on word
        let hash = 0;
        for (let i = 0; i < word.length; i++) hash = word.charCodeAt(i) + ((hash << 5) - hash);
        return Array.from({length: 4}, (_, i) => Math.sin(hash + i).toFixed(2) * 1);
    },

    simulateAttention: function(embs) {
        const size = embs.length;
        let weights = Array.from({length: size}, () => Array(size).fill(0));
        
        // Simuliere Dot-Product Attention: Ähnlichkeit der Vektoren
        for(let i=0; i<size; i++) {
            let rowSum = 0;
            for(let j=0; j<size; j++) {
                let dot = embs[i].reduce((acc, val, idx) => acc + val * embs[j][idx], 0);
                weights[i][j] = Math.exp(dot); 
                rowSum += weights[i][j];
            }
            weights[i] = weights[i].map(w => w / rowSum); // Softmax over rows
        }

        // Weighted Sum (Attended Values)
        const attended = embs.map((_, i) => {
            let newVec = [0,0,0,0];
            for(let j=0; j<size; j++) {
                for(let k=0; k<4; k++) newVec[k] += weights[i][j] * embs[j][k];
            }
            return newVec;
        });

        return { attendedValues: attended, weights };
    },

    renderEmbedding: function(tokens, embs) {
        const container = document.getElementById('step-embedding');
        let matrixLatex = "X = \\begin{pmatrix} " + embs.map(e => e.join(' & ')).join(' \\\\ ') + " \\end{pmatrix}";
        container.innerHTML = `$$\\text{Input Embeddings } (n \\times d_{model}):$$ $$ ${matrixLatex} $$`;
        
        const viz = document.getElementById('viz-tokens');
        viz.innerHTML = tokens.map(t => `<span class="badge" style="background:#3b82f6; color:white; padding:4px 8px; border-radius:4px;">${t}</span>`).join('');
    },

    renderAttention: function(tokens, weights) {
        const container = document.getElementById('step-attention');
        const size = tokens.length;
        let html = `<div class="attention-grid" style="grid-template-columns: repeat(${size}, 30px);">`;
        
        weights.flat().forEach(w => {
            const alpha = Math.max(0.1, w);
            html += `<div class="attn-cell" style="background: rgba(59, 130, 246, ${alpha})">${w.toFixed(1)}</div>`;
        });
        html += `</div>`;
        container.innerHTML = html;

        document.getElementById('math-attention').innerHTML = `$$\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$`;
    },

    renderAddNorm: function(data) {
        const val = data[0][0].toFixed(2);
        document.getElementById('step-addnorm').innerHTML = `$$\\text{LayerNorm}(x + \\text{Sublayer}(x)) \\rightarrow \\text{Beispiel-Output: } [${val}, ...]$$`;
    },

    renderFFN: function(data) {
        document.getElementById('step-ffn').innerHTML = `$$\\text{FFN}(x) = \\max(0, xW_1 + b_1)W_2 + b_2$$`;
    },

    renderOutput: function(lastVec) {
        const container = document.getElementById('prob-bars-tf');
        // Simuliere Logits durch Vergleich des letzten Vektors mit Vokabular
        let scores = this.vocab.map(word => {
            const wordVec = this.getWordVector(word);
            const dist = lastVec.reduce((acc, v, i) => acc + Math.pow(v - wordVec[i], 2), 0);
            return { word, prob: Math.exp(-dist) };
        });

        const sum = scores.reduce((a, b) => a + b.prob, 0);
        scores.forEach(s => s.prob = (s.prob / sum) * 100);
        scores.sort((a, b) => b.prob - a.prob);

        container.innerHTML = `<strong>Nächstes Token (Softmax):</strong>` + scores.slice(0, 4).map(s => `
            <div style="margin-top:8px;">
                <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                    <span>${s.word}</span><span>${s.prob.toFixed(1)}%</span>
                </div>
                <div style="background:#e2e8f0; height:8px; border-radius:4px;">
                    <div style="background:#3b82f6; width:${s.prob}%; height:100%; border-radius:4px;"></div>
                </div>
            </div>
        `).join('');

        document.getElementById('step-logits').innerHTML = `$$\\text{Logits} \\rightarrow \\sigma(\\vec{z})_i = \\frac{e^{z_i}}{\\sum e^{z_j}}$$`;
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
