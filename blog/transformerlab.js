const TransformerLab = {
    // Erweitertes Vokabular [Power, Age, Gender]
    vocab: {
        "The": [0.1, 0.5, 0.5],
        "king": [0.95, 0.8, 0.1],
        "queen": [0.95, 0.8, 0.9],
        "man": [0.4, 0.6, 0.1],
        "woman": [0.4, 0.6, 0.9],
        "boy": [0.1, 0.2, 0.1],
        "girl": [0.1, 0.2, 0.9],
        "rules": [0.8, 0.6, 0.5],
        "is": [0.2, 0.5, 0.5],
        "young": [0.1, 0.1, 0.5],
        "old": [0.1, 0.9, 0.5],
        "strong": [0.6, 0.5, 0.5],
        "wise": [0.7, 0.9, 0.5],
        "lives": [0.3, 0.4, 0.5],
        "palace": [0.8, 0.2, 0.5],
        "house": [0.4, 0.2, 0.5]
    },
    
    lastPrediction: "",

    init: function() {
        this.run();
    },

    loadPreset: function(txt) {
        document.getElementById('tf-input').value = txt;
        this.run();
    },

    appendNext: function() {
        if(this.lastPrediction) {
            const input = document.getElementById('tf-input');
            input.value = input.value.trim() + " " + this.lastPrediction;
            this.run();
        }
    },

    run: function() {
        const inputEl = document.getElementById('tf-input');
        const overlayEl = document.getElementById('tf-input-overlay');
        const text = inputEl.value;
        const words = text.split(/(\s+)/); // Erhält Leerzeichen
        
        // 1. Wort-Validierung & Overlay (Rote Markierung)
        let overlayHtml = "";
        let validTokens = [];
        words.forEach(w => {
            const trimmed = w.trim();
            if(trimmed === "") {
                overlayHtml += w;
            } else if(this.vocab[trimmed]) {
                overlayHtml += trimmed;
                validTokens.push(trimmed);
            } else {
                overlayHtml += `<span style="color:red; text-decoration:underline;">${trimmed}</span>`;
            }
        });
        overlayEl.innerHTML = overlayHtml;

        if(validTokens.length === 0) return;

        // 2. Embeddings & Positions-Kodierung (simuliert)
        const x_embeddings = validTokens.map((t, i) => {
            const v = [...this.vocab[t]];
            // Wir fügen eine kleine Positions-Komponente hinzu, damit "king" nach "The" 
            // anders ist als "king" alleine.
            v[0] += i * 0.05; 
            return v;
        });
        
        // 3. Attention
        const { weights, output: attn_output } = this.calculateAttention(x_embeddings);
        
        // 4. Prediction Logic (Wir bestrafen das Wort, das gerade erst kam)
        const lastToken = validTokens[validTokens.length - 1];
        const res_ffn = attn_output[attn_output.length - 1].map((v, i) => (v + x_embeddings[x_embeddings.length-1][i]) / 1.1);
        const prediction = this.getPrediction(res_ffn, lastToken);
        this.lastPrediction = prediction.top[0].word;

        // Renderings
        this.plot3D(validTokens, x_embeddings, prediction.top[0]);
        this.renderAttentionTable(validTokens, weights);
        this.renderVectorDetails(validTokens, x_embeddings);
        this.renderMath(validTokens, res_ffn);
        this.renderProbs(prediction.top);

        if (window.MathJax) MathJax.typesetPromise();
    },

    calculateAttention: function(embs) {
        const n = embs.length;
        let weights = Array.from({length: n}, () => Array(n).fill(0));
        
        for(let i=0; i<n; i++) {
            for(let j=0; j<n; j++) {
                // Skalarprodukt Query i * Key j
                let dot = embs[i].reduce((sum, val, idx) => sum + val * embs[j][idx], 0);
                weights[i][j] = dot;
            }
            let exp = weights[i].map(w => Math.exp(w));
            let sum = exp.reduce((a,b) => a+b);
            weights[i] = exp.map(e => e/sum);
        }

        const output = embs.map((_, i) => {
            return [0,0,0].map((_, dim) => embs.reduce((sum, curr, j) => sum + weights[i][j] * curr[dim], 0));
        });

        return { weights, output };
    },

    getPrediction: function(vec, lastToken) {
        let scores = Object.keys(this.vocab).map(word => {
            const v = this.vocab[word];
            const dist = Math.sqrt(v.reduce((s, x, i) => s + Math.pow(x - vec[i], 2), 0));
            let prob = Math.exp(-dist * 8);
            if(word === lastToken) prob *= 0.01; // Repetitions-Strafe
            return { word, prob, coords: v };
        });
        const sum = scores.reduce((a, b) => a + b.prob, 0);
        scores.forEach(s => s.prob /= sum);
        scores.sort((a,b) => b.prob - a.prob);
        return { top: scores.slice(0, 5) };
    },

    plot3D: function(tokens, embs, next) {
        const data = [];
        // Vocab Dots
        data.push({
            x: Object.values(this.vocab).map(v => v[0]), y: Object.values(this.vocab).map(v => v[1]), z: Object.values(this.vocab).map(v => v[2]),
            mode: 'markers', text: Object.keys(this.vocab), marker: { size: 3, color: '#cbd5e1' }, type: 'scatter3d', name: 'Vocab'
        });
        // Sentence Path
        data.push({
            x: embs.map(e => e[0]), y: embs.map(e => e[1]), z: embs.map(e => e[2]),
            mode: 'lines+markers+text', text: tokens, line: { width: 6, color: '#3b82f6' }, marker: { size: 6, color: '#1e3a8a' }, type: 'scatter3d', name: 'Path'
        });
        // Prediction Line
        const last = embs[embs.length-1];
        data.push({
            x: [last[0], next.coords[0]], y: [last[1], next.coords[1]], z: [last[2], next.coords[2]],
            mode: 'lines+markers', line: { width: 4, color: '#10b981', dash: 'dash' }, type: 'scatter3d', name: 'Next'
        });
        Plotly.newPlot('plot-embeddings', data, { margin: {l:0,r:0,b:0,t:0}, scene:{ camera: {eye: {x: 1.5, y: 1.5, z: 1.5}}} });
    },

    renderAttentionTable: function(tokens, weights) {
        let html = `<table class="attn-table"><tr><th></th>`;
        tokens.forEach(t => html += `<th>${t}</th>`);
        html += `</tr>`;
        weights.forEach((row, i) => {
            html += `<tr><td class="row-label">${tokens[i]}</td>`;
            row.forEach(w => {
                const color = `rgba(59, 130, 246, ${w})`;
                html += `<td style="background:${color}">${w.toFixed(2)}</td>`;
            });
            html += `</tr>`;
        });
        html += `</table>`;
        document.getElementById('attn-matrix-container').innerHTML = html;
    },

    renderVectorDetails: function(tokens, embs) {
        document.getElementById('math-attn-base').innerHTML = `$$\\vec{q}_i, \\vec{k}_j, \\vec{v}_j \\in \\mathbb{R}^3$$`;
        let html = "";
        tokens.forEach((t, i) => {
            html += `<div class="vec-item"><b>${t}:</b> [${embs[i].map(v=>v.toFixed(2)).join(', ')}]</div>`;
        });
        document.getElementById('vector-list').innerHTML = html;
    },

    renderMath: function(tokens, ffn_out) {
        document.getElementById('res-ffn-viz').innerHTML = `
            $$\\vec{x}_{final} = \\text{FFN}(\\text{LN}(\\vec{x}_{pos} + \\text{Attn}(\\vec{x}_{pos})))$$
            $$\\vec{x}_{out} = [${ffn_out.map(v=>v.toFixed(2)).join(', ')}]$$
        `;
    },

    renderProbs: function(top) {
        document.getElementById('prob-bars-container').innerHTML = top.map(s => `
            <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                    <b>${s.word}</b> <span>${(s.prob*100).toFixed(1)}%</span>
                </div>
                <div style="background:#e2e8f0; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:#3b82f6; width:${s.prob*100}%; height:100%;"></div>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
