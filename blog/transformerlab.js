const TransformerLab = {
    // 3D-Dimensionen: [Macht/Status, Alter, Geschlecht]
    vocab: {
        "The": [0.1, 0.5, 0.5], "king": [0.95, 0.8, 0.1], "queen": [0.95, 0.8, 0.9],
        "man": [0.4, 0.6, 0.1], "woman": [0.4, 0.6, 0.9], "boy": [0.1, 0.2, 0.1],
        "girl": [0.1, 0.2, 0.9], "rules": [0.85, 0.6, 0.5], "is": [0.2, 0.5, 0.5],
        "young": [0.1, 0.1, 0.5], "old": [0.1, 0.9, 0.5], "strong": [0.7, 0.5, 0.2],
        "wise": [0.75, 0.9, 0.5], "palace": [0.9, 0.3, 0.5]
    },

    W_Q: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    W_K: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    W_V: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    
    W_ffn: [[1.5, -0.2, 0.1], [0.1, 1.5, -0.2], [-0.2, 0.1, 1.2]],

    init: function() { this.run(); },

    addToken: function(word) {
        const input = document.getElementById('tf-input');
        input.value = input.value.trim() + " " + word;
        this.run();
    },

    loadPreset: function(txt) {
        document.getElementById('tf-input').value = txt;
        this.run();
    },

    // Hilfsfunktion für konsistentes Hashing (aus Tokenizerlab übernommen)
    getHash: function(s) {
        return Math.abs(s.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0));
    },

    run: async function() {
        const inputEl = document.getElementById('tf-input');
        const overlayEl = document.getElementById('tf-input-overlay');
        const words = inputEl.value.trim().split(/\s+/);
        overlayEl.innerText = inputEl.value;

        // --- SCHRITT 0: TOKENISIERUNG RENDERN ---
        this.renderTokenVisuals(words);

        let tokens = words.filter(w => this.vocab[w]);
        if(tokens.length === 0) return;

        // 1. Input Embeddings mit Positional Encoding
        const x_in = tokens.map((t, i) => this.vocab[t].map((v, d) => v + (d === 0 ? i * 0.05 : 0)));
        
        // 2. Multi-Head Attention Mechanismus
        const { weights, output: v_att } = this.calculateAttention(x_in);
        
        const lastIdx = tokens.length - 1;
        
        // 3. Logit-Lens
        const predRaw = this.getPrediction(x_in[lastIdx], tokens);
        
        // 4. Residual Connection
        const x_res = v_att[lastIdx].map((v, i) => v + x_in[lastIdx][i]);
        
        // 5. Feed-Forward Network & ReLU
        const x_ffn = [0,1,2].map(i => x_res.reduce((sum, v, j) => sum + v * this.W_ffn[j][i], 0));
        const x_out = x_ffn.map(v => Math.max(0, v));

        // Endgültige Vorhersage
        const predFinal = this.getPrediction(x_out, tokens);

        // Rendering & Visualisierung
        this.plot3D(tokens, x_in, predFinal.top[0]);
        this.renderAttentionTable(tokens, weights);
        this.renderAttentionMath(tokens, weights);
        this.renderStepComparison(predRaw, predFinal);
        this.renderMath(tokens[lastIdx], x_in[lastIdx], v_att[lastIdx], x_res, x_out);
        this.renderProbs(predFinal.top);
        
        // --- SCHRITT 5: DETOKENISIERUNG ---
        this.renderDetokenization(inputEl.value, predFinal.top[0].word);

        if (window.MathJax) MathJax.typesetPromise();
    },

    renderTokenVisuals: function(words) {
        const vizContainer = document.getElementById('viz-tokens');
        const tableContainer = document.getElementById('token-table-container');
        
        vizContainer.innerHTML = words.map(w => {
            const hue = this.getHash(w) % 360;
            return `<div style="background: hsl(${hue}, 65%, 40%); color: white; padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 0.8rem;">${w}</div>`;
        }).join('');

        let tableHtml = `<table class="token-table"><tr><th>Token</th><th>ID</th><th>Embedding (Vektor)</th></tr>`;
        words.forEach(w => {
            const id = this.getHash(w) % 10000;
            const emb = this.vocab[w] ? `[${this.vocab[w].join(', ')}]` : '<span style="color:red">Unknown</span>';
            tableHtml += `<tr><td>"${w}"</td><td>${id}</td><td>${emb}</td></tr>`;
        });
        tableContainer.innerHTML = tableHtml + `</table>`;
    },

    renderDetokenization: function(currentText, nextWord) {
        const out = document.getElementById('detokenize-output');
        out.innerHTML = `${currentText} <span style="color: #ec4899; font-weight: bold; text-decoration: underline;">${nextWord}</span>`;
    },

    calculateAttention: function(embs) {
        const n = embs.length;
        const Q = embs.map(e => this.dotMatrix(e, this.W_Q));
        const K = embs.map(e => this.dotMatrix(e, this.W_K));
        const V = embs.map(e => this.dotMatrix(e, this.W_V));

        let w = Array.from({length:n}, () => Array(n).fill(0));
        for(let i=0; i<n; i++) {
            for(let j=0; j<n; j++) {
                w[i][j] = Q[i].reduce((acc, v, k) => acc + v * K[j][k], 0) / Math.sqrt(3);
            }
            let exp = w[i].map(v => Math.exp(v));
            let sum = exp.reduce((a,b) => a+b);
            w[i] = exp.map(v => v/sum);
        }
        
        const out = Q.map((_, i) => [0,1,2].map(d => V.reduce((s, curr, j) => s + w[i][j] * curr[d], 0)));
        return { weights: w, output: out };
    },

    dotMatrix: function(vec, mat) {
        return [0,1,2].map(i => vec.reduce((sum, v, j) => sum + v * mat[j][i], 0));
    },

    renderStepComparison: function(raw, final) {
        const container = document.getElementById('vector-list');
        container.innerHTML = `
            <div style="font-size:0.8rem; background:#fff; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
                <b style="color:#64748b">Logit Lens (Evolution):</b><br/>
                <span title="Vor Attention">Input-Phase:</span> <b>${raw.top[0].word}</b> (${(raw.top[0].prob*100).toFixed(0)}%)<br/>
                <span title="Nach FFN/Attention">Output-Phase:</span> <b style="color:#3b82f6">${final.top[0].word}</b> (${(final.top[0].prob*100).toFixed(0)}%)
            </div>
        `;
    },

    plot3D: function(tokens, embs, next) {
        const last = embs[embs.length-1];
        const createCones = (pts, color) => {
            let u = [], v = [], w = [], x = [], y = [], z = [];
            for(let i=1; i < pts.length; i++) {
                x.push(pts[i][0]); y.push(pts[i][1]); z.push(pts[i][2]);
                u.push(pts[i][0] - pts[i-1][0]);
                v.push(pts[i][1] - pts[i-1][1]);
                w.push(pts[i][2] - pts[i-1][2]);
            }
            return { 
                type: 'cone', x, y, z, u, v, w, 
                colorscale: [[0, color], [1, color]], 
                showscale: false, sizemode: 'absolute', sizeref: 0.05, anchor: 'tip'
            };
        };

        const data = [
            { x: Object.values(this.vocab).map(v=>v[0]), y: Object.values(this.vocab).map(v=>v[1]), z: Object.values(this.vocab).map(v=>v[2]), mode:'markers', text:Object.keys(this.vocab), marker:{size:3, color:'#cbd5e1'}, type:'scatter3d', name:'Vocab' },
            { x: embs.map(e=>e[0]), y: embs.map(e=>e[1]), z: embs.map(e=>e[2]), mode:'lines+markers+text', text:tokens, textposition: 'top center', line:{width:6, color:'#3b82f6'}, marker:{size:5, color:'#1e3a8a'}, type:'scatter3d', name:'Context Path' },
            createCones(embs, '#3b82f6'),
            { x: [last[0], next.coords[0]], y: [last[1], next.coords[1]], z: [last[2], next.coords[2]], mode:'lines', line:{width:4, color:'#10b981', dash:'dash'}, type:'scatter3d', name:'Prediction' },
            createCones([last, next.coords], '#10b981')
        ];

        Plotly.newPlot('plot-embeddings', data, { 
            margin:{l:0,r:0,b:0,t:0}, paper_bgcolor: 'rgba(0,0,0,0)',
            scene: { xaxis: {title: 'Status'}, yaxis: {title: 'Alter'}, zaxis: {title: 'Gender'} }
        });
    },

    renderAttentionTable: function(tokens, weights) {
        let h = `<table class="attn-table"><tr><th style="background:#f1f5f9;">Q \\ K</th>`;
        tokens.forEach(t => h += `<th style="background:#f1f5f9;">${t}</th>`);
        h += `</tr>`;
        weights.forEach((row, i) => {
            h += `<tr><td class="row-label">${tokens[i]}</td>`;
            row.forEach(w => {
                const alpha = Math.max(0.1, w);
                h += `<td style="background:rgba(59, 130, 246, ${alpha}); color:${w > 0.4 ? 'white' : 'black'};">${w.toFixed(2)}</td>`;
            });
            h += `</tr>`;
        });
        document.getElementById('attn-matrix-container').innerHTML = h + `</table>`;
    },

    renderAttentionMath: function(tokens, weights) {
        const lastIdx = tokens.length - 1;
        const w = weights[lastIdx];
        let math = `$$\\vec{v}_{att} = \\sum_{i=0}^{${lastIdx}} w_i \\vec{v}_i = `;
        let parts = tokens.map((t, i) => `${w[i].toFixed(2)} \\cdot \\vec{e}_{\\text{${t}}}`);
        math += parts.join(' + ') + '$$';
        document.getElementById('math-attn-base').innerHTML = math;
    },

    getPrediction: function(vec, tokens) {
        const last = tokens[tokens.length - 1];
        let list = Object.keys(this.vocab).map(word => {
            const v = this.vocab[word];
            const dist = Math.sqrt(v.reduce((s, x, i) => s + Math.pow(x - vec[i], 2), 0));
            let p = Math.exp(-dist * 8);
            if (tokens.includes("is")) {
                if (["wise", "strong", "young", "old"].includes(word)) p *= 8.0;
                if (["king", "queen", "man", "woman"].includes(word)) p *= 0.1;
            }
            if (word === last || word === "The") p *= 0.01;
            return { word, prob: p, coords: v };
        });
        const sum = list.reduce((a,b) => a+b.prob, 0);
        list.forEach(s => s.prob /= sum);
        return { top: list.sort((a,b) => b.prob - a.prob).slice(0, 5) };
    },

    renderMath: function(token, x_in, v_att, x_res, x_out) {
        document.getElementById('res-ffn-viz').innerHTML = `
            <div style="font-family: serif; margin-bottom: 15px;">
                <b style="color:#1e40af">Abstrakte Architektur:</b>
                <div style="background:#fff; padding:10px; border-radius:5px; margin-top:5px; border:1px solid #cbd5e1">
                    $$x_{i+1} = \text{LayerNorm}(x_i + \text{Attention}(x_i))$$
                    $$x_{out} = \text{LayerNorm}(x_{i+1} + \text{FFN}(x_{i+1}))$$
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <small>1. Residual Stream ($\vec{x}_{res} = \vec{x}_{in} + \vec{v}_{att}$)</small>
                    $$\begin{bmatrix} ${x_res.map(v=>v.toFixed(2)).join('\\\\')} \end{bmatrix}$$
                </div>
                <div>
                    <small>2. FFN + ReLU ($\max(0, \vec{x} \cdot W + b)$)</small>
                    $$\begin{bmatrix} ${x_out.map(v=>v.toFixed(2)).join('\\\\')} \end{bmatrix}$$
                </div>
            </div>
            <p style="font-size: 0.75rem; margin-top:10px; color: #64748b; line-height:1.2;">
                Das Feed-Forward Network (FFN) verarbeitet jeden Token individuell. Durch die Nicht-Linearität (ReLU) lernt das Modell komplexe Abhängigkeiten zwischen den Dimensionen.
            </p>
        `;
    },

    renderProbs: function(top) {
        document.getElementById('prob-bars-container').innerHTML = top.map(s => `
            <div class="prob-item" onclick="TransformerLab.addToken('${s.word}')">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                    <span style="font-weight:bold">${s.word}</span>
                    <span>${(s.prob*100).toFixed(1)}%</span>
                </div>
                <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
                    <div style="background: #3b82f6; width: ${s.prob*100}%; height: 100%; transition: width 0.4s;"></div>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
