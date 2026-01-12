const TransformerLab = {
    // 3D Space: [Power, Status/Age, Gender]
    vocab: {
        "The": [0.5, 0.5, 0.5], 
        "king": [0.95, 0.8, 0.1], 
        "queen": [0.95, 0.8, 0.9],
        "prince": [0.75, 0.2, 0.1],
        "princess": [0.75, 0.2, 0.9],
        "knight": [0.65, 0.5, 0.1],
        "is": [0.2, 0.5, 0.5],
        "was": [0.2, 0.7, 0.5],
        "rules": [0.9, 0.6, 0.5], 
        "governs": [0.85, 0.6, 0.5],
        "lives": [0.3, 0.5, 0.5],
        "in": [0.1, 0.5, 0.5],
        "wise": [0.8, 0.9, 0.5], 
        "brave": [0.7, 0.4, 0.5],
        "young": [0.2, 0.1, 0.5], 
        "old": [0.2, 0.9, 0.5],
        "palace": [0.9, 0.3, 0.5],
        "castle": [0.85, 0.8, 0.5],
        "village": [0.2, 0.4, 0.5],
        "forest": [0.0, 0.5, 0.5],
        "and": [0.1, 0.5, 0.5],
        "a": [0.1, 0.5, 0.5]
    },

    W_ffn: [[1.5, -0.2, 0.1], [0.1, 1.5, -0.2], [-0.2, 0.1, 1.2]],

    init: function() { this.run(); },

    getHash: function(s) {
        return Math.abs(s.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)) % 10000;
    },

    addToken: function(word) {
        const input = document.getElementById('tf-input');
        input.value = input.value.trim() + " " + word;
        this.run();
    },

    loadPreset: function(txt) {
        document.getElementById('tf-input').value = txt;
        this.run();
    },

    run: async function() {
        const inputEl = document.getElementById('tf-input');
        const words = inputEl.value.trim().split(/\s+/);
        this.renderTokenVisuals(words);
        let tokens = words.filter(w => this.vocab[w]);
        if(tokens.length === 0) return;

        // Embedding + Position Bias
        const x_in = tokens.map((t, i) => this.vocab[t].map((v, d) => v + (d === 0 ? i * 0.03 : 0)));
        const { weights, output: v_att } = this.calculateAttention(x_in);
        const lastIdx = tokens.length - 1;

        const x_res = v_att[lastIdx].map((v, i) => v + x_in[lastIdx][i]);
        const x_ffn = [0,1,2].map(i => x_res.reduce((sum, v, j) => sum + v * this.W_ffn[j][i], 0));
        const x_out = x_ffn.map(v => Math.max(0, v));

        const predFinal = this.getPrediction(x_out, tokens);
        this.plot3D(tokens, x_in, predFinal.top[0]);
        this.renderAttentionTable(tokens, weights);
        this.renderAttentionMath(tokens, weights);
        this.renderMath(x_in[lastIdx], v_att[lastIdx], x_res, x_out);
        this.renderProbs(predFinal.top);

        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([document.getElementById('math-attn-base'), document.getElementById('res-ffn-viz')]).catch(err => console.dir(err));
        }
    },

    calculateAttention: function(embs) {
        const n = embs.length;
        let w = Array.from({length:n}, () => Array(n).fill(0));
        for(let i=0; i<n; i++) {
            for(let j=0; j<n; j++) {
                w[i][j] = embs[i].reduce((acc, v, k) => acc + v * embs[j][k], 0) / Math.sqrt(3);
            }
            let exp = w[i].map(v => Math.exp(v));
            let sum = exp.reduce((a,b) => a+b);
            w[i] = exp.map(v => v/sum);
        }
        const out = embs.map((_, i) => [0,1,2].map(d => embs.reduce((s, curr, j) => s + w[i][j] * curr[d], 0)));
        return { weights: w, output: out };
    },

    getPrediction: function(vec, tokens) {
        const lastWord = tokens[tokens.length - 1];
        const nouns = ["king", "queen", "prince", "princess", "knight"];
        const adjectives = ["wise", "brave", "young", "old"];
        const places = ["palace", "castle", "village", "forest"];

        let list = Object.keys(this.vocab).map(word => {
            const v = this.vocab[word];
            const dist = Math.sqrt(v.reduce((s, x, i) => s + Math.pow(x - vec[i], 2), 0));
            let p = Math.exp(-dist * 12); 

            if (tokens.slice(-5).includes(word)) p *= 0.0001; 

            if (lastWord === "The") {
                if (nouns.includes(word)) p *= 100;
            } else if (nouns.includes(lastWord)) {
                if (["is", "was", "rules", "governs", "lives"].includes(word)) p *= 100;
            } else if (["is", "was"].includes(lastWord)) {
                if (adjectives.includes(word)) p *= 100;
            } else if (adjectives.includes(lastWord) || places.includes(lastWord)) {
                if (word === "and") p *= 800; 
            } else if (lastWord === "and") {
                if (word === "The") p *= 100;
            } else if (["rules", "governs"].includes(lastWord)) {
                if (word === "a") p *= 100;
            } else if (lastWord === "a" || lastWord === "in") {
                if (places.includes(word)) p *= 100;
            } else if (lastWord === "lives") {
                if (word === "in") p *= 100;
            }

            return { word, prob: p, id: this.getHash(word), coords: v };
        });

        const sum = list.reduce((a,b) => a+b.prob, 0);
        list.forEach(s => s.prob /= sum);
        return { top: list.sort((a,b) => b.prob - a.prob).slice(0, 5) };
    },

    plot3D: function(tokens, embs, next) {
        const last = embs[embs.length-1];
        const data = [
            { x: Object.values(this.vocab).map(v=>v[0]), y: Object.values(this.vocab).map(v=>v[1]), z: Object.values(this.vocab).map(v=>v[2]), mode:'markers', text:Object.keys(this.vocab), marker:{size:3, color:'#cbd5e1'}, type:'scatter3d', name:'Vocab' },
            { x: embs.map(e=>e[0]), y: embs.map(e=>e[1]), z: embs.map(e=>e[2]), mode:'lines+markers+text', text:tokens, textposition: 'top center', line:{width:6, color:'#3b82f6'}, marker:{size:5, color:'#1e3a8a'}, type:'scatter3d', name:'Path' },
            { x: [next.coords[0]], y: [next.coords[1]], z: [next.coords[2]], u: [next.coords[0]-last[0]], v: [next.coords[1]-last[1]], w: [next.coords[2]-last[2]], type:'cone', colorscale:[[0, '#10b981'], [1, '#10b981']], showscale:false, sizemode:'absolute', sizeref:0.1, anchor:'tip', name:'Next Tip' },
            { x: [last[0], next.coords[0]], y: [last[1], next.coords[1]], z: [last[2], next.coords[2]], mode:'lines', line:{width:4, color:'#10b981', dash:'dash'}, type:'scatter3d', name:'Next Vector' }
        ];

        Plotly.newPlot('plot-embeddings', data, { 
            margin:{l:0,r:0,b:0,t:0}, paper_bgcolor: 'rgba(0,0,0,0)', 
            scene: { xaxis: {title: 'Power'}, yaxis: {title: 'Status'}, zaxis: {title: 'Gender'} } 
        });
    },

    renderTokenVisuals: function(words) {
        document.getElementById('viz-tokens').innerHTML = words.map(w => `<div style="background: hsl(${this.getHash(w)%360}, 65%, 40%); color: white; padding: 4px 10px; border-radius: 4px; font-family: monospace;">${w}</div>`).join('');
        let table = `<table class="token-table"><tr><th>Token</th><th>ID</th></tr>`;
        words.forEach(w => table += `<tr><td>"${w}"</td><td>${this.getHash(w)}</td></tr>`);
        document.getElementById('token-table-container').innerHTML = table + `</table>`;
    },

    renderAttentionTable: function(tokens, weights) {
        let h = `<table class="attn-table"><tr><th class="row-label">Q \\ K</th>`;
        tokens.forEach(t => h += `<th>${t}</th>`);
        h += `</tr>`;
        weights.forEach((row, i) => {
            h += `<tr><td class="row-label">${tokens[i]}</td>`;
            row.forEach(w => h += `<td style="background:rgba(59, 130, 246, ${w}); color:${w > 0.4 ? 'white' : 'black'};">${w.toFixed(2)}</td>`);
            h += `</tr>`;
        });
        document.getElementById('attn-matrix-container').innerHTML = h + `</table>`;
    },

    renderAttentionMath: function(tokens, weights) {
        const lastIdx = tokens.length - 1;
        const qToken = tokens[lastIdx];
        const w = weights[lastIdx];
        let parts = tokens.map((kToken, i) => {
            const score = w[i].toFixed(2);
            return `\\underbrace{${score}}_{\\text{Score}} \\cdot \\vec{e}_{\\text{${kToken}}}`;
        });
        document.getElementById('math-attn-base').innerHTML = `$$\\vec{v}_{att} = ` + parts.join(' + ') + `$$`;
    },

    renderMath: function(x_in, v_att, x_res, x_out) {
        const fmtVec = (vec) => `\\begin{bmatrix} ${vec.map(v => v.toFixed(2)).join('\\\\')} \\end{bmatrix}`;
        const mathHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="math-step">
                    <small style="color: #64748b; font-weight: bold;">SUB-LAYER 1: ADD & NORM</small>
                    $$ \\underbrace{\\vec{x}_{res}}_{\\text{Update Stream}} = \\text{LN}(\\underbrace{${fmtVec(x_in)}}_{\\text{Input } \\vec{x}_{in}} + \\underbrace{${fmtVec(v_att)}}_{\\text{Context } \\vec{v}_{att}}) $$
                </div>
                <div class="math-step">
                    <small style="color: #64748b; font-weight: bold;">SUB-LAYER 2: POSITION-WISE FFN</small>
                    $$ \\underbrace{${fmtVec(x_out)}}_{\\text{Output } \\vec{x}_{out}} = \\max(0, \\underbrace{${fmtVec(x_res)}}_{\\vec{x}_{res}} \\cdot \\underbrace{\\begin{bmatrix} 1.5 & -0.2 & 0.1 \\\\ 0.1 & 1.5 & -0.2 \\\\ -0.2 & 0.1 & 1.2 \\end{bmatrix}}_{W_{ffn}}) $$
                </div>
            </div>`;
        document.getElementById('res-ffn-viz').innerHTML = mathHTML;
    },

    renderProbs: function(top) {
        document.getElementById('prob-bars-container').innerHTML = top.map(s => `
        <div class="prob-item" onclick="TransformerLab.addToken('${s.word}')">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                <span><b>${s.word}</b></span>
                <span>${(s.prob*100).toFixed(1)}%</span>
            </div>
            <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #3b82f6; width: ${s.prob*100}%; height: 100%;"></div>
            </div>
        </div>`).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
