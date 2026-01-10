const TransformerLab = {
    // Unser kleiner semantischer Raum (Power, Age, Gender)
    vocab: {
        "The": [0.1, 0.5, 0.5],
        "king": [0.9, 0.8, 0.1],
        "queen": [0.9, 0.8, 0.9],
        "man": [0.3, 0.6, 0.1],
        "woman": [0.3, 0.6, 0.9],
        "boy": [0.1, 0.2, 0.1],
        "girl": [0.1, 0.2, 0.9],
        "rules": [0.7, 0.5, 0.5],
        "is": [0.2, 0.5, 0.5],
        "young": [0.1, 0.1, 0.5],
        "old": [0.1, 0.9, 0.5]
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
            input.value += " " + this.lastPrediction;
            this.run();
        }
    },

    run: function() {
        const text = document.getElementById('tf-input').value;
        const tokens = text.split(/\s+/).filter(t => this.vocab[t]);
        
        // UI Token Stream
        document.getElementById('token-stream').innerHTML = tokens.map(t => `<span class="badge-tk">${t}</span>`).join('');

        // 1. Embedding Stage
        const x_embeddings = tokens.map(t => this.vocab[t]);
        this.plot3DSpace(tokens, x_embeddings);

        // 2. Multi-Head Attention (vereinfacht: 1 Head)
        // Wir berechnen Q, K, V (hier mit fixen Matrizen für Demo)
        const { weights, output: attn_output } = this.calculateAttention(x_embeddings);
        this.plotAttentionHeatmap(tokens, weights);

        // 3. ResNet (Add & Norm)
        const res_output = this.calculateAddNorm(x_embeddings, attn_output);

        // 4. Feed Forward (FFN)
        const ffn_output = this.calculateFFN(res_output);

        // 5. Output / Softmax
        this.calculateSoftmax(ffn_output[ffn_output.length - 1]);

        if (window.MathJax) MathJax.typesetPromise();
    },

    plot3DSpace: function(tokens, currentEmbs) {
        const data = [];
        
        // Alle Wörter im Vokabular als graue Punkte
        const allWords = Object.keys(this.vocab);
        data.push({
            x: allWords.map(w => this.vocab[w][0]),
            y: allWords.map(w => this.vocab[w][1]),
            z: allWords.map(w => this.vocab[w][2]),
            mode: 'markers+text',
            text: allWords,
            marker: { size: 5, color: '#cbd5e1' },
            type: 'scatter3d',
            name: 'Vokabular'
        });

        // Aktuelle Sequenz als farbige Punkte mit Pfad
        data.push({
            x: currentEmbs.map(e => e[0]),
            y: currentEmbs.map(e => e[1]),
            z: currentEmbs.map(e => e[2]),
            mode: 'lines+markers+text',
            text: tokens,
            line: { width: 6, color: '#3b82f6' },
            marker: { size: 8, color: '#1e3a8a' },
            type: 'scatter3d',
            name: 'Input Sequenz'
        });

        const layout = { 
            margin: {l:0,r:0,b:0,t:0}, 
            scene: {
                xaxis: {title: 'Macht'}, yaxis: {title: 'Alter'}, zaxis: {title: 'Geschlecht'}
            }
        };
        Plotly.newPlot('plot-embeddings', data, layout);
    },

    calculateAttention: function(embs) {
        const n = embs.length;
        let weights = Array.from({length: n}, () => Array(n).fill(0));
        
        // Score = Q * K^T
        for(let i=0; i<n; i++) {
            for(let j=0; j<n; j++) {
                // Skalarprodukt simuliert Ähnlichkeit
                let dot = embs[i].reduce((sum, val, idx) => sum + val * embs[j][idx], 0);
                weights[i][j] = Math.exp(dot); 
            }
            let sum = weights[i].reduce((a,b) => a+b);
            weights[i] = weights[i].map(w => w/sum);
        }

        const output = embs.map((_, i) => {
            return [0,0,0].map((_, dim) => {
                return embs.reduce((sum, currEmb, j) => sum + weights[i][j] * currEmb[dim], 0);
            });
        });

        return { weights, output };
    },

    plotAttentionHeatmap: function(tokens, weights) {
        const data = [{
            z: weights,
            x: tokens,
            y: tokens,
            type: 'heatmap',
            colorscale: 'Blues'
        }];
        Plotly.newPlot('plot-attn-heatmap', data, { margin: {t:30, b:50}, title: 'Attention Weights' });

        document.getElementById('math-attn-details').innerHTML = `
            <b>Konkrete Berechnung (Row 0):</b><br>
            $Score_{0,j} = Q_0 \cdot K_j$<br>
            $W_{0} = [${weights[0].map(w => w.toFixed(2)).join(', ')}]$
        `;
    },

    calculateAddNorm: function(original, attn) {
        // ResNet: x + Attention(x)
        const lastIdx = original.length - 1;
        const x = original[lastIdx];
        const sub = attn[lastIdx];
        const result = x.map((v, i) => (v + sub[i]) / 1.1); // Mini-Normierung

        document.getElementById('res-in').innerHTML = `Original:<br>[${x.map(v=>v.toFixed(2))}]`;
        document.getElementById('res-f').innerHTML = `Attn-Output:<br>[${sub.map(v=>v.toFixed(2))}]`;
        document.getElementById('res-out').innerHTML = `LayerNorm:<br>[${result.map(v=>v.toFixed(2))}]`;

        return attn; // Wir geben die ganze Matrix weiter
    },

    calculateFFN: function(data) {
        // FFN: max(0, xW + b) -> ReLU
        const last = data[data.length-1];
        const ffn = last.map(v => Math.max(0, v * 1.5 - 0.2));
        
        document.getElementById('ffn-viz').innerHTML = `
            <b>Feed Forward Branch:</b><br>
            $x_{in} = [${last.map(v=>v.toFixed(2))}]$ <br>
            $ReLU(xW+b) \rightarrow [${ffn.map(v=>v.toFixed(2))}]$
        `;
        return data.map((v, i) => i === data.length - 1 ? ffn : v);
    },

    calculateSoftmax: function(lastVec) {
        let scores = Object.keys(this.vocab).map(word => {
            const wordVec = this.vocab[word];
            // Euklidischer Abstand im 3D Raum
            const dist = Math.sqrt(lastVec.reduce((s, v, i) => s + Math.pow(v - wordVec[i], 2), 0));
            return { word, prob: Math.exp(-dist * 5) };
        });

        const sum = scores.reduce((a, b) => a + b.prob, 0);
        scores.forEach(s => s.prob = (s.prob / sum));
        scores.sort((a, b) => b.prob - a.prob);

        this.lastPrediction = scores[0].word;

        const plotData = [{
            x: scores.slice(0, 5).map(s => s.word),
            y: scores.slice(0, 5).map(s => s.prob),
            type: 'bar',
            marker: { color: '#3b82f6' }
        }];

        Plotly.newPlot('plot-softmax', plotData, { 
            margin: {t:10, b:40, l:40, r:10},
            yaxis: { range: [0, 1] }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => TransformerLab.init());
