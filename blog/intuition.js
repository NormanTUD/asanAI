// intuition.js

/**
 * Interactive Visualizations for LLM Intuition Steps
 * Covers: Tokenization, Embedding, Positional Encoding, Transformer Layers, Final Prediction
 */

// ============================================================
// STEP 1: TOKENIZATION VISUALIZER
// ============================================================

const TokenizerViz = {
    // Simple mock tokenizer with subword splitting
    vocabulary: {
        'once': 1024, 'upon': 2048, 'a': 64, 'time': 3072, 'the': 128,
        'king': 4096, 'queen': 4097, 'was': 512, 'there': 2560, 'dragon': 5120,
        'under': 6001, 'standing': 6002, 'understanding': null, // will be split
        'un': 7001, 'break': 7002, 'able': 7003, 'unbreakable': null,
        'hello': 8001, 'world': 8002, 'cat': 9001, 'sat': 9002, 'on': 9003,
        'mat': 9004, 'is': 256, 'good': 3500, 'great': 3501, 'big': 3502,
        'small': 3503, 'happy': 3600, 'sad': 3601, 'love': 3700, 'hat': 3800,
        'play': 7010, 'ing': 7011, 'ed': 7012, 'er': 7013, 'ly': 7014,
        'pre': 7020, 'dict': 7021, 'ion': 7022, 'trans': 7030, 'form': 7031,
        'predict': null, 'prediction': null, 'transformer': null, 'playing': null,
        'played': null, 'player': null, 'greatly': null, 'sadly': null,
        'i': 40, 'you': 41, 'he': 42, 'she': 43, 'it': 44, 'we': 45,
        'they': 46, 'my': 47, 'your': 48, 'his': 49, 'her': 50,
        'this': 51, 'that': 52, 'with': 53, 'for': 54, 'not': 55,
        'but': 56, 'and': 57, 'or': 58, 'in': 59, 'to': 60,
        'of': 61, 'at': 62, 'by': 63, 'from': 65, 'up': 66,
        'about': 67, 'into': 68, 'over': 69, 'after': 70,
    },

    // Subword splitting rules (simplified BPE-like)
    splitRules: {
        'understanding': ['under', 'standing'],
        'unbreakable': ['un', 'break', 'able'],
        'prediction': ['pre', 'dict', 'ion'],
        'predict': ['pre', 'dict'],
        'transformer': ['trans', 'form', 'er'],
        'playing': ['play', 'ing'],
        'played': ['play', 'ed'],
        'player': ['play', 'er'],
        'greatly': ['great', 'ly'],
        'sadly': ['sad', 'ly'],
    },

    tokenColors: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
        '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7', '#d946ef'
    ],

    animationInProgress: false,

    tokenize: function(text) {
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const tokens = [];

        words.forEach(word => {
            // Check if word needs subword splitting
            if (this.splitRules[word]) {
                const parts = this.splitRules[word];
                parts.forEach((part, idx) => {
                    tokens.push({
                        text: idx > 0 ? '##' + part : part,
                        displayText: part,
                        id: this.vocabulary[part] || Math.floor(Math.random() * 10000),
                        isSubword: idx > 0,
                        originalWord: word,
                        splitIndex: idx,
                        splitTotal: parts.length
                    });
                });
            } else if (this.vocabulary[word] != null) {
                tokens.push({
                    text: word,
                    displayText: word,
                    id: this.vocabulary[word],
                    isSubword: false,
                    originalWord: word,
                    splitIndex: 0,
                    splitTotal: 1
                });
            } else {
                // Unknown word — treat as single token with random ID
                tokens.push({
                    text: word,
                    displayText: word,
                    id: Math.floor(Math.random() * 50000),
                    isSubword: false,
                    originalWord: word,
                    splitIndex: 0,
                    splitTotal: 1
                });
            }
        });

        return tokens;
    },

    render: function() {
        const input = document.getElementById('tokenizer-input');
        const outputDiv = document.getElementById('tokenizer-output');
        const statsDiv = document.getElementById('tokenizer-stats');
        if (!input || !outputDiv) return;

        const text = input.value || 'Once upon a time';
        const tokens = this.tokenize(text);

        // Render token chips
        let html = '<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; min-height:60px;">';
        tokens.forEach((token, i) => {
            const color = this.tokenColors[i % this.tokenColors.length];
            const borderStyle = token.isSubword ? 'border-left:3px dashed ' + color : 'border-left:3px solid ' + color;
            html += `
                <div class="token-chip" style="
                    display:inline-flex; flex-direction:column; align-items:center;
                    padding:8px 14px; background:white; border-radius:8px;
                    ${borderStyle}; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0;
                    box-shadow:0 2px 4px rgba(0,0,0,0.06);
                    animation: tokenAppear 0.3s ease-out ${i * 0.08}s both;
                    cursor:default; transition: transform 0.15s;
                " onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span style="font-weight:bold; font-size:1.05em; color:${color};">${token.displayText}</span>
                    <span style="font-size:0.7em; color:#94a3b8; font-family:monospace;">ID: ${token.id}</span>
                    ${token.isSubword ? '<span style="font-size:0.6em; color:#f59e0b;">subword</span>' : ''}
                </div>`;
        });
        html += '</div>';

        outputDiv.innerHTML = html;

        // Stats
        if (statsDiv) {
            const subwordCount = tokens.filter(t => t.isSubword).length;
            const uniqueWords = [...new Set(tokens.map(t => t.originalWord))].length;
            statsDiv.innerHTML = `
                <div style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap; font-size:0.85em; color:#475569;">
                    <span><b>${tokens.length}</b> tokens</span>
                    <span><b>${uniqueWords}</b> words</span>
                    <span><b>${subwordCount}</b> subword splits</span>
                    <span>Vocab IDs: [${tokens.map(t => t.id).join(', ')}]</span>
                </div>`;
        }
    }
};


// ============================================================
// STEP 2: EMBEDDING VISUALIZER
// ============================================================

const EmbeddingViz = {
    // Simplified 2D embedding positions for common words
    embeddings: {
        'once': [2, 5], 'upon': [3, 5.5], 'a': [0, 0.5], 'time': [4, 3],
        'the': [0.5, 0.2], 'king': [8, -3], 'queen': [8, 3],
        'man': [3, -3], 'woman': [3, 3], 'prince': [6, -3], 'princess': [6, 3],
        'boy': [-1, -3], 'girl': [-1, 3],
        'cat': [-5, -6], 'dog': [-5, -4], 'dragon': [-3, -8],
        'happy': [6, 6], 'sad': [-6, 6], 'love': [7, 7],
        'was': [1, 1], 'there': [2.5, 2], 'is': [0.8, 0.8],
        'good': [5, 5], 'great': [6, 5.5], 'big': [4, -1], 'small': [-4, -1],
    },

    currentDemo: 'basic', // 'basic' or 'arithmetic'
    arithmeticResult: null,

    render: function() {
        const plotDiv = document.getElementById('embedding-viz-plot');
        if (!plotDiv) return;

        const input = document.getElementById('embedding-viz-input');
        const text = (input ? input.value : 'king queen man woman').toLowerCase();
        const words = text.split(/\s+/).filter(w => this.embeddings[w]);

        const traces = [];

        // Background vocabulary (faded)
        const bgWords = Object.keys(this.embeddings).filter(w => !words.includes(w));
        if (bgWords.length > 0) {
            traces.push({
                x: bgWords.map(w => this.embeddings[w][0]),
                y: bgWords.map(w => this.embeddings[w][1]),
                text: bgWords,
                mode: 'markers+text',
                textposition: 'top center',
                textfont: { size: 9, color: '#cbd5e1' },
                marker: { size: 5, color: '#e2e8f0', opacity: 0.5 },
                showlegend: false,
                hovertemplate: '<b>%{text}</b><br>(%{x:.1f}, %{y:.1f})<extra></extra>'
            });
        }

        // Active words
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        words.forEach((word, i) => {
            const pos = this.embeddings[word];
            traces.push({
                x: [pos[0]], y: [pos[1]],
                text: [word],
                mode: 'markers+text',
                textposition: 'top center',
                textfont: { size: 13, color: colors[i % colors.length], weight: 'bold' },
                marker: { size: 14, color: colors[i % colors.length], line: { width: 2, color: '#fff' } },
                showlegend: false,
                hovertemplate: `<b>${word}</b><br>Vector: (${pos[0]}, ${pos[1]})<extra></extra>`
            });
        });

        // Vector arithmetic demo
        if (this.arithmeticResult) {
            const r = this.arithmeticResult;
            // Draw arrows for the arithmetic
            if (r.steps) {
                r.steps.forEach(step => {
                    traces.push({
                        x: [step.from[0], step.to[0]],
                        y: [step.from[1], step.to[1]],
                        mode: 'lines',
                        line: { color: '#3b82f6', width: 3, dash: 'dash' },
                        showlegend: false,
                        hoverinfo: 'skip'
                    });
                });
            }
            // Result point
            traces.push({
                x: [r.pos[0]], y: [r.pos[1]],
                text: ['≈ ' + r.nearest],
                mode: 'markers+text',
                textposition: 'bottom center',
                textfont: { size: 14, color: '#ef4444', weight: 'bold' },
                marker: { size: 18, color: '#ef4444', symbol: 'diamond', line: { width: 2, color: '#fff' } },
                showlegend: false,
                hovertemplate: `<b>Result ≈ ${r.nearest}</b><br>(${r.pos[0].toFixed(1)}, ${r.pos[1].toFixed(1)})<extra></extra>`
            });
        }

        const layout = {
            margin: { l: 40, r: 40, b: 40, t: 20 },
            showlegend: false,
            xaxis: { title: 'Dimension 1', range: [-10, 12], gridcolor: '#f1f5f9', zeroline: true, zerolinecolor: '#e2e8f0' },
            yaxis: { title: 'Dimension 2', range: [-10, 10], gridcolor: '#f1f5f9', zeroline: true, zerolinecolor: '#e2e8f0', scaleanchor: 'x' },
            plot_bgcolor: '#fff'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
    },

    doArithmetic: function() {
        const input = document.getElementById('embedding-arithmetic-input');
        if (!input) return;

        const expr = input.value.toLowerCase().trim();
        // Parse simple "king - man + woman" style expressions
        const tokens = expr.match(/[a-z]+|[+\-]/g);
        if (!tokens) return;

        let result = null;
        let op = '+';
        const steps = [];

        tokens.forEach(token => {
            if (token === '+' || token === '-') {
                op = token;
            } else if (this.embeddings[token]) {
                const vec = this.embeddings[token];
                if (result === null) {
                    result = [...vec];
                } else {
                    const prev = [...result];
                    if (op === '+') {
                        result[0] += vec[0];
                        result[1] += vec[1];
                    } else {
                        result[0] -= vec[0];
                        result[1] -= vec[1];
                    }
                    steps.push({ from: prev, to: [...result] });
                }
            }
        });

        if (result) {
            // Find nearest word
            let nearest = '';
            let minDist = Infinity;
            Object.entries(this.embeddings).forEach(([word, vec]) => {
                const d = Math.sqrt(Math.pow(vec[0] - result[0], 2) + Math.pow(vec[1] - result[1], 2));
                if (d < minDist) { minDist = d; nearest = word; }
            });

            this.arithmeticResult = { pos: result, nearest, steps };

            const resultDiv = document.getElementById('embedding-arithmetic-result');
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <span style="font-size:1.1em;">Result: <b style="color:#ef4444;">(${result[0].toFixed(1)}, ${result[1].toFixed(1)})</b>
                    ≈ <b style="color:#10b981;">"${nearest}"</b>
                    <span style="color:#94a3b8; font-size:0.85em;">(distance: ${minDist.toFixed(2)})</span></span>`;
            }
        }

        this.render();
    }
};


// ============================================================
// STEP 3: POSITIONAL ENCODING VISUALIZER
// ============================================================

const PositionalEncodingViz = {
    numDimensions: 8, // Show 8 dimensions of positional encoding
    maxPositions: 20,

    // Compute sinusoidal positional encoding
    computePE: function(pos, dim, dModel) {
        dModel = dModel || 64;
        if (dim % 2 === 0) {
            return Math.sin(pos / Math.pow(10000, dim / dModel));
        } else {
            return Math.cos(pos / Math.pow(10000, (dim - 1) / dModel));
        }
    },

    render: function() {
        const plotDiv = document.getElementById('positional-encoding-plot');
        if (!plotDiv) return;

        const numDims = parseInt(document.getElementById('pe-num-dims')?.value || 8);
        const dModel = 64;

        const traces = [];
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
            '#f97316', '#6366f1', '#14b8a6', '#e11d48'
        ];

        for (let dim = 0; dim < numDims; dim++) {
            const x = [];
            const y = [];
            for (let pos = 0; pos < this.maxPositions; pos++) {
                x.push(pos);
                y.push(this.computePE(pos, dim, dModel));
            }
            traces.push({
                x: x, y: y,
                mode: 'lines+markers',
                name: `Dim ${dim} (${dim % 2 === 0 ? 'sin' : 'cos'})`,
                line: { color: colors[dim % colors.length], width: 2 },
                marker: { size: 4, color: colors[dim % colors.length] },
                hovertemplate: `Dim ${dim}<br>Pos: %{x}<br>Value: %{y:.4f}<extra></extra>`
            });
        }

        const layout = {
            margin: { l: 50, r: 20, b: 50, t: 20 },
            xaxis: { title: 'Token Position', dtick: 1, gridcolor: '#f1f5f9' },
            yaxis: { title: 'Encoding Value', range: [-1.3, 1.3], gridcolor: '#f1f5f9' },
            showlegend: true,
            legend: { x: 1, y: 1, xanchor: 'right', bgcolor: 'rgba(255,255,255,0.9)', font: { size: 10 } },
            plot_bgcolor: '#fff'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

        // Render the heatmap
        this.renderHeatmap(numDims, dModel);
    },

    renderHeatmap: function(numDims, dModel) {
        const plotDiv = document.getElementById('positional-encoding-heatmap');
        if (!plotDiv) return;

        const zData = [];
        for (let pos = 0; pos < this.maxPositions; pos++) {
            const row = [];
            for (let dim = 0; dim < numDims; dim++) {
                row.push(this.computePE(pos, dim, dModel));
            }
            zData.push(row);
        }

        const trace = {
            z: zData,
            x: Array.from({ length: numDims }, (_, i) => `Dim ${i}`),
            y: Array.from({ length: this.maxPositions }, (_, i) => `Pos ${i}`),
            type: 'heatmap',
            colorscale: [
                [0, '#3b82f6'],
                [0.5, '#f8fafc'],
                [1, '#ef4444']
            ],
            showscale: true,
            hovertemplate: '%{y}, %{x}<br>Value: %{z:.4f}<extra></extra>'
        };

        const layout = {
            margin: { l: 60, r: 20, b: 50, t: 10 },
            xaxis: { title: 'Embedding Dimension' },
            yaxis: { title: 'Token Position', autorange: 'reversed' },
            plot_bgcolor: '#fff'
        };

        Plotly.react(plotDiv, [trace], layout, { displayModeBar: false, responsive: true });
    },

    renderAdditionDemo: function() {
        const container = document.getElementById('pe-addition-demo');
        if (!container) return;

        const word = document.getElementById('pe-demo-word')?.value || 'cat';
        const pos1 = parseInt(document.getElementById('pe-demo-pos1')?.value || 0);
        const pos2 = parseInt(document.getElementById('pe-demo-pos2')?.value || 5);
        const dModel = 64;
        const numDims = 4;

        // Mock embedding for the word
        const baseEmb = [0.22, 0.85, -0.41, 0.09];

        const pe1 = [], pe2 = [], final1 = [], final2 = [];
        for (let d = 0; d < numDims; d++) {
            const p1 = this.computePE(pos1, d, dModel);
            const p2 = this.computePE(pos2, d, dModel);
            pe1.push(p1);
            pe2.push(p2);
            final1.push(baseEmb[d] + p1);
            final2.push(baseEmb[d] + p2);
        }

        container.innerHTML = `
            <div style="font-family:monospace; font-size:0.85em; line-height:2; padding:12px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
                <div style="margin-bottom:8px;">
                    <b style="color:#3b82f6;">"${word}" at position ${pos1}:</b><br>
                    Embedding: [${baseEmb.map(v => v.toFixed(2)).join(', ')}]<br>
                    <span style="color:#10b981;">+ Position ${pos1}: [${pe1.map(v => v.toFixed(2)).join(', ')}]</span><br>
                    <span style="color:#8b5cf6;">= Final: [${final1.map(v => v.toFixed(2)).join(', ')}]</span>
                </div>
                <div>
                    <b style="color:#ef4444;">"${word}" at position ${pos2}:</b><br>
                    Embedding: [${baseEmb.map(v => v.toFixed(2)).join(', ')}]<br>
                    <span style="color:#10b981;">+ Position ${pos2}: [${pe2.map(v => v.toFixed(2)).join(', ')}]</span><br>
                    <span style="color:#8b5cf6;">= Final: [${final2.map(v => v.toFixed(2)).join(', ')}]</span>
                </div>
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0; color:#64748b;">
                    ⚡ Same word, different positions → <b>different vectors</b>!<br>
                    This is how "The <b>dog</b> bites man" differs from "The man bites <b>dog</b>".
                </div>
            </div>`;
    }
};


// ============================================================
// STEP 4: TRANSFORMER LAYERS — RESIDUAL STREAM VISUALIZER
// ============================================================

const ResidualStreamViz = {
    tokens: ['Once', 'upon', 'a', 'time'],
    numLayers: 6,
    animating: false,
    currentLayer: 0,
    animFrame: null,

    // Simulated token vectors at each layer (2D for visualization)
    layerStates: null,

    init: function() {
        // Generate simulated layer-by-layer evolution
        // Each token starts at a position and gets nudged by each layer
        const starts = {
            'Once': [1, 4],
            'upon': [2, 5],
            'a': [0, 1],
            'time': [3, 3]
        };

        // Simulated attention + FFN nudges per layer
        const nudges = [
            // Layer 0: Attention pulls related words together
            { 'Once': [0.3, -0.2], 'upon': [-0.1, -0.3], 'a': [0.5, 0.5], 'time': [0.2, 0.4] },
            // Layer 1: FFN refines
            { 'Once': [0.1, 0.3], 'upon': [0.4, 0.1], 'a': [-0.2, 0.3], 'time': [0.5, -0.1] },
            // Layer 2: Deeper patterns
            { 'Once': [0.5, 0.1], 'upon': [0.2, 0.5], 'a': [0.3, -0.1], 'time': [0.1, 0.6] },
            // Layer 3: Semantic clustering
            { 'Once': [-0.1, 0.4], 'upon': [0.3, -0.2], 'a': [0.1, 0.2], 'time': [0.4, 0.3] },
            // Layer 4: Final refinement
            { 'Once': [0.2, 0.1], 'upon': [0.1, 0.3], 'a': [0.0, 0.1], 'time': [0.3, 0.2] },
            // Layer 5: Output preparation
            { 'Once': [0.1, 0.0], 'upon': [0.0, 0.1], 'a': [0.1, 0.0], 'time': [0.2, 0.1] },
        ];

        this.layerStates = {};
        this.tokens.forEach(token => {
            this.layerStates[token] = [starts[token]];
            let current = [...starts[token]];
            nudges.forEach(layerNudge => {
                const nudge = layerNudge[token];
                current = [current[0] + nudge[0], current[1] + nudge[1]];
                this.layerStates[token].push([...current]);
            });
        });
    },

    render: function() {
        if (!this.layerStates) this.init();

        const plotDiv = document.getElementById('residual-stream-plot');
        if (!plotDiv) return;

        const layer = this.currentLayer;
        const traces = [];
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

        this.tokens.forEach((token, i) => {
            const states = this.layerStates[token];
            const color = colors[i];

            // Trail (path through layers)
            const trailX = [], trailY = [];
            for (let l = 0; l <= layer; l++) {
                trailX.push(states[l][0]);
                trailY.push(states[l][1]);
            }

            // Trail line
            if (trailX.length > 1) {
                traces.push({
                    x: trailX, y: trailY,
                    mode: 'lines',
                    line: { color: color, width: 2, dash: 'dot' },
                    showlegend: false,
                    hoverinfo: 'skip',
                    opacity: 0.4
                });

                // Previous positions (faded dots)
                traces.push({
                    x: trailX.slice(0, -1), y: trailY.slice(0, -1),
                    mode: 'markers',
                    marker: { size: 5, color: color, opacity: 0.25 },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            }

            // Current position
            const pos = states[layer];
            traces.push({
                x: [pos[0]], y: [pos[1]],
                text: [token],
                mode: 'markers+text',
                textposition: 'top center',
                textfont: { size: 13, color: color, weight: 'bold' },
                marker: { size: 14, color: color, line: { width: 2, color: '#fff' } },
                showlegend: false,
                hovertemplate: `<b>${token}</b><br>Layer ${layer}<br>(${pos[0].toFixed(2)}, ${pos[1].toFixed(2)})<extra></extra>`
            });

            // Nudge arrow (if not at input layer)
            if (layer > 0) {
                const prev = states[layer - 1];
                traces.push({
                    x: [prev[0], pos[0]], y: [prev[1], pos[1]],
                    mode: 'lines',
                    line: { color: color, width: 3 },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            }
        });

        const annotations = [{
            x: 0.5, y: 1.05, xref: 'paper', yref: 'paper',
            text: `<b>Layer ${layer} of ${this.numLayers}</b> — ${layer === 0 ? 'Input embeddings' : layer < this.numLayers ? 'Residual stream being refined' : 'Final representations'}`,
            showarrow: false,
            font: { size: 13, color: '#475569' }
        }];

        const layout = {
            margin: { l: 40, r: 40, b: 40, t: 40 },
            showlegend: false,
            xaxis: { title: 'Dimension 1', range: [-1, 7], gridcolor: '#f1f5f9' },
            yaxis: { title: 'Dimension 2', range: [-1, 9], gridcolor: '#f1f5f9', scaleanchor: 'x' },
            annotations: annotations,
            plot_bgcolor: '#fff'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

        // Update layer info
        const infoDiv = document.getElementById('residual-stream-info');
        if (infoDiv) {
            const descriptions = [
                'Raw token embeddings + positional encoding. No context yet.',
                'Layer 1 (Attention): Tokens start "looking" at each other. Pronouns begin linking to nouns.',
                'Layer 2 (FFN): Knowledge patterns activate. The model starts recognizing phrases.',
                'Layer 3 (Attention): Deeper relationships form. "Once upon a" strongly predicts fairy tales.',
                'Layer 4 (FFN): Semantic clusters tighten. Tokens carry rich contextual meaning.',
                'Layer 5 (Attention): Fine-grained adjustments. Almost ready for prediction.',
                'Layer 6 (Output): Final representations. The last token\'s vector will produce the next-word prediction.'
            ];
            infoDiv.innerHTML = `
                <div style="padding:10px 14px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; font-size:0.85em; color:#475569;">
                    <b style="color:#1e293b;">Layer ${layer}:</b> ${descriptions[layer]}
                    <div style="margin-top:6px; font-family:monospace; font-size:0.8em; color:#94a3b8;">
                        x := x + Layer(x) — each layer <b>adds</b> to the residual stream, never replaces.
                    </div>
                </div>`;
        }
    },

    animate: function() {
        if (this.animating) return;
        this.animating = true;
        this.currentLayer = 0;

        const btn = document.getElementById('residual-stream-play');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }

        const step = () => {
            this.render();
            if (this.currentLayer < this.numLayers) {
                this.currentLayer++;
                setTimeout(step, 800);
            } else {
                this.animating = false;
                if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            }
        };
        step();
    },

    setLayer: function(layer) {
        this.currentLayer = layer;
        this.render();
    }
};


// ============================================================
// STEP 5: FINAL PREDICTION VISUALIZER
// ============================================================

const PredictionViz = {
    // Mock vocabulary with probabilities at different temperatures
    vocabulary: [
        { word: 'time', baseScore: 3.2 },
        { word: 'day', baseScore: 1.8 },
        { word: 'night', baseScore: 1.5 },
        { word: 'hill', baseScore: -0.5 },
        { word: 'table', baseScore: -1.2 },
        { word: 'dragon', baseScore: 0.8 },
        { word: 'king', baseScore: 0.6 },
        { word: 'warm', baseScore: -0.8 },
        { word: 'beautiful', baseScore: 0.3 },
        { word: 'the', baseScore: -1.5 },
        { word: 'very', baseScore: -0.3 },
        { word: 'summer', baseScore: 1.0 },
    ],

    softmax: function(scores, temperature) {
        temperature = Math.max(temperature, 0.01);
        const scaled = scores.map(s => s / temperature);
        const maxS = Math.max(...scaled);
        const exps = scaled.map(s => Math.exp(s - maxS));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
    },

    render: function() {
        const plotDiv = document.getElementById('prediction-plot');
        if (!plotDiv) return;

        const tempSlider = document.getElementById('prediction-temperature');
        const temperature = tempSlider ? parseFloat(tempSlider.value) : 1.0;

        const tempLabel = document.getElementById('prediction-temp-val');
        if (tempLabel) {
            let desc = '';
            if (temperature < 0.3) desc = ' (very greedy)';
            else if (temperature < 0.7) desc = ' (focused)';
            else if (temperature < 1.3) desc = ' (balanced)';
            else if (temperature < 2.0) desc = ' (creative)';
            else desc = ' (very random)';
            tempLabel.textContent = temperature.toFixed(2) + desc;
        }

        const scores = this.vocabulary.map(v => v.baseScore);
        const probs = this.softmax(scores, temperature);

        // Sort by probability for display
        const items = this.vocabulary.map((v, i) => ({
            word: v.word,
            score: v.baseScore,
            prob: probs[i]
        })).sort((a, b) => b.prob - a.prob);

        const colors = items.map((item, i) => {
            if (i === 0) return '#3b82f6';
            if (i === 1) return '#10b981';
            if (i === 2) return '#f59e0b';
            return '#94a3b8';
        });

        const trace = {
            x: items.map(it => it.prob),
            y: items.map(it => it.word),
            type: 'bar',
            orientation: 'h',
            marker: {
                color: colors,
                line: { width: 1, color: '#fff' }
            },
            text: items.map(it => (it.prob * 100).toFixed(1) + '%'),
            textposition: 'outside',
            textfont: { size: 11 },
            hovertemplate: '<b>%{y}</b><br>P = %{x:.4f} (%{text})<extra></extra>'
        };

        const layout = {
            margin: { l: 80, r: 60, b: 40, t: 10 },
            xaxis: {
                title: 'Probability',
                range: [0, Math.min(1, Math.max(...items.map(it => it.prob)) * 1.3)],
                gridcolor: '#f1f5f9'
            },
            yaxis: {
                autorange: 'reversed',
                tickfont: { size: 12 }
            },
            plot_bgcolor: '#fff',
            bargap: 0.15
        };

        Plotly.react(plotDiv, [trace], layout, { displayModeBar: false, responsive: true });

        // Update info
        const infoDiv = document.getElementById('prediction-info');
        if (infoDiv) {
            const top = items[0];
            const entropy = -items.reduce((s, it) => s + (it.prob > 0 ? it.prob * Math.log2(it.prob) : 0), 0);
            infoDiv.innerHTML = `
                <div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center; font-size:0.85em; color:#475569;">
                    <span>🏆 Top pick: <b style="color:#3b82f6;">"${top.word}"</b> (${(top.prob * 100).toFixed(1)}%)</span>
                    <span>🌡️ Temperature: <b>${temperature.toFixed(2)}</b></span>
                    <span>📊 Entropy: <b>${entropy.toFixed(2)} bits</b></span>
                    <span>${temperature < 0.5 ? '🎯 Nearly deterministic' : temperature > 1.5 ? '🎲 Highly random' : '⚖️ Balanced sampling'}</span>
                </div>`;
        }
    }
};


// ============================================================
// AUTOREGRESSIVE LOOP ANIMATION
// ============================================================

const AutoregressiveViz = {
    steps: [
        { input: 'Once upon a', output: 'time', prob: 0.72 },
        { input: 'Once upon a time', output: 'there', prob: 0.45 },
        { input: 'Once upon a time there', output: 'was', prob: 0.88 },
        { input: 'Once upon a time there was', output: 'a', prob: 0.65 },
        { input: 'Once upon a time there was a', output: 'dragon.', prob: 0.31 },
        { input: 'Once upon a time there was a dragon.', output: '|endoftext|', prob: 0.52 },
    ],
    originalInput: 'Once upon a',
    currentStep: 0,
    animating: false,
    timeoutId: null,

    updateButton: function() {
        const btn = document.getElementById('autoregressive-play');
        if (!btn) return;

        if (this.animating) {
            btn.textContent = '⏹ Stop Generation';
            btn.style.background = '#dc2626';
            btn.style.borderColor = '#dc2626';
            btn.style.color = '#fff';
        } else {
            btn.textContent = '▶ Play Generation';
            btn.style.background = '#3b82f6';
            btn.style.borderColor = '#3b82f6';
            btn.style.color = '#fff';
        }
        btn.disabled = false;
        btn.style.opacity = '1';
    },

    render: function() {
        const container = document.getElementById('autoregressive-viz');
        if (!container) return;

        const step = this.currentStep;
        const s = this.steps[Math.min(step, this.steps.length - 1)];

        // Split input into tokens
        const inputWords = s.input.split(' ');
        const originalWords = this.originalInput.split(' ');
        const originalCount = originalWords.length;

        // Build the sentence display with color coding
        let sentenceHtml = '';

        inputWords.forEach((word, i) => {
            if (i < originalCount) {
                // Original user input — amber/orange
                sentenceHtml += `<span style="color:#b45309; font-weight:bold; background:#fef3c7; padding:1px 4px; border-radius:3px; margin-right:6px;">${word}</span>`;
            } else if (i === inputWords.length - 1 && step > 0) {
                // Just added from previous prediction — green
                sentenceHtml += `<span style="color:#16a34a; font-weight:bold; background:#dcfce7; padding:1px 4px; border-radius:3px; margin-right:6px;">${word}</span>`;
            } else {
                // Previously generated context — default dark
                sentenceHtml += `<span style="color:#1e293b; margin-right:6px;">${word}</span>`;
            }
        });

        // The predicted next token
        let predictionHtml = '';
        if (s.output === '|endoftext|') {
            predictionHtml = `<span style="background:#fee2e2; color:#dc2626; padding:2px 8px; border-radius:4px; font-weight:bold; animation: arPulse 0.6s ease-in-out;">⏹ STOP</span>`;
        } else {
            predictionHtml = `<span style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:4px; font-weight:bold; animation: arPulse 0.6s ease-in-out;">${s.output}</span>`;
        }

        const html = `
            <div style="font-family:monospace; font-size:0.85em;">
                <!-- Fixed-size sentence display -->
                <div style="padding:14px 16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; min-height:48px; display:flex; align-items:center; flex-wrap:wrap;">
                    ${sentenceHtml}
                </div>

                <!-- Prediction row -->
                <div style="display:flex; align-items:center; gap:10px; padding:10px 16px; margin-top:8px; background:#eff6ff; border-radius:8px; border-left:3px solid #3b82f6;">
                    <span style="color:#64748b;">→ Predicts:</span>
                    ${predictionHtml}
                    <span style="color:#94a3b8; font-size:0.8em; margin-left:auto;">(p=${s.prob.toFixed(2)})</span>
                </div>

                <!-- Color legend -->
                <div style="display:flex; align-items:center; margin-top:10px; padding:0 4px;">
                    <div style="display:flex; gap:14px; font-size:0.75em; color:#64748b;">
                        <span><span style="color:#b45309; background:#fef3c7; padding:0 3px; border-radius:2px;">■</span> user input</span>
                        <span><span style="color:#1e293b;">■</span> generated</span>
                        <span><span style="color:#16a34a; background:#dcfce7; padding:0 3px; border-radius:2px;">■</span> just added</span>
                        <span><span style="color:#1e40af; background:#dbeafe; padding:0 3px; border-radius:2px;">■</span> next prediction</span>
                    </div>
                </div>
            </div>`;

        container.innerHTML = html;
    },

    animate: function() {
        // Toggle: if already animating, stop it
        if (this.animating) {
            this.stop();
            return;
        }

        this.animating = true;
        this.updateButton();

        // If we're at the end, restart from the beginning
        if (this.currentStep >= this.steps.length - 1) {
            this.currentStep = 0;
        }

        const step = () => {
            this.render();
            if (this.currentStep < this.steps.length - 1 && this.animating) {
                this.currentStep++;
                this.timeoutId = setTimeout(step, 1200);
            } else {
                this.animating = false;
                this.timeoutId = null;
                this.updateButton();
            }
        };
        step();
    },

    stop: function() {
        this.animating = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.updateButton();
    },

    reset: function() {
        this.stop();
        this.currentStep = 0;
        this.render();
    }
};

// ============================================================
// INITIALIZATION
// ============================================================

function loadIntuitionVizModule() {
    // Step 1: Tokenizer
    const tokInput = document.getElementById('tokenizer-input');
    if (tokInput) {
        tokInput.addEventListener('input', () => TokenizerViz.render());
        TokenizerViz.render();
    }

    // Step 2: Embedding
    const embInput = document.getElementById('embedding-viz-input');
    if (embInput) {
        embInput.addEventListener('input', () => EmbeddingViz.render());
    }
    const embArithInput = document.getElementById('embedding-arithmetic-input');
    if (embArithInput) {
        embArithInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') EmbeddingViz.doArithmetic();
        });
    }
    EmbeddingViz.render();

    // Step 3: Positional Encoding
    const peSlider = document.getElementById('pe-num-dims');
    if (peSlider) {
        peSlider.addEventListener('input', () => PositionalEncodingViz.render());
    }
    PositionalEncodingViz.render();
    PositionalEncodingViz.renderAdditionDemo();

    // Position demo controls
    ['pe-demo-word', 'pe-demo-pos1', 'pe-demo-pos2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => PositionalEncodingViz.renderAdditionDemo());
    });

    // Step 4: Residual Stream
    ResidualStreamViz.init();
    ResidualStreamViz.render();
    const layerSlider = document.getElementById('residual-stream-layer');
    if (layerSlider) {
        layerSlider.addEventListener('input', function() {
            ResidualStreamViz.setLayer(parseInt(this.value));
        });
    }

    // Step 5: Prediction
    const tempSlider = document.getElementById('prediction-temperature');
    if (tempSlider) {
        tempSlider.addEventListener('input', () => PredictionViz.render());
    }
    PredictionViz.render();

    // Autoregressive loop
    AutoregressiveViz.render();
}

async function loadIntuitionModule() {
	// Add CSS animation for token appearance
	const intuitionStyle = document.createElement('style');
	intuitionStyle.textContent = `
	    @keyframes tokenAppear {
		from { opacity: 0; transform: translateY(10px) scale(0.8); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	    }
	`;
	document.head.appendChild(intuitionStyle);
}
