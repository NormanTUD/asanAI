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
	tokens: ['The', 'cat', 'sat', 'on'],
	numLayers: 3,
	currentLayer: 0,
	canvas: null,
	ctx: null,
	dims: 8,
	layerStates: null,
	layerContributions: null,
	hoverLayer: -1,

	tokenColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],

	layerRoles: [
		{
			short: 'Raw embeddings',
			attnDesc: '',
			ffnDesc: '',
			example: 'Each token is an isolated vector — "cat" ≠ animal yet, just ID #9001.'
		},
		{
			short: 'Local syntax & word roles',
			attnDesc: '"cat" attends to "The" → learns it\'s a definite noun phrase',
			ffnDesc: 'Activates part-of-speech features: "cat"→noun, "sat"→verb',
			example: '"The cat" groups into a noun phrase; "sat" tagged as past-tense verb.'
		},
		{
			short: 'Clause structure & relationships',
			attnDesc: '"sat" attends to "cat" → identifies subject-verb link',
			ffnDesc: 'Encodes who-did-what: agent="cat", action="sat", prep="on"',
			example: '"cat" is the one sitting; "on" opens a prepositional phrase → expects a location next.'
		},
		{
			short: 'Next-token prediction',
			attnDesc: '"on" attends to "cat sat" → gathers full context for prediction',
			ffnDesc: 'Boosts location nouns: "the" "a" "mat" "floor" rise; suppresses verbs',
			example: 'on → predicts "the" (42%), "a" (18%), "mat" (7%), ...'
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

		this.H = this.topPad + (this.numLayers + 1) * this.rowH + 130; // was + 70
	},

	// ── Helpers ──

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
				// Map from CSS coordinates to logical canvas coordinates
				const scaleY = this.H / rect.height;
				const clickY = (e.clientY - rect.top) * scaleY;
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
				const scaleY = this.H / rect.height;
				const my = (e.clientY - rect.top) * scaleY;
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

	drawArrowHead: function(x, y, angle, color) {
		const h = 8;
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x - h * Math.cos(angle - 0.5), y - h * Math.sin(angle - 0.5));
		this.ctx.lineTo(x - h * Math.cos(angle + 0.5), y - h * Math.sin(angle + 0.5));
		this.ctx.fill();
	},

	drawVerticalStreamArrows: function(l, layout) {
		const { streamX, vecW, yBase, cellH } = layout;
		const centerX = streamX + (vecW / 2);
		const startY = yBase + (this.tokens.length * (cellH + 3)) + 5;

		if (l < this.numLayers) {
			// Existing logic: arrow to next layer
			const nextY = yBase + this.rowH;
			this.ctx.globalAlpha = l < this.currentLayer ? 0.8 : 0.2;
			this.ctx.beginPath();
			this.ctx.moveTo(centerX, startY);
			this.ctx.lineTo(centerX, nextY - 15);
			this.ctx.strokeStyle = '#3b82f6';
			this.ctx.lineWidth = 3;
			this.ctx.stroke();
			this.drawArrowHead(centerX, nextY - 15, Math.PI / 2, '#3b82f6');
		} else {
			// NEW: Final layer → draw arrow to "Next Token Prediction"
			const endY = startY + 100;
			this.ctx.globalAlpha = this.currentLayer === this.numLayers ? 0.9 : 0.2;
			this.ctx.beginPath();
			this.ctx.moveTo(centerX, startY);
			this.ctx.lineTo(centerX, endY - 10);
			this.ctx.strokeStyle = '#3b82f6';
			this.ctx.lineWidth = 3;
			this.ctx.stroke();
			this.drawArrowHead(centerX, endY - 10, Math.PI / 2, '#3b82f6');

			// Label
			this.ctx.font = 'bold 12px system-ui';
			this.ctx.fillStyle = '#1e293b';
			this.ctx.textAlign = 'center';
			this.ctx.fillText('→ Compare result to all words in the dictionary to chose the next most likely ones', centerX + 100, endY + 10);
			this.ctx.globalAlpha = 1;
		}
	},

	renderFrame: function () {
		const ctx = this.ctx;
		if (!ctx) return;

		this.clearAndSetupCanvas();
		this.drawHeaders();

		for (let l = 0; l <= this.numLayers; l++) {
			const layout = this.calculateLayout(l);

			this.drawLayerBackground(l, layout);
			this.drawStream(l, layout);
			this.drawVerticalStreamArrows(l, layout); // Added vertical flow

			if (l >= 1) {
				this.drawProcessingBlocks(l, layout);
				this.drawMetadata(l, layout);
				this.drawFlowArrows(l, layout);
			}
		}
	},

	clearAndSetupCanvas: function() {
		this.ctx.clearRect(0, 0, this.W, this.H);
		this.ctx.fillStyle = '#ffffff';
		this.ctx.fillRect(0, 0, this.W, this.H);
	},

	calculateLayout: function(l) {
		const cellW = 6;
		const cellH = 14;
		const vecW = this.dims * (cellW + 1);
		const tokenBlockH = this.tokens.length * (cellH + 3);
		const yBase = this.topPad + 8 + l * this.rowH;
		const streamX = 150; // leftMargin (30) + 120

		return {
			yBase, cellW, cellH, vecW, tokenBlockH, streamX,
			isCurrent: l === this.currentLayer,
			isActive: l <= this.currentLayer,
			alpha: l <= this.currentLayer ? 1 : 0.15,
			attnBoxX: streamX + vecW + 50,
			ffnBoxX: streamX + vecW + 50 + (vecW * 0.75 + 10) + 30,
			descColX: streamX + vecW + 50 + 2 * (vecW * 0.75 + 10) + 60
		};
	},

	drawLayerBackground: function(l, { yBase, isCurrent }) {
		if (!isCurrent) return;
		this.ctx.fillStyle = '#f8fafc';
		this.ctx.beginPath();
		this.ctx.roundRect(25, yBase - 10, this.W - 25, this.rowH - 5, 12);
		this.ctx.fill();
		this.ctx.strokeStyle = '#3b82f6';
		this.ctx.lineWidth = 2;
		this.ctx.stroke();
	},

	drawStream: function(l, { yBase, streamX, cellW, cellH, isCurrent, alpha }) {
		const ctx = this.ctx;
		ctx.font = isCurrent ? 'bold 14px system-ui' : '12px system-ui';
		ctx.fillStyle = isCurrent ? '#1e293b' : '#94a3b8';
		ctx.textAlign = 'left';
		ctx.fillText(l === 0 ? 'Embed' : `Layer ${l}`, 30, yBase + 10);

		this.tokens.forEach((token, ti) => {
			const vy = yBase + 10 + ti * (cellH + 3);
			const state = this.layerStates[token][l];
			const hue = [217, 160, 38, 0][ti];
			this.drawVector(state, streamX, vy, cellW, cellH, hue, alpha);

			ctx.font = '10px monospace';
			ctx.fillStyle = this.tokenColors[ti];
			ctx.textAlign = 'right';
			ctx.fillText(token, streamX - 8, vy + 10);
		});
	},

	drawProcessingBlocks: function(l, layout) {
		const { yBase, attnBoxX, ffnBoxX, tokenBlockH, alpha, isCurrent, cellW, cellH } = layout;
		const boxH = tokenBlockH + 15;
		const boxW = layout.vecW * 0.75 + 10;

		// Draw Attention Box
		this.drawModuleBox(attnBoxX, yBase + 5, boxW, boxH, '#faf5ff', isCurrent ? '#8b5cf6' : '#e2e8f0', alpha);
		// Draw FFN Box
		this.drawModuleBox(ffnBoxX, yBase + 5, boxW, boxH, '#fffbeb', isCurrent ? '#d97706' : '#e2e8f0', alpha);

		this.tokens.forEach((token, ti) => {
			const contrib = this.layerContributions[token][l - 1];
			const vy = yBase + 13 + ti * (cellH + 3);
			this.drawVector(contrib.attn, attnBoxX + 5, vy, cellW - 1, cellH, 270, alpha);
			this.drawVector(contrib.ffn, ffnBoxX + 5, vy, cellW - 1, cellH, 38, alpha);
		});
	},

	drawModuleBox: function(x, y, w, h, fill, stroke, alpha) {
		this.ctx.globalAlpha = alpha;
		this.ctx.beginPath();
		this.ctx.roundRect(x, y, w, h, 6);
		this.ctx.fillStyle = fill;
		this.ctx.fill();
		this.ctx.strokeStyle = stroke;
		this.ctx.lineWidth = 1;
		this.ctx.stroke();
		this.ctx.globalAlpha = 1;
	},

	drawFlowArrows: function(l, layout) {
		if (!layout.isActive) return;
		const { yBase, streamX, vecW, attnBoxX, ffnBoxX, isCurrent } = layout;
		const arrowAlpha = isCurrent ? 0.85 : 0.3;
		const arrowLW = isCurrent ? 2 : 1.2;
		const streamRightX = streamX + vecW;

		// Stream -> Attention
		this.drawCurvedArrow(streamRightX + 5, yBase + 15, attnBoxX + 5, yBase + 15, -20, '#8b5cf6', arrowLW, arrowAlpha);

		// Attention -> FFN
		const attnBoxW = vecW * 0.75 + 10;
		this.drawCurvedArrow(attnBoxX + attnBoxW - 5, yBase + 20, ffnBoxX + 5, yBase + 20, -10, '#d97706', arrowLW, arrowAlpha);

		// Return Path: FFN -> Stream
		this.drawReturnArrow(l, layout, arrowLW, arrowAlpha);
	},

	drawReturnArrow: function(l, layout, arrowLW, arrowAlpha) {
		const { yBase, ffnBoxX, vecW, streamX, tokenBlockH, isCurrent } = layout;
		const ffnBoxW = vecW * 0.75 + 10;
		const centerX = streamX + vecW / 2;

		// Start from bottom-center of the FFN box
		const startX = ffnBoxX + (ffnBoxW / 2);
		const startY = yBase + tokenBlockH + 15;
		const returnY = yBase + tokenBlockH + 40;

		this.ctx.globalAlpha = arrowAlpha;
		this.ctx.beginPath();
		this.ctx.moveTo(startX, startY);
		// Curve back to the center of the stream
		this.ctx.bezierCurveTo(startX, returnY + 20, centerX + 40, returnY + 20, centerX, returnY + 10);
		this.ctx.strokeStyle = '#10b981'; // Green addition color
		this.ctx.lineWidth = arrowLW;
		this.ctx.stroke();

		if (isCurrent) {
			this.ctx.globalAlpha = 1;
			this.ctx.fillStyle = '#10b981';
			this.ctx.beginPath();
			this.ctx.arc(centerX, returnY + 10, 8, 0, Math.PI * 2);
			this.ctx.fill();
			this.ctx.fillStyle = '#fff';
			this.ctx.textAlign = 'center';
			this.ctx.fillText('+', centerX, returnY + 14);
		}
	},

	drawVector: function (vec, x, y, cellW, cellH, hue, alpha) {
		const ctx = this.ctx;
		const maxAbs = Math.max(...vec.map(Math.abs), 0.001);
		ctx.globalAlpha = alpha;

		vec.forEach((v, i) => {
			const norm = v / maxAbs;
			const intensity = Math.abs(norm);
			// Color logic based on positive/negative values
			ctx.fillStyle = norm >= 0 
				? `hsla(${hue}, 80%, ${88 - intensity * 42}%, ${0.35 + intensity * 0.65})`
				: `hsla(${(hue + 180) % 360}, 55%, ${88 - intensity * 38}%, ${0.35 + intensity * 0.65})`;

			ctx.beginPath();
			ctx.roundRect(x + i * (cellW + 1), y, cellW, cellH, 2);
			ctx.fill();
		});
		ctx.globalAlpha = 1;
	},

	drawMetadata: function(l, { yBase, descColX, isCurrent }) {
		if (!isCurrent) return;
		const ctx = this.ctx;
		const dy = yBase + 5;
		const role = this.layerRoles[l];

		ctx.globalAlpha = 1;
		ctx.textAlign = 'left';

		// Attention Text
		ctx.font = 'bold 15px system-ui';
		ctx.fillStyle = '#8b5cf6';
		ctx.fillText('Attention:', descColX, dy + 5);
		ctx.font = '14px system-ui';
		ctx.fillStyle = '#475569';
		ctx.fillText(role.attnDesc, descColX, dy + 25);

		// FFN Text
		ctx.font = 'bold 15px system-ui';
		ctx.fillStyle = '#d97706';
		ctx.fillText('FFN (Knowledge):', descColX, dy + 60);
		ctx.font = '14px system-ui';
		ctx.fillStyle = '#475569';
		ctx.fillText(role.ffnDesc, descColX, dy + 80);

		// Example Text
		ctx.font = 'bold 14px monospace';
		ctx.fillStyle = '#10b981';
		ctx.fillText('Example:', descColX, dy + 115);
		ctx.fillText(role.example, descColX + 5, dy + 135);
	},

	drawHeaders: function() {
		const ctx = this.ctx;
		const cellW = 6;
		const streamX = 150;
		const vecW = this.dims * (cellW + 1);

		ctx.font = 'bold 18px system-ui, sans-serif';
		ctx.fillStyle = '#1e293b';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		ctx.fillText('Residual Stream Flow', 30, this.topPad - 25);

		ctx.font = '600 11px system-ui, sans-serif';
		ctx.textAlign = 'center';

		ctx.fillStyle = '#64748b';
		ctx.fillText('RESIDUAL x', streamX + vecW / 2, this.topPad - 5);

		ctx.fillStyle = '#8b5cf6';
		ctx.fillText('ATTENTION', streamX + vecW + 65, this.topPad - 5);

		ctx.fillStyle = '#d97706';
		ctx.fillText('FFN', streamX + vecW + 165, this.topPad - 5);
	},
	
	_updateInfo: function () {
		const layer = this.currentLayer;
		const infoDiv = document.getElementById('residual-stream-info');
		if (!infoDiv) return;

		const descriptions = [
			'The residual stream starts with <b>raw embeddings</b>. "The", "cat", "sat", "on" are just lookup vectors — no grammar, no meaning, no context. Everything that follows will be <b>added</b> to these vectors.',

			'<b>Layer 1 — Local syntax & word roles.</b> Attention heads look at adjacent tokens: "cat" attends to "The" and recognizes it\'s part of a definite noun phrase. The FFN fires part-of-speech detectors — tagging "cat" as a noun and "sat" as a past-tense verb. These features are <b>added</b> to the residual stream.',

			'<b>Layer 2 — Clause structure & relationships.</b> Attention now connects "sat" back to "cat" — identifying the subject-verb dependency (who did the sitting?). The FFN encodes thematic roles: "cat" = agent, "sat" = action, "on" = preposition expecting a location. The stream now carries grammatical structure.',

			'<b>Layer 3 — Next-token prediction.</b> "on" attends broadly to "The cat sat" to gather full sentence context. The FFN sharpens the output distribution: location-related words like "the", "a", "mat", "floor" get boosted while verbs and adjectives are suppressed. The final residual vector at "on" is ready to be projected onto the vocabulary.'
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
                    <span>🏆 Top: <b style="color:#3b82f6;">"${top.word}"</b> (${(top.prob * 100).toFixed(1)}%)</span>
                    <span>🌡️ Temp.: <b>${temperature.toFixed(2)}</b></span>
                    <span>📊 Entropy: <b>${entropy.toFixed(2)} bits</b></span>
                    <span>${temperature < 0.5 ? '🎯 Near deterministic' : temperature > 1.5 ? '🎲 Highly random' : '⚖️ Balanced'}</span>
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
