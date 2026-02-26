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

    currentDemo: 'basic',
    arithmeticResult: null,

    render: function() {
        const plotDiv = document.getElementById('embedding-viz-plot');
        if (!plotDiv) return;

        const input = document.getElementById('embedding-viz-input');
        const text = (input ? input.value : 'king queen man woman').toLowerCase();
        const words = text.split(/\s+/).filter(w => this.embeddings[w]);

        const traces = [];
        const annotations = [];

        // ── Background vocabulary (greyed out but visible) ──
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

        // ── Active (typed) words ──
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

        // ── Vector arithmetic: draw arrows for each calculation step ──
        if (this.arithmeticResult) {
            const r = this.arithmeticResult;

            if (r.steps && r.steps.length > 0) {
                r.steps.forEach((step, idx) => {
                    // 1. Plotly annotation arrow (from → to) with arrowhead
                    annotations.push({
                        ax: step.from[0],
                        ay: step.from[1],
                        axref: 'x',
                        ayref: 'y',
                        x: step.to[0],
                        y: step.to[1],
                        xref: 'x',
                        yref: 'y',
                        showarrow: true,
                        arrowhead: 2,
                        arrowsize: 1.5,
                        arrowwidth: 3,
                        arrowcolor: '#3b82f6'
                    });

                    // 2. Invisible midpoint marker for hover label on the arrow
                    const midX = (step.from[0] + step.to[0]) / 2;
                    const midY = (step.from[1] + step.to[1]) / 2;
                    traces.push({
                        x: [midX],
                        y: [midY],
                        mode: 'markers',
                        marker: { size: 14, color: 'rgba(59,130,246,0.01)' },
                        text: [step.label],
                        hovertemplate: '<b>%{text}</b><extra></extra>',
                        showlegend: false,
                        cliponaxis: false
                    });

                    // 3. Visible text label next to the arrow midpoint
                    annotations.push({
                        x: midX,
                        y: midY + 0.7,
                        xref: 'x',
                        yref: 'y',
                        text: `<b>${step.label}</b>`,
                        showarrow: false,
                        font: { size: 11, color: '#3b82f6' },
                        bgcolor: 'rgba(255,255,255,0.85)',
                        borderpad: 3
                    });
                });
            }

            // ── Result point (diamond) ──
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
            annotations: annotations,
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
                    steps.push({
                        from: prev,
                        to: [...result],
                        label: `${op === '+' ? '+' : '−'}${token}`
                    });
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
    currentLayer: 0,
    canvas: null,
    ctx: null,
    dims: 12,
    layerStates: null,
    layerContributions: null,
    hoverLayer: -1,

    tokenColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],

    layerRoles: [
        {
            short: 'Raw embeddings',
            attnDesc: '',
            ffnDesc: '',
            example: 'Each token is just a vector ID — no context yet.'
        },
        {
            short: 'Positional & local',
            attnDesc: '"upon" attends to "Once" next to it',
            ffnDesc: 'Activates word-type features: noun? prep?',
            example: 'Once ← upon  (adjacent tokens link)'
        },
        {
            short: 'Phrase grouping',
            attnDesc: '"upon" and "a" both attend back to "Once"',
            ffnDesc: 'Recognizes "once upon" as a common bigram',
            example: '[Once upon] [a] [time]  (phrases form)'
        },
        {
            short: 'Syntax & grammar',
            attnDesc: '"a" links to "time" — determiner→noun',
            ffnDesc: 'Encodes roles: "a"=det, "time"=noun',
            example: 'a → time  (dependency found)'
        },
        {
            short: 'Semantic meaning',
            attnDesc: 'All tokens attend to full phrase — idiom found',
            ffnDesc: 'Fires on fairy-tale knowledge in weights',
            example: '"once upon a time" = story opener'
        },
        {
            short: 'Next-token focus',
            attnDesc: '"time" attends to "once upon a" for prediction',
            ffnDesc: 'Sharpens: "there" "in" "long" rise as candidates',
            example: 'time → predicts: "there was a..."'
        },
        {
            short: 'Output projection',
            attnDesc: 'Final cleanup — suppresses irrelevant features',
            ffnDesc: 'Boosts winning prediction, suppresses rest',
            example: 'time → "," (most likely next token)'
        },
    ],

    // Layout
    W: 900,
    H: 0,
    rowH: 170,
    topPad: 62,

    init: function () {
        const D = this.dims;
        const rng = (seed) => {
            let s = seed;
            return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
        };

        this.layerStates = {};
        this.layerContributions = {};

        this.tokens.forEach((token, ti) => {
            const rand = rng(42 + ti * 137);
            const embed = Array.from({ length: D }, () => (rand() * 2 - 1) * 0.5);
            this.layerStates[token] = [embed.slice()];
            this.layerContributions[token] = [];

            let current = embed.slice();
            for (let l = 0; l < this.numLayers; l++) {
                const attn = Array.from({ length: D }, (_, d) =>
                    Math.sin((l + 1) * (d + ti + 1) * 0.7) * 0.13 * (1 + l * 0.1)
                );
                const ffn = Array.from({ length: D }, (_, d) =>
                    ((d + l + ti) % 3 === 0 ? 1 : 0.2) * Math.cos((l + 1) * (d + 1) * 0.5 + ti) * 0.1 * (1 + l * 0.15)
                );
                const total = attn.map((a, d) => a + ffn[d]);
                current = current.map((v, d) => v + total[d]);
                this.layerContributions[token].push({ attn, ffn, total });
                this.layerStates[token].push(current.slice());
            }
        });

        this.H = this.topPad + (this.numLayers + 1) * this.rowH + 70;
    },

    // ── Helpers ──

    drawVector: function (vec, x, y, cellW, cellH, hue, alpha) {
        const ctx = this.ctx;
        const maxAbs = Math.max(...vec.map(Math.abs), 0.001);
        ctx.globalAlpha = alpha;
        vec.forEach((v, i) => {
            const norm = v / maxAbs;
            const intensity = Math.abs(norm);
            if (norm >= 0) {
                ctx.fillStyle = `hsla(${hue}, 80%, ${88 - intensity * 42}%, ${0.35 + intensity * 0.65})`;
            } else {
                ctx.fillStyle = `hsla(${(hue + 180) % 360}, 55%, ${88 - intensity * 38}%, ${0.35 + intensity * 0.65})`;
            }
            ctx.beginPath();
            ctx.roundRect(x + i * (cellW + 1), y, cellW, cellH, 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    },

    drawCurvedArrow: function (x1, y1, x2, y2, curve, color, lineW, alpha) {
        const ctx = this.ctx;
        ctx.globalAlpha = alpha || 1;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 + (curve || 0);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW || 1.5;
        ctx.stroke();

        const t = 0.95;
        const t1 = 1 - t;
        const px = t1 * t1 * x1 + 2 * t1 * t * midX + t * t * x2;
        const py = t1 * t1 * y1 + 2 * t1 * t * midY + t * t * y2;
        const angle = Math.atan2(y2 - py, x2 - px);
        const hs = 7;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hs * Math.cos(angle - Math.PI / 5.5), y2 - hs * Math.sin(angle - Math.PI / 5.5));
        ctx.lineTo(x2 - hs * Math.cos(angle + Math.PI / 5.5), y2 - hs * Math.sin(angle + Math.PI / 5.5));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    drawMultiline: function (text, x, y, font, color, lineH) {
        const lines = text.split('\n');
        const ctx = this.ctx;
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((line, i) => ctx.fillText(line, x, y + i * (lineH || 15)));
    },

    // ── Main render ──

    render: function () {
        if (!this.layerStates) this.init();

        const container = document.getElementById('residual-stream-plot');
        if (!container) return;

        if (!this.canvas || this.canvas.parentNode !== container) {
            container.innerHTML = '';
            container.style.overflow = 'auto';
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.maxWidth = this.W + 'px';
            this.canvas.style.display = 'block';
            this.canvas.style.margin = '0 auto';
            this.canvas.style.cursor = 'pointer';
            container.appendChild(this.canvas);

            this.canvas.addEventListener('click', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const scale = this.canvas.width / (window.devicePixelRatio || 1) / rect.width;
                const clickY = (e.clientY - rect.top) * scale;
                for (let l = 0; l <= this.numLayers; l++) {
                    const yBase = this.topPad + l * this.rowH;
                    if (clickY >= yBase && clickY <= yBase + this.rowH) {
                        this.currentLayer = l;
                        this.renderFrame();
                        this._updateInfo();
                        this._syncControls();
                        return;
                    }
                }
            });

            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const scale = this.canvas.width / (window.devicePixelRatio || 1) / rect.width;
                const my = (e.clientY - rect.top) * scale;
                let found = -1;
                for (let l = 0; l <= this.numLayers; l++) {
                    const yBase = this.topPad + l * this.rowH;
                    if (my >= yBase && my <= yBase + this.rowH) { found = l; break; }
                }
                if (found !== this.hoverLayer) {
                    this.hoverLayer = found;
                    this.renderFrame();
                }
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.hoverLayer = -1;
                this.renderFrame();
            });
        }

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.W * dpr;
        this.canvas.height = this.H * dpr;
        this.canvas.style.height = this.H + 'px';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);

        this.renderFrame();
        this._updateInfo();
        this._syncControls();
    },

    renderFrame: function () {
        const ctx = this.ctx;
        const layer = this.currentLayer;
        if (!ctx) return;

        const W = this.W;
        const H = this.H;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // ── Layout ──
        const cellW = 8;
        const cellH = 14;
        const vecW = this.dims * (cellW + 1);
        const tokenBlockH = this.tokens.length * (cellH + 3);

        // Column positions — generous left margin to prevent overflow
        const leftMargin = 30;
        const streamX = leftMargin + 80;                     // left edge of stream heatmap
        const streamRightX = streamX + vecW;

        const attnBoxX = streamRightX + 70;
        const attnBoxW = vecW + 16;
        const ffnBoxX = attnBoxX + attnBoxW + 36;
        const ffnBoxW = vecW + 16;

        // Description column — far right, with enough room
        const descColX = ffnBoxX + ffnBoxW + 24;
        const descColW = W - descColX - 16;

        // ── Title ──
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Residual Stream', leftMargin, this.topPad - 22);

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Each layer reads from the stream, computes, and adds back.', leftMargin + 150, this.topPad - 22);

        // ── Column headers ──
        const headerY = this.topPad - 2;
        ctx.font = '600 10px system-ui, sans-serif';
        ctx.textBaseline = 'bottom';

        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('RESIDUAL x', streamX + vecW / 2, headerY);

        ctx.fillStyle = '#8b5cf6';
        ctx.fillText('ATTENTION', attnBoxX + attnBoxW / 2, headerY);

        ctx.fillStyle = '#d97706';
        ctx.fillText('FFN', ffnBoxX + ffnBoxW / 2, headerY);

        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText('WHAT THIS LAYER DOES', descColX, headerY);

        // Thin header line
        ctx.beginPath();
        ctx.moveTo(leftMargin, this.topPad + 2);
        ctx.lineTo(W - 12, this.topPad + 2);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── Rows ──
        for (let l = 0; l <= this.numLayers; l++) {
            const yBase = this.topPad + 8 + l * this.rowH;
            const isCurrent = l === layer;
            const isActive = l <= layer;
            const isHover = l === this.hoverLayer && !isCurrent;
            const alpha = isActive ? 1 : 0.13;

            // ── Row highlight ──
            if (isCurrent) {
                ctx.fillStyle = '#f0f7ff';
                ctx.beginPath();
                ctx.roundRect(leftMargin - 8, yBase - 6, W - leftMargin, this.rowH - 10, 12);
                ctx.fill();
                ctx.strokeStyle = '#bfdbfe';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (isHover) {
                ctx.fillStyle = '#fafbfe';
                ctx.beginPath();
                ctx.roundRect(leftMargin - 8, yBase - 6, W - leftMargin, this.rowH - 10, 12);
                ctx.fill();
            }

            // ── Left label ──
            ctx.globalAlpha = Math.max(alpha, 0.3);
            ctx.font = isCurrent ? 'bold 12px system-ui, sans-serif' : '11px system-ui, sans-serif';
            ctx.fillStyle = isCurrent ? '#1e293b' : '#94a3b8';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(l === 0 ? 'Embed' : `Layer ${l}`, leftMargin, yBase + 4);

            ctx.font = '9px system-ui, sans-serif';
            ctx.fillStyle = isCurrent ? '#3b82f6' : '#cbd5e1';
            ctx.fillText(this.layerRoles[l].short, leftMargin, yBase + 20);

            // ── Token labels + residual stream heatmap ──
            ctx.globalAlpha = alpha;
            this.tokens.forEach((token, ti) => {
                const vy = yBase + 6 + ti * (cellH + 3);
                // Token label
                ctx.globalAlpha = Math.max(alpha, 0.25);
                ctx.font = '9px monospace';
                ctx.fillStyle = this.tokenColors[ti];
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(token, streamX - 5, vy + 1);
                ctx.globalAlpha = alpha;

                // Heatmap — use the state AT this layer (changes each layer)
                const state = this.layerStates[token][Math.min(l, this.numLayers)];
                const hue = [217, 160, 38, 0][ti];
                this.drawVector(state, streamX, vy, cellW, cellH, hue, alpha);
            });

            // ── Vertical flow arrow BETWEEN residual stream rows ──
            if (l < this.numLayers) {
                const arrowX = streamX + vecW / 2;
                const arrowTopY = yBase + tokenBlockH + 12;
                const arrowBotY = yBase + this.rowH - 8;
                const arrowAlpha = l < layer ? 0.5 : 0.1;

                ctx.globalAlpha = arrowAlpha;
                // Vertical line
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowTopY);
                ctx.lineTo(arrowX, arrowBotY);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Chevron
                ctx.beginPath();
                ctx.moveTo(arrowX - 5, arrowBotY - 6);
                ctx.lineTo(arrowX, arrowBotY);
                ctx.lineTo(arrowX + 5, arrowBotY - 6);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // ── Layers >= 1: Attn box, FFN box, arrows, description ──
            if (l >= 1) {
                const boxTop = yBase + 2;
                const boxH = tokenBlockH + 12;

                // ── Attention box ──
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.roundRect(attnBoxX, boxTop, attnBoxW, boxH, 8);
                ctx.fillStyle = isCurrent ? '#faf5ff' : '#fafafa';
                ctx.fill();
                ctx.strokeStyle = isCurrent ? '#c4b5fd' : '#e5e7eb';
                ctx.lineWidth = isCurrent ? 1.5 : 1;
                ctx.stroke();

                ctx.font = 'bold 9px system-ui, sans-serif';
                ctx.fillStyle = '#8b5cf6';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('Attn', attnBoxX + 6, boxTop + 3);

                this.tokens.forEach((token, ti) => {
                    const contrib = this.layerContributions[token][l - 1];
                    const vy = boxTop + 16 + ti * (cellH + 3);
                    this.drawVector(contrib.attn, attnBoxX + 8, vy, cellW, cellH, 270, alpha);
                });

                // ── FFN box ──
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.roundRect(ffnBoxX, boxTop, ffnBoxW, boxH, 8);
                ctx.fillStyle = isCurrent ? '#fffbeb' : '#fafafa';
                ctx.fill();
                ctx.strokeStyle = isCurrent ? '#fcd34d' : '#e5e7eb';
                ctx.lineWidth = isCurrent ? 1.5 : 1;
                ctx.stroke();

                ctx.font = 'bold 9px system-ui, sans-serif';
                ctx.fillStyle = '#d97706';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('FFN', ffnBoxX + 6, boxTop + 3);

                this.tokens.forEach((token, ti) => {
                    const contrib = this.layerContributions[token][l - 1];
                    const vy = boxTop + 16 + ti * (cellH + 3);
                    this.drawVector(contrib.ffn, ffnBoxX + 8, vy, cellW, cellH, 38, alpha);
                });

                // ── ARROWS: Stream → Attn → FFN → Stream ──
                // All arrows below the boxes, never overlapping content
                if (isActive) {
                    const arrowAlpha = isCurrent ? 0.85 : 0.3;
                    const arrowLW = isCurrent ? 2 : 1.2;
                    const arrowLane = boxTop + boxH + 14; // well below boxes

                    // Arrow 1: Residual stream → Attention (purple)
                    // Starts below stream heatmap, curves down to below attn box
                    this.drawCurvedArrow(
                        streamRightX + 4, arrowLane - 6,
                        attnBoxX + 4, arrowLane - 6,
                        14,
                        '#8b5cf6', arrowLW, arrowAlpha
                    );
                    if (isCurrent) {
                        ctx.globalAlpha = 0.8;
                        ctx.font = '9px system-ui, sans-serif';
                        ctx.fillStyle = '#8b5cf6';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillText('read', (streamRightX + attnBoxX) / 2 + 2, arrowLane + 6);
                        ctx.globalAlpha = 1;
                    }

                    // Arrow 2: Attention → FFN (amber)
                    this.drawCurvedArrow(
                        attnBoxX + attnBoxW - 4, arrowLane - 6,
                        ffnBoxX + 4, arrowLane - 6,
                        14,
                        '#d97706', arrowLW, arrowAlpha
                    );
                    if (isCurrent) {
                        ctx.globalAlpha = 0.8;
                        ctx.font = '9px system-ui, sans-serif';
                        ctx.fillStyle = '#d97706';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillText('then', (attnBoxX + attnBoxW + ffnBoxX) / 2, arrowLane + 6);
                        ctx.globalAlpha = 1;
                    }

                    // Arrow 3: FFN → Residual stream (green, big sweep back)
                    const returnY = arrowLane + 18;
                    ctx.globalAlpha = arrowAlpha;
                    ctx.beginPath();
                    ctx.moveTo(ffnBoxX + ffnBoxW - 4, arrowLane - 6);
                    ctx.bezierCurveTo(
                        ffnBoxX + ffnBoxW + 20, returnY + 8,
                        streamRightX - 20, returnY + 8,
                        streamRightX + 4, returnY
                    );
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = arrowLW;
                    ctx.stroke();
                    // Arrowhead pointing left
                    const hs = 7;
                    ctx.beginPath();
                    ctx.moveTo(streamRightX + 4, returnY);
                    ctx.lineTo(streamRightX + 4 + hs, returnY - hs / 2.2);
                    ctx.lineTo(streamRightX + 4 + hs, returnY + hs / 2.2);
                    ctx.closePath();
                    ctx.fillStyle = '#10b981';
                    ctx.fill();
                    ctx.globalAlpha = 1;

                    // "+" badge at merge point
                    if (isCurrent) {
                        const badgeX = streamRightX - 6;
                        const badgeY = returnY;
                        ctx.beginPath();
                        ctx.arc(badgeX, badgeY, 9, 0, Math.PI * 2);
                        ctx.fillStyle = '#10b981';
                        ctx.fill();
                        ctx.font = 'bold 13px system-ui, sans-serif';
                        ctx.fillStyle = '#fff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('+', badgeX, badgeY);

                        ctx.font = '9px system-ui, sans-serif';
                        ctx.fillStyle = '#10b981';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillText('add back', (streamRightX + ffnBoxX + ffnBoxW) / 2, returnY + 4);
                    }
                }

                // ── Description column (far right) ──
                ctx.globalAlpha = isCurrent ? 1 : Math.max(alpha, 0.15);

                if (isCurrent) {
                    const dy = yBase + 6;

                    // Attn description
                    ctx.font = 'bold 10px system-ui, sans-serif';
                    ctx.fillStyle = '#8b5cf6';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText('Attention:', descColX, dy);
                    ctx.font = '10px system-ui, sans-serif';
                    ctx.fillStyle = '#475569';
                    ctx.fillText(this.layerRoles[l].attnDesc, descColX, dy + 14);

                    // FFN description
                    ctx.font = 'bold 10px system-ui, sans-serif';
                    ctx.fillStyle = '#d97706';
                    ctx.fillText('FFN:', descColX, dy + 36);
                    ctx.font = '10px system-ui, sans-serif';
                    ctx.fillStyle = '#475569';
                    ctx.fillText(this.layerRoles[l].ffnDesc, descColX, dy + 50);

                    // Example
                    ctx.font = 'bold 10px system-ui, sans-serif';
                    ctx.fillStyle = '#10b981';
                    ctx.fillText('Example:', descColX, dy + 72);
                    ctx.font = '11px monospace';
                    ctx.fillStyle = '#1e293b';
                    ctx.fillText(this.layerRoles[l].example, descColX, dy + 86);

                } else if (isActive || isHover) {
                    // Faded short summary for non-current active rows
                    ctx.font = '10px system-ui, sans-serif';
                    ctx.fillStyle = '#94a3b8';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(this.layerRoles[l].example, descColX, yBase + 20);
                }

                ctx.globalAlpha = 1;

            } else {
                // ── Embed row: description in the desc column ──
                if (isCurrent) {
                    ctx.globalAlpha = 1;
                    ctx.font = '11px system-ui, sans-serif';
                    ctx.fillStyle = '#475569';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText('Each token becomes a vector.', descColX, yBase + 10);
                    ctx.fillText('No context — just raw identity.', descColX, yBase + 28);
                    ctx.fillText('Everything after this is added on top.', descColX, yBase + 46);
                }
            }

            ctx.globalAlpha = 1;
        }

        // ── Bottom: magnitude bar + equation ──
        const barY = this.H - 50;
        const token = this.tokens[this.tokens.length - 1];
        const maxMag = Math.sqrt(this.layerStates[token][this.numLayers].reduce((s, v) => s + v * v, 0));
        const curState = this.layerStates[token][layer];
        const curMag = Math.sqrt(curState.reduce((s, v) => s + v * v, 0));
        const initMag = Math.sqrt(this.layerStates[token][0].reduce((s, v) => s + v * v, 0));

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`"${token}" magnitude:`, leftMargin, barY);

        const barX = leftMargin + 120;
        const barMaxW = 280;

        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barMaxW, 16, 8);
        ctx.fill();

        const fillW = Math.max(6, (curMag / maxMag) * barMaxW);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        barGrad.addColorStop(0, '#3b82f6');
        barGrad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, 16, 8);
        ctx.fill();

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`‖x‖ = ${curMag.toFixed(2)}  (+${((curMag / initMag - 1) * 100).toFixed(0)}%)`, barX + fillW + 10, barY + 2);

        ctx.font = '11px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(
            `x${layer} = x0${Array.from({ length: layer }, (_, i) => ` + Δ${i + 1}`).join('')}`,
            barX, barY + 24
        );
    },
    _updateInfo: function () {
        const layer = this.currentLayer;
        const infoDiv = document.getElementById('residual-stream-info');
        if (!infoDiv) return;

        const descriptions = [
            'The residual stream starts with <b>raw embeddings</b>. Each token is a vector — no context, no meaning beyond identity. Everything that follows will be <b>added</b> to these initial vectors.',
            '<b>Layer 1 — Positional & local.</b> Attention heads look at nearby tokens. "upon" sees "Once" right next to it. The FFN activates basic word-type features. Both outputs are added to the stream.',
            '<b>Layer 2 — Phrase grouping.</b> Attention groups "once upon" as a recognized phrase. The FFN fires on common bigram patterns it learned during training. The residual stream now carries phrase-level information.',
            '<b>Layer 3 — Syntax & grammar.</b> Attention connects "a" to "time" — a determiner finding its noun. The FFN encodes part-of-speech patterns. Grammatical structure is emerging in the vectors.',
            '<b>Layer 4 — Semantic meaning.</b> The full phrase "once upon a time" is recognized as a fairy-tale idiom. The FFN activates story-related world knowledge stored in its weights. Meaning crystallizes.',
            '<b>Layer 5 — Next-token focus.</b> Attention focuses on which tokens matter most for predicting the next word. The FFN sharpens the probability distribution — "there", "in", "long" become top candidates.',
            '<b>Layer 6 — Output.</b> Final refinements. The last token\'s residual vector will be projected onto the full vocabulary to produce logits. The stream carries the sum of <b>all</b> previous layer contributions.'
        ];

        infoDiv.innerHTML = `
            <div style="padding:14px 18px; background:#fff; border-radius:10px; border:1px solid #e2e8f0;">
                <div style="font-size:0.95em; color:#334155; line-height:1.6;">${descriptions[layer]}</div>
            </div>`;
    },

    _syncControls: function () {
        const slider = document.getElementById('residual-stream-layer');
        if (slider) slider.value = this.currentLayer;

        const label = document.getElementById('residual-stream-layer-label');
        if (label) label.textContent = this.currentLayer === 0 ? 'Embedding' : `Layer ${this.currentLayer}`;

        const prevBtn = document.getElementById('residual-stream-prev');
        const nextBtn = document.getElementById('residual-stream-next');
        if (prevBtn) {
            prevBtn.disabled = this.currentLayer <= 0;
            prevBtn.style.opacity = this.currentLayer <= 0 ? '0.4' : '1';
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentLayer >= this.numLayers;
            nextBtn.style.opacity = this.currentLayer >= this.numLayers ? '0.4' : '1';
        }
    },

    // ── Step-wise controls ──

    nextLayer: function () {
        if (this.currentLayer < this.numLayers) {
            this.currentLayer++;
            this.renderFrame();
            this._updateInfo();
            this._syncControls();
        }
    },

    prevLayer: function () {
        if (this.currentLayer > 0) {
            this.currentLayer--;
            this.renderFrame();
            this._updateInfo();
            this._syncControls();
        }
    },

    reset: function () {
        this.currentLayer = 0;
        this.renderFrame();
        this._updateInfo();
        this._syncControls();
    },

    setLayer: function (layer) {
        this.currentLayer = Math.max(0, Math.min(layer, this.numLayers));
        this.renderFrame();
        this._updateInfo();
        this._syncControls();
    },

    destroy: function () {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
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
	EmbeddingViz.doArithmetic()

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
    layerSlider.addEventListener('input', function () {
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
