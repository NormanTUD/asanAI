const TransformerLab = {
    // Vokabular und Gewichte bleiben identisch
    vocab: {
        "The": [0.1, 0.5, 0.5], "king": [0.95, 0.8, 0.1], "queen": [0.95, 0.8, 0.9],
        "man": [0.4, 0.6, 0.1], "woman": [0.4, 0.6, 0.9], "boy": [0.1, 0.2, 0.1],
        "girl": [0.1, 0.2, 0.9], "rules": [0.85, 0.6, 0.5], "is": [0.2, 0.5, 0.5],
        "young": [0.1, 0.1, 0.5], "old": [0.1, 0.9, 0.5], "strong": [0.7, 0.5, 0.2],
        "wise": [0.75, 0.9, 0.5], "palace": [0.9, 0.3, 0.5]
    },
    W_ffn: [[1.2, 0.0, 0.0], [0.0, 1.2, 0.0], [0.0, 0.0, 1.0]],

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

    run: function() {
        const inputEl = document.getElementById('tf-input');
        const overlayEl = document.getElementById('tf-input-overlay');
        const words = inputEl.value.trim().split(/\s+/);
        
        overlayEl.innerText = inputEl.value; // Kein Underlining

        let tokens = words.filter(w => this.vocab[w]);
        if(tokens.length === 0) return;

        const x_in = tokens.map((t, i) => this.vocab[t].map((v, d) => v + (d===0 ? i*0.01 : 0)));
        const { weights, output: attn_out } = this.calculateAttention(x_in);
        
        const lastIdx = tokens.length - 1;
        const x_res = attn_out[lastIdx].map((v, i) => v + x_in[lastIdx][i]);
        const x_ffn = [0,1,2].map(i => x_res.reduce((sum, v, j) => sum + v * this.W_ffn[j][i], 0));
        const x_out = x_ffn.map(v => Math.max(0, v));

        const pred = this.getPrediction(x_out, tokens);

        this.plot3D(tokens, x_in, pred.top[0]);
        this.renderAttentionTable(tokens, weights);
        this.renderAttentionMath(tokens, weights);
        this.renderMath(tokens[lastIdx], x_in[lastIdx], attn_out[lastIdx], x_res, x_out);
        this.renderProbs(pred.top);

        if (window.MathJax) MathJax.typesetPromise();
    },

    calculateAttention: function(embs) {
        const n = embs.length;
        let w = Array.from({length:n}, () => Array(n).fill(0));
        for(let i=0; i<n; i++) {
            for(let j=0; j<n; j++) {
                w[i][j] = embs[i].reduce((acc, v, k) => acc + v * embs[j][k], 0);
            }
            let exp = w[i].map(v => Math.exp(v * 2));
            let sum = exp.reduce((a,b) => a+b);
            w[i] = exp.map(v => v/sum);
        }
        const out = embs.map((_, i) => [0,1,2].map(d => embs.reduce((s, curr, j) => s + w[i][j] * curr[d], 0)));
        return { weights: w, output: out };
    },

    plot3D: function(tokens, embs, next) {
        const last = embs[embs.length-1];
        
        // Berechnung der Richtungsvektoren für die Pfeilspitzen (Cones)
        const getCones = (pts, color) => {
            let u = [], v = [], w = [], x = [], y = [], z = [];
            for(let i=1; i < pts.length; i++) {
                x.push(pts[i][0]); y.push(pts[i][1]); z.push(pts[i][2]);
                u.push(pts[i][0] - pts[i-1][0]);
                v.push(pts[i][1] - pts[i-1][1]);
                w.push(pts[i][2] - pts[i-1][2]);
            }
            return { type: 'cone', x, y, z, u, v, w, colorscale: [[0, color], [1, color]], showscale: false, sizemode: 'absolute', sizeref: 0.05 };
        };

        const data = [
            { x: Object.values(this.vocab).map(v=>v[0]), y: Object.values(this.vocab).map(v=>v[1]), z: Object.values(this.vocab).map(v=>v[2]), mode:'markers', text:Object.keys(this.vocab), marker:{size:3, color:'#cbd5e1'}, type:'scatter3d', name:'Vocab' },
            // Blaue Linie (Pfad)
            { x: embs.map(e=>e[0]), y: embs.map(e=>e[1]), z: embs.map(e=>e[2]), mode:'lines+markers+text', text:tokens, line:{width:5, color:'#3b82f6'}, marker:{size:4, color:'#1e3a8a'}, type:'scatter3d', name:'Path' },
            getCones(embs, '#3b82f6'),
            // Grüne gestrichelte Linie (Vorhersage)
            { x: [last[0], next.coords[0]], y: [last[1], next.coords[1]], z: [last[2], next.coords[2]], mode:'lines', line:{width:4, color:'#10b981', dash:'dash'}, type:'scatter3d', name:'Prediction' },
            getCones([last, next.coords], '#10b981')
        ];

        const layout = { 
            margin:{l:0,r:0,b:0,t:0},
            scene: {
                xaxis: {title: 'Macht (Power)'},
                yaxis: {title: 'Alter (Age)'},
                zaxis: {title: 'Geschlecht (Gender)'}
            }
        };
        Plotly.newPlot('plot-embeddings', data, layout);
    },

    renderAttentionTable: function(tokens, weights) {
        let h = `<table class="attn-table"><tr><th style="color:#1e293b">Query \\ Key</th>`;
        tokens.forEach(t => h += `<th>${t}</th>`);
        h += `</tr>`;
        weights.forEach((row, i) => {
            // Hier wird die linke Spalte (Query-Tokens) gerendert
            h += `<tr><td class="row-label" style="background:#f8fafc; border:1px solid #e2e8f0; padding:5px;">${tokens[i]}</td>`;
            row.forEach(w => h += `<td style="background:rgba(59,130,246,${w})">${w.toFixed(2)}</td>`);
            h += `</tr>`;
        });
        document.getElementById('attn-matrix-container').innerHTML = h + `</table>`;
    },

    renderAttentionMath: function(tokens, weights) {
        const lastIdx = tokens.length - 1;
        const w = weights[lastIdx];
        let math = `$$\\vec{v}_{att} = \\sum_{i=0}^{${lastIdx}} w_i \\vec{e}_i = `;
        let parts = tokens.map((t, i) => `${w[i].toFixed(2)} \\cdot \\vec{e}_{\\text{${t}}}`);
        math += parts.join(' + ') + '$$';
        document.getElementById('math-attn-base').innerHTML = math; // Jetzt im grauen Feld
    },

    // Prediction, Math und Probs bleiben unverändert
    getPrediction: function(vec, tokens) {
        const last = tokens[tokens.length - 1];
        let list = Object.keys(this.vocab).map(word => {
            const v = this.vocab[word];
            const dist = Math.sqrt(v.reduce((s, x, i) => s + Math.pow(x - vec[i], 2), 0));
            let p = Math.exp(-dist * 12);
            if (tokens.includes("is")) {
                if (["wise", "strong", "young", "old"].includes(word)) p *= 5.0;
                if (["king", "queen", "man", "woman"].includes(word)) p *= 0.1;
            }
            if (word === last || word === "The") p *= 0.001;
            return { word, prob: p, coords: v };
        });
        const sum = list.reduce((a,b) => a+b.prob, 0);
        list.forEach(s => s.prob /= sum);
        return { top: list.sort((a,b) => b.prob - a.prob).slice(0, 5) };
    },
    renderMath: function(token, x_in, v_att, x_res, x_out) {
        const W_tex = this.W_ffn.map(r => r.join(' & ')).join(' \\\\ ');
        document.getElementById('res-ffn-viz').innerHTML = `
            $$\\vec{x}_{in} [\\text{${token}}] = [${x_in.map(v=>v.toFixed(2))}]$$
            $$\\vec{x}_{res} = \\vec{x}_{in} + \\vec{v}_{att} = [${x_res.map(v=>v.toFixed(2))}]$$
            $$\\vec{x}_{out} = \\text{ReLU}\\left( \\vec{x}_{res} \\cdot W_{ffn} \\right) = [${x_out.map(v=>v.toFixed(2))}]$$
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
