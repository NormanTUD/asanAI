// intuition.js

/**
 * Interactive Visualizations for LLM Intuition Steps
 * Covers: Tokenization, Embedding, Positional Encoding, Transformer Layers, Final Prediction
 */

// ============================================================
// STEP 1: TOKENIZATION VISUALIZER
// ============================================================

const rootMargin = "800px";

// ============================================================
// STEP 1: TOKENIZATION VISUALIZER — Morphem-basierter BPE
// ============================================================

const TokenizerViz = {
    // Bekannte Morpheme / Subwords (simuliert ein vortrainiertes BPE-Vocab)
    // Alles was hier drin steht, wird NICHT weiter gemergt.
    knownSubwords: new Set([
        // Deutsche Morpheme
        'donau', 'dampf', 'schiff', 'fahrt', 'fahren', 'schifffahrt',
        'gesellschaft', 'kapitän', 'elektrizität', 'haupt', 'betrieb',
        'werk', 'bau', 'unter', 'beamte', 'beamten',
        'un', 'ver', 'be', 'ge', 'er', 'zer', 'ent', 'emp', 'miss',
        'ung', 'heit', 'keit', 'lich', 'isch', 'bar', 'sam', 'haft',
        'chen', 'lein', 'schaft', 'tum', 'nis', 'sal',
        'vor', 'nach', 'aus', 'ein', 'auf', 'ab', 'an', 'über', 'unter',
        'durch', 'um', 'mit', 'zu', 'bei', 'von',
        'tag', 'nacht', 'haus', 'land', 'stadt', 'berg', 'wald', 'feld',
        'wasser', 'feuer', 'luft', 'erde', 'stein', 'holz', 'gold',
        'hand', 'kopf', 'herz', 'auge', 'ohr', 'mund', 'fuß', 'arm',
        'kind', 'mann', 'frau', 'mensch', 'tier', 'hund', 'katze',
        'groß', 'klein', 'alt', 'neu', 'gut', 'schlecht', 'schön',
        'lang', 'kurz', 'hoch', 'tief', 'breit', 'schmal',
        'gehen', 'kommen', 'stehen', 'laufen', 'fahren', 'fliegen',
        'sehen', 'hören', 'sprechen', 'denken', 'wissen', 'können',
        'haben', 'sein', 'werden', 'machen', 'geben', 'nehmen',
        'ist', 'und', 'oder', 'aber', 'weil', 'dass', 'wenn', 'als',
        'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine',
        'ich', 'du', 'wir', 'ihr', 'sie', 'es', 'er',
        'nicht', 'auch', 'noch', 'schon', 'nur', 'sehr', 'mehr',
        'wort', 'satz', 'text', 'buch', 'brief', 'bild', 'lied',
        'zeit', 'jahr', 'monat', 'woche', 'stunde', 'minute',
        'arbeit', 'spiel', 'leben', 'liebe', 'freund', 'feind',
        'lang', 'langes', 'lange', 'langen', 'langer',
        'besteht', 'bestehen',
        // Englische Morpheme
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'can', 'could', 'shall', 'should', 'may', 'might', 'must',
        'not', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
        'cat', 'dog', 'sat', 'on', 'mat', 'hat', 'bat', 'rat',
        'king', 'queen', 'man', 'woman', 'child', 'boy', 'girl',
        'once', 'upon', 'time', 'there', 'here', 'where', 'what',
        'play', 'ing', 'ed', 'er', 'ly', 'ness', 'ment', 'tion',
        'pre', 'dis', 'mis', 'over', 'out', 'up', 'down',
        'un', 're', 'in', 'im', 'ir', 'il',
        'able', 'ible', 'ful', 'less', 'ous', 'ive', 'al', 'ial',
        'trans', 'form', 'under', 'stand', 'break',
        'hello', 'world', 'good', 'great', 'happy', 'love',
        'dragon', 'drache', 'fliegen', 'konnte',
    ]),

    // Maximale Subword-Länge für die Suche
    maxSubwordLen: 12,
    minSubwordLen: 2,

    tokenColors: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
        '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7', '#d946ef'
    ],

    // ─── Greedy Longest-Match Segmentierung ───
    // Wie ein echter Tokenizer: von links nach rechts das längste bekannte Stück nehmen
    segmentWord: function(word) {
        word = word.toLowerCase();
        const segments = [];
        let i = 0;

        while (i < word.length) {
            let bestLen = 0;
            let bestSegment = '';

            // Suche das längste bekannte Subword ab Position i
            for (let len = Math.min(this.maxSubwordLen, word.length - i); len >= this.minSubwordLen; len--) {
                const candidate = word.substring(i, i + len);
                if (this.knownSubwords.has(candidate)) {
                    bestLen = len;
                    bestSegment = candidate;
                    break;
                }
            }

            if (bestLen > 0) {
                segments.push(bestSegment);
                i += bestLen;
            } else {
                // Einzelnes Zeichen als Fallback (unbekannt)
                segments.push(word[i]);
                i++;
            }
        }

        return segments;
    },

    // Deterministischer Hash → Pseudo-Vocab-ID
    _hashID: function(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return hash % 50000;
    },

    // ─── Hauptfunktion ───
    tokenize: function(text) {
        // Satzzeichen abtrennen
        const rawWords = text.split(/\s+/).filter(w => w.length > 0);
        const allTokens = [];

        rawWords.forEach((rawWord, wordIdx) => {
            // Satzzeichen am Ende abtrennen
            let word = rawWord;
            let punctuation = '';
            const punctMatch = word.match(/^(.+?)([.,!?;:]+)$/);
            if (punctMatch) {
                word = punctMatch[1];
                punctuation = punctMatch[2];
            }

            const segments = this.segmentWord(word);

            segments.forEach((seg, segIdx) => {
                allTokens.push({
                    text: segIdx > 0 ? '##' + seg : seg,
                    displayText: seg,
                    id: this._hashID(seg),
                    isSubword: segIdx > 0,
                    originalWord: rawWord,
                    displayOriginal: rawWord,
                    splitIndex: segIdx,
                    splitTotal: segments.length + (punctuation ? 1 : 0),
                    wordIndex: wordIdx
                });
            });

            // Satzzeichen als eigenes Token
            if (punctuation) {
                allTokens.push({
                    text: punctuation,
                    displayText: punctuation,
                    id: this._hashID(punctuation),
                    isSubword: false,
                    originalWord: rawWord,
                    displayOriginal: rawWord,
                    splitIndex: segments.length,
                    splitTotal: segments.length + 1,
                    wordIndex: wordIdx
                });
            }
        });

        return allTokens;
    },

    // ─── Rendering ───
    render: function() {
        const input = document.getElementById('tokenizer-input');
        const outputDiv = document.getElementById('tokenizer-output');
        const statsDiv = document.getElementById('tokenizer-stats');
        if (!input || !outputDiv) return;

        const text = input.value || 'Donaudampfschifffahrt ist ein langes Wort';
        const tokens = this.tokenize(text);

        // ─── Token-Chips ───
        let html = '<div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; min-height:60px; align-items:flex-start;">';

        let currentWordIdx = -1;
        let colorIdx = -1;

        tokens.forEach((token, i) => {
            if (token.wordIndex !== currentWordIdx) {
                currentWordIdx = token.wordIndex;
                colorIdx++;
            }
            const color = this.tokenColors[colorIdx % this.tokenColors.length];
            const isSplit = token.splitTotal > 1;
            const isSubword = token.isSubword;

            html += `
                <div class="token-chip" style="
                    display:inline-flex; flex-direction:column; align-items:center;
                    padding:8px 12px; background:${isSplit ? color + '0a' : '#fff'}; border-radius:8px;
                    border-left:3px ${isSubword ? 'dashed' : 'solid'} ${color};
                    border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0;
                    box-shadow:0 2px 4px rgba(0,0,0,0.05);
                    animation: tokenAppear 0.3s ease-out ${i * 0.05}s both;
                    cursor:default; transition: transform 0.15s;
                    ${isSubword ? 'margin-left:-3px;' : ''}
                " onmouseover="this.style.transform='translateY(-3px)'"
                  onmouseout="this.style.transform='translateY(0)'"
                  title="${token.displayOriginal} → Teil ${token.splitIndex + 1}/${token.splitTotal}">
                    <span style="font-weight:bold; font-size:1.05em; color:${color};">${token.displayText}</span>
                    <span style="font-size:0.65em; color:#94a3b8; font-family:monospace;">ID: ${token.id}</span>
                    ${isSplit && !token.displayText.match(/^[.,!?;:]+$/) ? `<span style="font-size:0.6em; color:${isSubword ? '#f59e0b' : '#6366f1'};">${isSubword ? '##sub' : 'start▸'}</span>` : ''}
                </div>`;
        });
        html += '</div>';

        // ─── Zerlegungsanzeige für zusammengesetzte Wörter ───
        const compoundWords = [];
        const seen = new Set();
        tokens.forEach(t => {
            if (t.splitTotal > 1 && !seen.has(t.originalWord) && !t.displayText.match(/^[.,!?;:]+$/)) {
                seen.add(t.originalWord);
                const parts = tokens.filter(tok => tok.originalWord === t.originalWord && !tok.displayText.match(/^[.,!?;:]+$/));
                if (parts.length > 1) {
                    compoundWords.push({ word: t.originalWord, parts: parts.map(p => p.displayText) });
                }
            }
        });

        if (compoundWords.length > 0) {
            html += `<div style="margin-top:14px; padding:12px 16px; background:#eff6ff; border-radius:10px; border:1px solid #bfdbfe;">`;
            html += `<div style="font-size:0.8em; font-weight:bold; color:#1e40af; margin-bottom:8px;">🔍 Subword-Zerlegung:</div>`;
            html += `<div style="display:flex; flex-direction:column; gap:6px;">`;

            compoundWords.forEach(({ word, parts }) => {
                html += `<div style="font-family:monospace; font-size:0.85em; color:#334155;">`;
                html += `<span style="color:#64748b;">"${word}"</span> → `;
                html += parts.map((p, i) => {
                    const c = this.tokenColors[i % this.tokenColors.length];
                    return `<span style="background:${c}15; border:1px solid ${c}40; padding:2px 6px; border-radius:4px; color:${c}; font-weight:bold;">${p}</span>`;
                }).join(' + ');
                html += ` <span style="color:#94a3b8; font-size:0.85em;">(${parts.length} tokens)</span>`;
                html += `</div>`;
            });

            html += `</div></div>`;
        }

        outputDiv.innerHTML = html;

        // ─── Stats ───
        if (statsDiv) {
            const words = text.split(/\s+/).filter(w => w.length > 0);
            const splitWordCount = compoundWords.length;
            statsDiv.innerHTML = `
                <div style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap; font-size:0.85em; color:#475569;">
                    <span><b>${tokens.length}</b> tokens</span>
                    <span><b>${words.length}</b> Wörter</span>
                    <span><b>${splitWordCount}</b> davon in Subwords zerlegt</span>
                </div>
                <div style="margin-top:6px; font-size:0.72em; color:#94a3b8; text-align:center;">
                    Vocab IDs: [${tokens.map(t => t.id).join(', ')}]
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
	'power': [5, 0], 'baby': [6, 0],
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
            <div style="background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
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
                    This is how "The <b>dog</b> bites <b>man</b>" differs from "The <b>man</b> bites <b>dog</b>".
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
// INITIALIZATION
// ============================================================

function loadIntuitionVizModule() {
	// Step 1: Tokenizer
	const tokInput = document.getElementById('tokenizer-input');
	if (tokInput) {
		let _tokenDebounce = null;
		tokInput.addEventListener('input', () => {
			clearTimeout(_tokenDebounce);
			_tokenDebounce = setTimeout(() => TokenizerViz.render(), 150);
		});

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
}

const contextVocab = {
	'bank':  { base: [5, 5], color: '#3b82f6' },
	'river': { base: [1, 9], color: '#10b981' },
	'money': { base: [9, 1], color: '#f59e0b' }
};

function runAttention() {
	const inputField = document.getElementById('trans-input');
	const container = 'transformer-plot';

	if (!inputField || !document.getElementById(container)) return;

	const input = inputField.value.toLowerCase();
	const words = input.split(/\s+/).filter(w => contextVocab[w]);

	let traces = [];

	// 1. Static Vocabulary (Background)
	Object.keys(contextVocab).forEach(word => {
		const pos = contextVocab[word].base;
		traces.push({
			x: [pos[0]], y: [pos[1]],
			mode: 'markers+text',
			name: word,
			text: word,
			textposition: 'bottom center',
			marker: { size: 12, opacity: 0.6, color: contextVocab[word].color },
			type: 'scatter' // Changed from scatter3d
		});
	});

	// 2. Attention Logic
	if (words.includes('bank')) {
		const bankBase = contextVocab['bank'].base;
		// Start at the base position
		let currentPos = [...bankBase]; 

		words.forEach(other => {
			if (other !== 'bank') {
				const otherBase = contextVocab[other].base;

				// Move 50% of the remaining distance to the "other" word
				// Formula: Current + (Target - Current) * 0.5
				currentPos = currentPos.map((coord, i) => coord + (otherBase[i] - coord) * 0.5);

				// Draw attention line (the "Handshake") from the original bank base
				traces.push({
					x: [bankBase[0], otherBase[0]],
					y: [bankBase[1], otherBase[1]],
					mode: 'lines',
					line: { color: '#f97316', width: 3, dash: 'dot' },
					hoverinfo: 'none',
					showlegend: false,
					type: 'scatter'
				});
			}
		});

		// The Resulting Contextual Embedding (now using the iteratively shifted position)
		traces.push({
			x: [currentPos[0]], y: [currentPos[1]],
			mode: 'markers+text',
			text: 'Contextualized Embedding for "Bank"',
			textposition: 'top center',
			marker: { 
				size: 16, 
				color: '#3b82f6', 
				symbol: 'diamond', 
				line: {color:'black', width:2} 
			},
			type: 'scatter'
		});
	}

	const layout = {
		margin: { l: 40, r: 40, b: 40, t: 40 },
		hovermode: 'closest',
		xaxis: { range: [0, 10], title: 'Semantic Dim A', gridcolor: '#e2e8f0' },
		yaxis: { range: [0, 10], title: 'Semantic Dim B', gridcolor: '#e2e8f0' },
		showlegend: false
	};

	Plotly.react(container, traces, layout);
}

// ============================================================
// STEP 4b: FFN VISUALIZER
// ============================================================

const FFNViz = {
    scenarios: {
        apple_fruit: {
            desc: "Because the context is 'eating', the FFN detects the <b>Food</b> and <b>Nature</b> patterns. It zeroes out the Tech pattern. It then adds fruit-related vocabulary concepts to the residual stream.",
            detectors: [
                { id: 'd1', label: 'Tech Company?', active: false },
                { id: 'd2', label: 'Edible Fruit?', active: true },
                { id: 'd3', label: 'Nature/Tree?', active: true }
            ],
            facts: [
                { id: 'f1', label: 'Add: "Juice", "Pie"', active: true, from: ['d2'] },
                { id: 'f2', label: 'Add: "Mac", "Phone"', active: false, from: [] },
                { id: 'f3', label: 'Add: "Orchard", "Green"', active: true, from: ['d3'] }
            ]
        },
        apple_tech: {
            desc: "Because the context is 'buying', the FFN detects the <b>Tech Company</b> pattern. The fruit patterns remain dormant. It retrieves hardware-related knowledge to predict the next word.",
            detectors: [
                { id: 'd1', label: 'Tech Company?', active: true },
                { id: 'd2', label: 'Edible Fruit?', active: false },
                { id: 'd3', label: 'Nature/Tree?', active: false }
            ],
            facts: [
                { id: 'f1', label: 'Add: "Juice", "Pie"', active: false, from: [] },
                { id: 'f2', label: 'Add: "Mac", "Phone"', active: true, from: ['d1'] },
                { id: 'f3', label: 'Add: "Orchard", "Green"', active: false, from: [] }
            ]
        }
    },

    currentScenario: null,

    setScenario: function(scenarioKey) {
        this.currentScenario = scenarioKey;
        
        // Update Buttons
        document.getElementById('btn-ffn-fruit').style.background = scenarioKey === 'apple_fruit' ? '#fee2e2' : '#fff';
        document.getElementById('btn-ffn-fruit').style.borderColor = scenarioKey === 'apple_fruit' ? '#ef4444' : '#cbd5e1';
        
        document.getElementById('btn-ffn-tech').style.background = scenarioKey === 'apple_tech' ? '#e0e7ff' : '#fff';
        document.getElementById('btn-ffn-tech').style.borderColor = scenarioKey === 'apple_tech' ? '#6366f1' : '#cbd5e1';

        this.render();
    },

    render: function() {
        if (!this.currentScenario) return;
        const data = this.scenarios[this.currentScenario];

        // 1. Render Detectors
        const detContainer = document.getElementById('ffn-detectors');
        detContainer.innerHTML = data.detectors.map(d => `
            <div id="node-${d.id}" style="
                padding: 10px; border-radius: 8px; font-size: 0.85em; font-weight: bold; transition: all 0.4s ease;
                background: ${d.active ? '#fef3c7' : '#f1f5f9'};
                border: 2px solid ${d.active ? '#f59e0b' : '#cbd5e1'};
                color: ${d.active ? '#92400e' : '#94a3b8'};
                box-shadow: ${d.active ? '0 0 10px rgba(245,158,11,0.4)' : 'none'};
            ">
                ${d.label}<br>
                <span style="font-size: 0.8em; color: ${d.active ? '#d97706' : '#cbd5e1'};">
                    ${d.active ? '🔥 FIRES' : '❌ ZEROED (ReLU)'}
                </span>
            </div>
        `).join('');

        // 2. Render Facts
        const factsContainer = document.getElementById('ffn-facts');
        factsContainer.innerHTML = data.facts.map(f => `
            <div id="node-${f.id}" style="
                padding: 10px; border-radius: 8px; font-size: 0.85em; font-weight: bold; transition: all 0.4s ease;
                background: ${f.active ? '#dcfce7' : '#f1f5f9'};
                border: 2px solid ${f.active ? '#10b981' : '#cbd5e1'};
                color: ${f.active ? '#065f46' : '#94a3b8'};
            ">
                ${f.label}
            </div>
        `).join('');

        // 3. Update Explanation
        document.getElementById('ffn-explanation').innerHTML = data.desc;

        // 4. Draw Lines (Wait a tiny bit for DOM to position elements)
        setTimeout(() => this.drawLines(data), 50);
    },

    drawLines: function(data) {
        const svg = document.getElementById('ffn-lines');
        const container = document.getElementById('ffn-viz-container').getBoundingClientRect();
        svg.innerHTML = '';

        const drawCurve = (el1, el2, active) => {
            if (!el1 || !el2) return;
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();

            // Calculate positions relative to container
            const x1 = rect1.right - container.left;
            const y1 = rect1.top + (rect1.height / 2) - container.top;
            const x2 = rect2.left - container.left;
            const y2 = rect2.top + (rect2.height / 2) - container.top;

            // Bezier curve control points
            const cx1 = x1 + 40;
            const cx2 = x2 - 40;

            const color = active ? '#f59e0b' : '#e2e8f0';
            const width = active ? 3 : 1;
            const dash = active ? '' : 'stroke-dasharray="4 4"';

            svg.innerHTML += `<path d="M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}" 
                                stroke="${color}" stroke-width="${width}" fill="transparent" ${dash} 
                                style="transition: all 0.4s ease;"/>`;
        };

        const inputBox = document.getElementById('ffn-input-box');
        const outputBox = document.getElementById('ffn-output-box');

        // Input -> Detectors
        data.detectors.forEach(d => {
            const detNode = document.getElementById(`node-${d.id}`);
            drawCurve(inputBox, detNode, d.active);
        });

        // Detectors -> Facts
        data.facts.forEach(f => {
            const factNode = document.getElementById(`node-${f.id}`);
            f.from.forEach(sourceId => {
                const sourceNode = document.getElementById(`node-${sourceId}`);
                drawCurve(sourceNode, factNode, true);
            });
            // If fact is inactive, just draw a faint line from a random inactive detector for visual completeness
            if (!f.active) {
                const inactiveDet = document.getElementById(`node-d2`); // arbitrary
                drawCurve(inactiveDet, factNode, false);
            }
            
            // Facts -> Output
            drawCurve(factNode, outputBox, f.active);
        });
    }
};

// ============================================================
// LAZY LOADING VIA INTERSECTION OBSERVER
// ============================================================

const _lazyInitRegistry = [];
let _lazyObserver = null;

function _lazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _lazyInitRegistry.push({ el, initFn, initialized: false });
}

function _lazyCreateObserver() {
    if (_lazyObserver) return;

    _lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _lazyInitRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _lazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin
    });

    _lazyInitRegistry.forEach(r => {
        if (!r.initialized) {
            _lazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// REPLACEMENT INITIALIZATION — call this instead of the old ones
// ============================================================

// ============================================================
// NEURAL NET APPROXIMATION VISUALIZER
// ============================================================

const NNApproxViz = {
    // Target functions
    targetFunctions: {
        sin: x => Math.sin(x * 1.5),
        quadratic: x => x * x / 4 - 0.5,
        abs: x => Math.abs(x) / 2,
        step: x => (x < -1.5 ? -0.5 : x < 0 ? 0.5 : x < 1.5 ? -0.3 : 0.7),
        custom: x => Math.sin(x * 2) * 0.5 + Math.cos(x * 3) * 0.3,
    },

    // Fit a simple Dense+ReLU+Dense network to approximate the target
    // Uses evenly-spaced "hinge points" (ReLU knees) to create piecewise linear approx
    fitNetwork: function(targetFn, numNeurons, xMin, xMax) {
        const neurons = [];
        const step = (xMax - xMin) / (numNeurons + 1);

        // Place hinge points evenly
        for (let i = 0; i < numNeurons; i++) {
            const hingeX = xMin + (i + 1) * step;
            neurons.push({ hingeX, weight: 0, bias: 0 });
        }

        // For each neuron, compute the slope change needed
        // We approximate by sampling the target and computing finite differences
        const samplePoints = 200;
        const xs = [];
        const ys = [];
        for (let i = 0; i <= samplePoints; i++) {
            const x = xMin + (xMax - xMin) * i / samplePoints;
            xs.push(x);
            ys.push(targetFn(x));
        }

        // Simple least-squares fit for piecewise linear with ReLU basis
        // Each neuron contributes: w_i * max(0, x - hingeX_i)
        // Plus a global linear term: a*x + b
        const N = numNeurons + 2; // neurons + linear + bias
        const M = xs.length;

        // Build design matrix
        const A = [];
        for (let j = 0; j < M; j++) {
            const row = [1, xs[j]]; // bias and linear
            for (let i = 0; i < numNeurons; i++) {
                row.push(Math.max(0, xs[j] - neurons[i].hingeX));
            }
            A.push(row);
        }

        // Solve via normal equations (A^T A) w = A^T y
        const ATA = Array.from({ length: N }, () => Array(N).fill(0));
        const ATy = Array(N).fill(0);

        for (let j = 0; j < M; j++) {
            for (let p = 0; p < N; p++) {
                ATy[p] += A[j][p] * ys[j];
                for (let q = 0; q < N; q++) {
                    ATA[p][q] += A[j][p] * A[j][q];
                }
            }
        }

        // Add small regularization
        for (let p = 0; p < N; p++) ATA[p][p] += 1e-6;

        // Gaussian elimination
        const weights = this.solveLinearSystem(ATA, ATy, N);

        return {
            bias: weights[0],
            linearWeight: weights[1],
            neurons: neurons.map((n, i) => ({
                hingeX: n.hingeX,
                weight: weights[i + 2]
            })),
            evaluate: function(x) {
                let y = weights[0] + weights[1] * x;
                for (let i = 0; i < numNeurons; i++) {
                    y += weights[i + 2] * Math.max(0, x - neurons[i].hingeX);
                }
                return y;
            }
        };
    },

    solveLinearSystem: function(A, b, n) {
        // Gaussian elimination with partial pivoting
        const aug = A.map((row, i) => [...row, b[i]]);

        for (let col = 0; col < n; col++) {
            // Pivot
            let maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
            }
            [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

            if (Math.abs(aug[col][col]) < 1e-12) continue;

            for (let row = col + 1; row < n; row++) {
                const factor = aug[row][col] / aug[col][col];
                for (let j = col; j <= n; j++) {
                    aug[row][j] -= factor * aug[col][j];
                }
            }
        }

        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            if (Math.abs(aug[i][i]) < 1e-12) continue;
            x[i] = aug[i][n];
            for (let j = i + 1; j < n; j++) {
                x[i] -= aug[i][j] * x[j];
            }
            x[i] /= aug[i][i];
        }
        return x;
    },

    render: function() {
        const plotDiv = document.getElementById('nn-approx-plot');
        if (!plotDiv) return;

        const fnSelect = document.getElementById('nn-target-fn');
        const neuronSlider = document.getElementById('nn-num-neurons');
        const fnKey = fnSelect ? fnSelect.value : 'sin';
        const numNeurons = neuronSlider ? parseInt(neuronSlider.value) : 4;

        // Update label
        const countLabel = document.getElementById('nn-neuron-count');
        if (countLabel) countLabel.textContent = numNeurons;

        const targetFn = this.targetFunctions[fnKey];
        const xMin = -3, xMax = 3;

        // Fit network
        const network = this.fitNetwork(targetFn, numNeurons, xMin, xMax);

        // Generate plot data
        const xs = [];
        const ysTarget = [];
        const ysApprox = [];
        for (let i = 0; i <= 300; i++) {
            const x = xMin + (xMax - xMin) * i / 300;
            xs.push(x);
            ysTarget.push(targetFn(x));
            ysApprox.push(network.evaluate(x));
        }

        // Hinge points
        const hingeXs = network.neurons.map(n => n.hingeX);
        const hingeYs = hingeXs.map(x => network.evaluate(x));

        const traces = [
            {
                x: xs, y: ysTarget,
                mode: 'lines',
                name: 'Zielfunktion',
                line: { color: '#94a3b8', width: 3, dash: 'dot' }
            },
            {
                x: xs, y: ysApprox,
                mode: 'lines',
                name: `Approximation (${numNeurons} Neuronen)`,
                line: { color: '#6366f1', width: 3 }
            },
            {
                x: hingeXs, y: hingeYs,
                mode: 'markers',
                name: 'ReLU-Knickpunkte',
                marker: { size: 10, color: '#ef4444', symbol: 'diamond', line: { width: 1, color: '#fff' } }
            }
        ];

        const layout = {
            margin: { l: 50, r: 30, b: 50, t: 20 },
            xaxis: { title: 'x', gridcolor: '#f1f5f9', zeroline: true, zerolinecolor: '#e2e8f0' },
            yaxis: { title: 'f(x)', gridcolor: '#f1f5f9', zeroline: true, zerolinecolor: '#e2e8f0' },
            showlegend: true,
            legend: { x: 0, y: 1, bgcolor: 'rgba(255,255,255,0.9)', font: { size: 11 } },
            plot_bgcolor: '#fff'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });

        // Info
        const infoDiv = document.getElementById('nn-approx-info');
        if (infoDiv) {
            // Compute MSE
            let mse = 0;
            for (let i = 0; i < xs.length; i++) {
                mse += Math.pow(ysTarget[i] - ysApprox[i], 2);
            }
            mse /= xs.length;

            infoDiv.innerHTML = `
                <b>${numNeurons} Neuronen</b> = <b>${numNeurons} ReLU-Knickpunkte</b> = <b>${numNeurons + 1} lineare Segmente</b>.
                Je mehr Neuronen, desto feiner die Stückelung!
                <span style="margin-left:12px; color:#64748b;">MSE: ${mse.toFixed(6)}</span>
                ${numNeurons >= 15 ? '<br><span style="color:#10b981;">✓ Fast perfekte Approximation!</span>' : ''}
                ${numNeurons <= 3 ? '<br><span style="color:#f59e0b;">→ Erhöhe die Neuronen für bessere Annäherung</span>' : ''}
            `;
        }
    }
};

// ============================================================
// NEURAL NET STEP-BY-STEP VISUALIZER
// ============================================================

const NNStepViz = {
    // A small fixed network for demonstration
    weights1: [0.8, -1.2, 0.5, -0.7],  // 4 neurons, 1 input each
    biases1: [0.3, 1.0, -0.5, 0.8],
    weights2: [0.6, -0.4, 0.9, -0.3],  // 4 neurons → 1 output
    bias2: 0.1,

    currentStep: 4, // 0=input, 1=dense1, 2=relu, 3=dense2, 4=all
    animating: false,

    compute: function(x) {
        // Dense 1
        const z1 = this.weights1.map((w, i) => w * x + this.biases1[i]);
        // ReLU
        const a1 = z1.map(v => Math.max(0, v));
        // Dense 2
        const output = a1.reduce((sum, a, i) => sum + a * this.weights2[i], 0) + this.bias2;
        return { x, z1, a1, output };
    },

    render: function() {
        const container = document.getElementById('nn-step-viz');
        if (!container) return;

        const slider = document.getElementById('nn-step-input');
        const x = slider ? parseFloat(slider.value) : 1.5;
        const valLabel = document.getElementById('nn-step-input-val');
        if (valLabel) valLabel.textContent = x.toFixed(1);

        const result = this.compute(x);
        const step = this.currentStep;

        // Build visualization
        let html = '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:280px;">';

        // INPUT
        html += this.renderInputColumn(result.x, step >= 0);

        // Arrow
        html += this.renderArrow(step >= 1);

        // DENSE 1
        html += this.renderDense1Column(result.z1, step >= 1);

        // Arrow
        html += this.renderArrow(step >= 2);

        // ReLU
        html += this.renderReLUColumn(result.z1, result.a1, step >= 2);

        // Arrow
        html += this.renderArrow(step >= 3);

        // DENSE 2
        html += this.renderDense2Column(result.a1, result.output, step >= 3);

        // Arrow
        html += this.renderArrow(step >= 4);

        // OUTPUT
        html += this.renderOutputColumn(result.output, step >= 4);

        html += '</div>';
        container.innerHTML = html;

        // Explanation
        const explDiv = document.getElementById('nn-step-explanation');
        if (explDiv) {
            const explanations = [
                `<b>Schritt 1:</b> Input x = ${x.toFixed(1)} wird in das Netz eingespeist.`,
                `<b>Schritt 2 – Dense₁:</b> Jedes Neuron berechnet w·x + b. Die 4 Neuronen erzeugen: [${result.z1.map(v => v.toFixed(2)).join(', ')}]`,
                `<b>Schritt 3 – ReLU:</b> max(0, z) schneidet negative Werte ab → [${result.a1.map(v => v.toFixed(2)).join(', ')}]. Nur aktive Neuronen "feuern"!`,
                `<b>Schritt 4 – Dense₂:</b> Die aktiven Werte werden gewichtet summiert: ${result.a1.map((a, i) => `${a.toFixed(2)}×${this.weights2[i]}`).join(' + ')} + ${this.bias2} = <b>${result.output.toFixed(3)}</b>`,
                `<b>Fertig!</b> Input ${x.toFixed(1)} → Output ${result.output.toFixed(3)}. Jedes Neuron ist ein "Detektor" – ReLU entscheidet, welche feuern.`
            ];
            explDiv.innerHTML = explanations[Math.min(step, 4)];
        }
    },

    renderInputColumn: function(x, active) {
        const opacity = active ? '1' : '0.2';
        return `
            <div style="text-align:center; opacity:${opacity}; transition:opacity 0.4s;">
                <div style="font-size:0.75em; font-weight:bold; color:#64748b; margin-bottom:6px;">INPUT</div>
                <div style="width:60px; height:60px; border-radius:50%; background:#dbeafe; border:3px solid #3b82f6; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2em; color:#1e40af; margin:0 auto;">
                    ${x.toFixed(1)}
                </div>
            </div>`;
    },

    renderDense1Column: function(z1, active) {
        const opacity = active ? '1' : '0.2';
        let neurons = '';
        z1.forEach((z, i) => {
            const bg = z >= 0 ? '#e0e7ff' : '#fee2e2';
            const border = z >= 0 ? '#818cf8' : '#fca5a5';
            const color = z >= 0 ? '#312e81' : '#991b1b';
            neurons += `<div style="padding:4px 8px; border-radius:6px; background:${bg}; border:1px solid ${border}; font-size:0.75em; color:${color}; font-weight:bold; margin:3px 0;">${z.toFixed(2)}</div>`;
        });
        return `
            <div style="text-align:center; opacity:${opacity}; transition:opacity 0.4s;">
                <div style="font-size:0.75em; font-weight:bold; color:#6366f1; margin-bottom:6px;">DENSE₁<br><span style="font-weight:normal; font-size:0.85em;">w·x + b</span></div>
                ${neurons}
            </div>`;
    },

    renderReLUColumn: function(z1, a1, active) {
        const opacity = active ? '1' : '0.2';
        let neurons = '';
        a1.forEach((a, i) => {
            const fired = a > 0;
            const bg = fired ? '#dcfce7' : '#f1f5f9';
            const border = fired ? '#34d399' : '#e2e8f0';
            const color = fired ? '#065f46' : '#94a3b8';
            const icon = fired ? '🔥' : '❌';
            neurons += `<div style="padding:4px 8px; border-radius:6px; background:${bg}; border:1px solid ${border}; font-size:0.75em; color:${color}; font-weight:bold; margin:3px 0;">${icon} ${a.toFixed(2)}</div>`;
        });
        return `
            <div style="text-align:center; opacity:${opacity}; transition:opacity 0.4s;">
                <div style="font-size:0.75em; font-weight:bold; color:#10b981; margin-bottom:6px;">ReLU<br><span style="font-weight:normal; font-size:0.85em;">max(0, z)</span></div>
                ${neurons}
            </div>`;
    },

    renderDense2Column: function(a1, output, active) {
        const opacity = active ? '1' : '0.2';
        return `
            <div style="text-align:center; opacity:${opacity}; transition:opacity 0.4s;">
                <div style="font-size:0.75em; font-weight:bold; color:#d97706; margin-bottom:6px;">DENSE₂<br><span style="font-weight:normal; font-size:0.85em;">Σ wᵢ·aᵢ + b</span></div>
                <div style="padding:8px 12px; border-radius:8px; background:#fef3c7; border:2px solid #f59e0b; font-weight:bold; color:#92400e; font-size:0.95em;">
                    ${output.toFixed(3)}
                </div>
            </div>`;
    },

    renderOutputColumn: function(output, active) {
        const opacity = active ? '1' : '0.2';
        return `
            <div style="text-align:center; opacity:${opacity}; transition:opacity 0.4s;">
                <div style="font-size:0.75em; font-weight:bold; color:#64748b; margin-bottom:6px;">OUTPUT</div>
                <div style="width:60px; height:60px; border-radius:50%; background:#dcfce7; border:3px solid #10b981; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.1em; color:#065f46; margin:0 auto;">
                    ${output.toFixed(2)}
                </div>
            </div>`;
    },

    renderArrow: function(active) {
        const color = active ? '#3b82f6' : '#e2e8f0';
        return `<div style="font-size:1.5em; color:${color}; transition:color 0.4s;">→</div>`;
    },

    animateSteps: function() {
        if (this.animating) return;
        this.animating = true;
        this.currentStep = 0;
        this.render();

        const btn = document.getElementById('nn-step-animate-btn');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }

        let step = 0;
        const interval = setInterval(() => {
            step++;
            this.currentStep = step;
            this.render();
            if (step >= 4) {
                clearInterval(interval);
                this.animating = false;
                if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            }
        }, 900);
    }
};

// ============================================================
// NN → TOKEN PREDICTION STEP-BY-STEP
// ============================================================

const NNTokenViz = {
    currentStep: 0,

    // Mock data for "The cat sat on" → predicting next token
    inputVector: [0.82, -0.31, 0.55, 0.12, -0.67, 0.44, 0.91, -0.23],

    // Simulated Dense1 weights (8 input → 6 hidden neurons)
    weights1: [
        [0.5, -0.3, 0.8, 0.1, -0.6, 0.2, 0.4, -0.1],
        [-0.2, 0.7, -0.1, 0.5, 0.3, -0.8, 0.1, 0.6],
        [0.3, 0.1, -0.5, 0.9, 0.2, 0.4, -0.3, 0.7],
        [-0.6, 0.4, 0.2, -0.3, 0.8, 0.1, 0.5, -0.4],
        [0.1, -0.5, 0.6, 0.3, -0.2, 0.7, -0.8, 0.2],
        [0.4, 0.2, -0.7, -0.1, 0.5, -0.3, 0.6, 0.1]
    ],
    biases1: [0.1, -0.2, 0.3, 0.0, -0.1, 0.2],

    // Dense2 weights (6 hidden → 5 vocab scores)
    weights2: [
        [0.9, -0.3, 0.5, 0.2, -0.4, 0.6],
        [0.2, 0.8, -0.1, 0.4, 0.3, -0.5],
        [-0.4, 0.1, 0.7, -0.2, 0.6, 0.3],
        [0.3, -0.6, 0.2, 0.8, -0.1, 0.4],
        [-0.1, 0.4, -0.3, 0.1, 0.7, -0.2]
    ],
    biases2: [0.5, -0.1, 0.2, 0.0, 0.3],

    // Vocabulary for output
    vocab: ['the', 'a', 'mat', 'floor', 'table'],

    // Compute forward pass
    compute: function() {
        const x = this.inputVector;

        // Dense 1: z = W1 * x + b1
        const z1 = this.weights1.map((row, i) => {
            const dot = row.reduce((sum, w, j) => sum + w * x[j], 0);
            return dot + this.biases1[i];
        });

        // ReLU
        const a1 = z1.map(v => Math.max(0, v));

        // Dense 2: scores = W2 * a1 + b2
        const scores = this.weights2.map((row, i) => {
            const dot = row.reduce((sum, w, j) => sum + w * a1[j], 0);
            return dot + this.biases2[i];
        });

        // Softmax
        const maxScore = Math.max(...scores);
        const exps = scores.map(s => Math.exp(s - maxScore));
        const sumExp = exps.reduce((a, b) => a + b, 0);
        const probs = exps.map(e => e / sumExp);

        return { x, z1, a1, scores, probs };
    },

    setStep: function(step) {
        this.currentStep = step;
        // Update button styles
        for (let i = 0; i <= 3; i++) {
            const btn = document.getElementById(`nn-tok-step${i}`);
            if (btn) {
                btn.style.borderColor = i === step ? '#3b82f6' : '#cbd5e1';
                btn.style.background = i === step ? '#eff6ff' : '#fff';
                btn.style.borderWidth = i === step ? '2px' : '1px';
            }
        }
        this.render();
    },

    render: function() {
        const container = document.getElementById('nn-token-viz');
        const explDiv = document.getElementById('nn-token-explanation');
        if (!container) return;

        const result = this.compute();
        const step = this.currentStep;

        let html = '';

        if (step === 0) {
            // Show input vector
            html = this.renderInputStep(result);
        } else if (step === 1) {
            // Show Dense1 + ReLU
            html = this.renderDenseReluStep(result);
        } else if (step === 2) {
            // Show Dense2 scores
            html = this.renderScoresStep(result);
        } else if (step === 3) {
            // Show Softmax → Token
            html = this.renderSoftmaxStep(result);
        }

        container.innerHTML = html;

        // Explanation
        if (explDiv) {
            const explanations = [
                '📥 <b>Input-Vektor:</b> Der kontextualisierte Vektor des letzten Tokens "on" (nach Attention). 8 Dimensionen – in der Realität 4096+.',
                '🔥 <b>Dense₁ + ReLU:</b> 6 "Wissens-Detektoren" berechnen je einen Score. ReLU zeroed negative Werte → nur relevante Detektoren feuern!',
                '📊 <b>Dense₂ (Scores):</b> Die aktiven Detektoren werden zu einem Score pro Vokabular-Wort kombiniert. Höherer Score = wahrscheinlicheres Wort.',
                '🎯 <b>Softmax → Token:</b> Scores werden in Wahrscheinlichkeiten umgewandelt. Das Modell wählt (z.B. "the" mit 38%) – fertig!'
            ];
            explDiv.innerHTML = explanations[step];
        }
    },

    renderInputStep: function(result) {
        let html = '<div style="text-align:center;">';
        html += '<div style="font-size:0.85em; color:#64748b; margin-bottom:12px;">Kontext: <b>"The cat sat on"</b> → Vektor des letzten Tokens <b>"on"</b>:</div>';
        html += '<div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap; margin-bottom:20px;">';
        result.x.forEach((v, i) => {
            const intensity = Math.abs(v);
            const bg = v >= 0 ? `rgba(59,130,246,${0.2 + intensity * 0.6})` : `rgba(239,68,68,${0.2 + intensity * 0.6})`;
            html += `<div style="width:55px; height:55px; border-radius:8px; background:${bg}; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85em; color:#1e293b; border:1px solid rgba(0,0,0,0.1);">${v.toFixed(2)}</div>`;
        });
        html += '</div>';
        html += '<div style="font-size:0.8em; color:#94a3b8;">← 8 Dimensionen (vereinfacht; real: 4096–12288) →</div>';
        html += '</div>';
        return html;
    },

    renderDenseReluStep: function(result) {
        let html = '<div style="display:flex; gap:30px; align-items:flex-start; justify-content:center; flex-wrap:wrap;">';

        // Pre-ReLU values
        html += '<div style="text-align:center;">';
        html += '<div style="font-size:0.8em; font-weight:bold; color:#6366f1; margin-bottom:8px;">Dense₁ Output (vor ReLU)</div>';
        result.z1.forEach((z, i) => {
            const bg = z >= 0 ? '#e0e7ff' : '#fee2e2';
            const color = z >= 0 ? '#312e81' : '#991b1b';
            html += `<div style="padding:6px 12px; margin:4px 0; border-radius:6px; background:${bg}; color:${color}; font-weight:bold; font-size:0.85em;">Neuron ${i + 1}: ${z.toFixed(3)}</div>`;
        });
        html += '</div>';

        // Arrow
        html += '<div style="display:flex; align-items:center; font-size:2em; color:#10b981; padding-top:60px;">→<br><span style="font-size:0.4em;">ReLU</span></div>';

        // Post-ReLU values
        html += '<div style="text-align:center;">';
        html += '<div style="font-size:0.8em; font-weight:bold; color:#10b981; margin-bottom:8px;">Nach ReLU (max(0, z))</div>';
        result.a1.forEach((a, i) => {
            const fired = a > 0;
            const bg = fired ? '#dcfce7' : '#f1f5f9';
            const color = fired ? '#065f46' : '#94a3b8';
            const icon = fired ? '🔥' : '❌';
            html += `<div style="padding:6px 12px; margin:4px 0; border-radius:6px; background:${bg}; color:${color}; font-weight:bold; font-size:0.85em;">${icon} Neuron ${i + 1}: ${a.toFixed(3)}</div>`;
        });
        html += '</div>';

        html += '</div>';

        // Summary
        const activeCount = result.a1.filter(a => a > 0).length;
        html += `<div style="text-align:center; margin-top:16px; font-size:0.85em; color:#475569;"><b>${activeCount} von 6</b> Neuronen feuern – nur diese tragen zum Ergebnis bei!</div>`;

        return html;
    },

    renderScoresStep: function(result) {
        let html = '<div style="text-align:center;">';
        html += '<div style="font-size:0.85em; color:#64748b; margin-bottom:14px;">Dense₂ kombiniert aktive Neuronen zu einem <b>Score pro Wort</b>:</div>';

        // Score bars
        const maxScore = Math.max(...result.scores.map(Math.abs));
        html += '<div style="max-width:400px; margin:0 auto;">';
        result.scores.forEach((score, i) => {
            const width = Math.abs(score) / maxScore * 100;
            const color = score >= 0 ? '#3b82f6' : '#ef4444';
            const barDir = score >= 0 ? 'right' : 'left';
            html += `<div style="display:flex; align-items:center; gap:10px; margin:8px 0;">
                <span style="width:60px; text-align:right; font-weight:bold; font-size:0.9em;">"${this.vocab[i]}"</span>
                <div style="flex:1; height:28px; background:#f1f5f9; border-radius:6px; position:relative; overflow:hidden;">
                    <div style="position:absolute; ${barDir === 'right' ? 'left:50%' : 'right:50%'}; top:0; height:100%; width:${width / 2}%; background:${color}; border-radius:4px; transition:width 0.4s;"></div>
                </div>
                <span style="width:50px; font-size:0.85em; font-weight:bold; color:${color};">${score.toFixed(2)}</span>
            </div>`;
        });
        html += '</div>';

        html += '<div style="margin-top:14px; font-size:0.8em; color:#94a3b8;">Höherer Score = Modell "denkt", dieses Wort passt besser als nächstes.</div>';
        html += '</div>';
        return html;
    },

    renderSoftmaxStep: function(result) {
        let html = '<div style="text-align:center;">';
        html += '<div style="font-size:0.85em; color:#64748b; margin-bottom:14px;">Softmax wandelt Scores in <b>Wahrscheinlichkeiten</b> um (summieren sich zu 100%):</div>';

        // Sort by probability
        const items = this.vocab.map((word, i) => ({
            word, score: result.scores[i], prob: result.probs[i]
        })).sort((a, b) => b.prob - a.prob);

        html += '<div style="max-width:450px; margin:0 auto;">';
        items.forEach((item, i) => {
            const width = item.prob * 100;
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'];
            const color = colors[i];
            const isTop = i === 0;
            html += `<div style="display:flex; align-items:center; gap:10px; margin:10px 0; ${isTop ? 'transform:scale(1.05);' : ''}">
                <span style="width:60px; text-align:right; font-weight:bold; font-size:${isTop ? '1.1em' : '0.9em'}; color:${isTop ? color : '#475569'};">"${item.word}"</span>
                <div style="flex:1; height:${isTop ? '34px' : '26px'}; background:#f1f5f9; border-radius:6px; overflow:hidden; position:relative;">
                    <div style="height:100%; width:${width}%; background:${color}; border-radius:6px; transition:width 0.5s; display:flex; align-items:center; justify-content:flex-end; padding-right:8px;">
                        ${width > 15 ? `<span style="color:#fff; font-weight:bold; font-size:0.8em;">${(item.prob * 100).toFixed(1)}%</span>` : ''}
                    </div>
                    ${width <= 15 ? `<span style="position:absolute; right:8px; top:50%; transform:translateY(-50%); font-size:0.75em; color:#64748b;">${(item.prob * 100).toFixed(1)}%</span>` : ''}
                </div>
            </div>`;
        });
        html += '</div>';

        // Winner
        const winner = items[0];
        html += `<div style="margin-top:20px; padding:14px; background:#dcfce7; border-radius:10px; border:2px solid #34d399;">
            <span style="font-size:1.2em;">🎉 Gewählt: <b style="color:#065f46; font-size:1.3em;">"${winner.word}"</b></span>
            <span style="color:#64748b; font-size:0.85em; margin-left:10px;">(${(winner.prob * 100).toFixed(1)}% Wahrscheinlichkeit)</span>
        </div>`;

        html += '</div>';
        return html;
    }
};


// ============================================================
// INITIALIZATION FOR NN DEMOS (add to lazy loading)
// ============================================================

function initNNDemos() {
    // NN Approximation Demo
    const nnTargetFn = document.getElementById('nn-target-fn');
    const nnNeuronSlider = document.getElementById('nn-num-neurons');

    if (nnTargetFn) {
        nnTargetFn.addEventListener('change', () => NNApproxViz.render());
    }
    if (nnNeuronSlider) {
        nnNeuronSlider.addEventListener('input', () => NNApproxViz.render());
    }

    // NN Step-by-Step Demo
    const nnStepInput = document.getElementById('nn-step-input');
    if (nnStepInput) {
        nnStepInput.addEventListener('input', () => NNStepViz.render());
    }

    // NN Token Prediction Demo
    NNTokenViz.setStep(0);
}

// ============================================================
// DIMENSION VISUALIZER – Why do we need so many dimensions?
// 1D & 2D: Canvas (clean, static)
// 3D: Plotly scatter3d (interactive, rotatable)
// ============================================================

// ============================================================
// DIMENSION VISUALIZER – Why do we need so many dimensions?
// 1D: Canvas – shows a real, visible conflict
// 2D: Canvas – conflict resolved for 4 words, but not for 6
// 3D: CSS 3D transform – fast, interactive rotation
// ============================================================

const DimensionViz = {
    currentDim: 1,
    canvas: null,
    ctx: null,

    words: [
        { id: 'king', label: 'König', color: '#3b82f6' },
        { id: 'queen', label: 'Königin', color: '#ec4899' },
        { id: 'man', label: 'Mann', color: '#6366f1' },
        { id: 'woman', label: 'Frau', color: '#f43f5e' },
        { id: 'cat', label: 'Katze', color: '#10b981' },
        { id: 'dog', label: 'Hund', color: '#f59e0b' },
    ],

    // Relationships we want to encode:
    // König ↔ Königin (Paar), Mann ↔ Frau (Paar)
    // König ↔ Mann (männlich), Königin ↔ Frau (weiblich)
    // Katze ↔ Hund (Tiere)
    // König/Königin/Mann/Frau WEIT WEG von Katze/Hund

    // 1D: We MUST choose one ordering. Any ordering breaks something.
    // Best attempt: group by gender? König-Mann-Hund-Katze-Frau-Königin? Nope.
    // The fundamental issue: König must be near Mann AND near Königin,
    // but Mann must be near Frau. So: Mann-König-Königin-Frau works for those...
    // BUT then König is far from Frau (ok) and Mann is far from Königin (ok)
    // The REAL conflict: where do Katze/Hund go?
    // If animals are at the end: Frau is near Katze (wrong!)
    // If animals are in the middle: they split the human pairs (wrong!)
    
    // Let's make the conflict about animals splitting humans:
    // Ordering: König - Königin - [Katze - Hund] - Mann - Frau
    // Now König↔Mann are far apart (CONFLICT!) even though both are male.
    
    positions1D: {
        king:  0.12,
        queen: 0.24,
        cat:   0.45,
        dog:   0.55,
        man:   0.76,
        woman: 0.88,
    },

    // The conflicts in 1D:
    // König ↔ Mann should be close (both male) → but they're far apart!
    // Königin ↔ Frau should be close (both female) → but they're far apart!
    conflicts1D: [
        { pair: ['king', 'man'], label: 'beide männlich – sollten nah sein!' },
        { pair: ['queen', 'woman'], label: 'beide weiblich – sollten nah sein!' },
    ],

    // What IS close in 1D (works):
    satisfied1D: [
        { pair: ['king', 'queen'], label: 'Königspaar ✓' },
        { pair: ['man', 'woman'], label: 'Geschlechterpaar ✓' },
        { pair: ['cat', 'dog'], label: 'Tiere ✓' },
    ],

    positions2D: {
        king:  { x: 0.22, y: 0.28 },
        queen: { x: 0.22, y: 0.72 },
        man:   { x: 0.52, y: 0.28 },
        woman: { x: 0.52, y: 0.72 },
        cat:   { x: 0.80, y: 0.42 },
        dog:   { x: 0.80, y: 0.58 },
    },

    // In 2D: the square works, but animals are just "to the right" –
    // there's no dedicated axis separating humans from animals.
    // If we added more animal words, they'd crowd into the human space.

    positions3D: {
        // x = royalty (0=royal, 1=common)
        // y = gender (0=male, 1=female)  
        // z = species (0=human, 1=animal)
        king:  { x: 0, y: 0, z: 0 },
        queen: { x: 0, y: 1, z: 0 },
        man:   { x: 1, y: 0, z: 0 },
        woman: { x: 1, y: 1, z: 0 },
        cat:   { x: 0.5, y: 0.5, z: 1 },
        dog:   { x: 0.5, y: 0.5, z: 1 },
    },

    // 3D rotation state
    rotX: -25,
    rotY: 35,
    dragging: false,
    lastMouseX: 0,
    lastMouseY: 0,

    setDim: function(dim) {
        this.currentDim = dim;
        [1, 2, 3].forEach(d => {
            const btn = document.getElementById(`dim-btn-${d}`);
            if (btn) btn.classList.toggle('dim-btn-active', d === dim);
        });
        this.render();
    },

    render: function() {
        const container = document.getElementById('dimension-plot');
        if (!container) return;

        const dim = this.currentDim;

        if (dim === 3) {
            this.render3DCSS(container);
        } else {
            this.setupCanvas(container);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
            if (dim === 1) this.render1D(this.canvasW, this.canvasH);
            else this.render2D(this.canvasW, this.canvasH);
        }

        this.renderExplanation();
    },

    setupCanvas: function(container) {
        container.innerHTML = '';
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvasW = rect.width;
        this.canvasH = rect.height;
        this.canvas.width = this.canvasW * dpr;
        this.canvas.height = this.canvasH * dpr;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
    },

    // ===================== 1D =====================
    render1D: function(W, H) {
        const ctx = this.ctx;
        const margin = 50;
        const lineY = H * 0.50;
        const lineX1 = margin;
        const lineX2 = W - margin;
        const lineW = lineX2 - lineX1;

        const getX = (id) => lineX1 + this.positions1D[id] * lineW;

        // Background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);

        // Number line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lineX1 - 10, lineY);
        ctx.lineTo(lineX2 + 10, lineY);
        ctx.stroke();

        // Tick marks
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = lineX1 + (lineW * i / 10);
            ctx.beginPath();
            ctx.moveTo(x, lineY - 5);
            ctx.lineTo(x, lineY + 5);
            ctx.stroke();
        }

        // Draw SATISFIED connections (green, below the line)
        this.satisfied1D.forEach(({ pair, label }, idx) => {
            const x1 = getX(pair[0]);
            const x2 = getX(pair[1]);
            const arcDepth = 30 + idx * 15;

            ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, lineY + 14);
            ctx.quadraticCurveTo((x1 + x2) / 2, lineY + arcDepth + 15, x2, lineY + 14);
            ctx.stroke();

            // Green check label
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.textAlign = 'center';
            ctx.fillText(label, (x1 + x2) / 2, lineY + arcDepth + 25);
        });

        // Draw CONFLICT connections (red, above the line)
        this.conflicts1D.forEach(({ pair, label }, idx) => {
            const x1 = getX(pair[0]);
            const x2 = getX(pair[1]);
            const arcHeight = 60 + idx * 30;

            // Red highlight zone
            ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
            ctx.fillRect(Math.min(x1, x2) - 5, lineY - arcHeight - 10, Math.abs(x2 - x1) + 10, arcHeight + 5);

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, lineY - 14);
            ctx.quadraticCurveTo((x1 + x2) / 2, lineY - arcHeight, x2, lineY - 14);
            ctx.stroke();
            ctx.setLineDash([]);

            // Red X label
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('✗ ' + label, (x1 + x2) / 2, lineY - arcHeight - 5);
        });

        // Draw word dots
        this.words.forEach(word => {
            const x = getX(word.id);

            // White background circle
            ctx.beginPath();
            ctx.arc(x, lineY, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // Colored circle
            ctx.beginPath();
            ctx.arc(x, lineY, 13, 0, Math.PI * 2);
            ctx.fillStyle = word.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label above
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(word.label, x, lineY - 22);
        });

        // Title
        ctx.font = '12px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('← nur eine Dimension (Zahlenlinie) →', W / 2, H - 10);
    },

    // ===================== 2D =====================
    render2D: function(W, H) {
        const ctx = this.ctx;
        const margin = 65;
        const areaX = margin;
        const areaY = 30;
        const areaW = W - 2 * margin;
        const areaH = H - 90;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);

        // Subtle grid
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const x = areaX + (areaW * i / 5);
            ctx.beginPath(); ctx.moveTo(x, areaY); ctx.lineTo(x, areaY + areaH); ctx.stroke();
            const y = areaY + (areaH * i / 5);
            ctx.beginPath(); ctx.moveTo(areaX, y); ctx.lineTo(areaX + areaW, y); ctx.stroke();
        }

        // Axis labels
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('← königlich                    gewöhnlich →', W / 2, H - 12);
        ctx.save();
        ctx.translate(14, areaY + areaH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('← männlich                    weiblich →', 0, 0);
        ctx.restore();

        const getXY = (id) => ({
            x: areaX + this.positions2D[id].x * areaW,
            y: areaY + this.positions2D[id].y * areaH
        });

        // Draw ALL connections as green (all satisfied in 2D)
        const allPairs = [
            ['king', 'queen', 'Königspaar'],
            ['man', 'woman', 'Geschlechterpaar'],
            ['king', 'man', 'männlich'],
            ['queen', 'woman', 'weiblich'],
            ['cat', 'dog', 'Tiere'],
        ];

        allPairs.forEach(([id1, id2, label]) => {
            const p1 = getXY(id1);
            const p2 = getXY(id2);

            ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            ctx.font = '9px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.textAlign = 'center';
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            ctx.fillText('✓ ' + label, mx, my - 6);
        });

        // Dashed square around king-queen-man-woman
        const kp = getXY('king'), qp = getXY('queen'), mp = getXY('man'), wp = getXY('woman');
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(kp.x, kp.y); ctx.lineTo(mp.x, mp.y);
        ctx.lineTo(wp.x, wp.y); ctx.lineTo(qp.x, qp.y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Word dots
        this.words.forEach(word => {
            const p = getXY(word.id);

            ctx.beginPath();
            ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = word.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(word.label, p.x, p.y + 28);
        });

        // Note about limitation
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#d97706';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Tiere haben keine eigene Achse – bei mehr Tierwörtern wird es eng!', W / 2, H - 30);
    },

    // ===================== 3D (CSS Transform) =====================
    render3DCSS: function(container) {
        container.innerHTML = '';

        // Create 3D scene with CSS transforms
        const scene = document.createElement('div');
        scene.style.cssText = `
            width: 100%; height: 100%; perspective: 800px;
            display: flex; align-items: center; justify-content: center;
            user-select: none; cursor: grab; position: relative;
        `;

        const cube = document.createElement('div');
        cube.id = 'dim3d-cube';
        cube.style.cssText = `
            width: 280px; height: 280px; position: relative;
            transform-style: preserve-3d;
            transform: rotateX(${this.rotX}deg) rotateY(${this.rotY}deg);
            transition: transform 0.05s linear;
        `;

        // Draw axes as lines
        const axisLength = 140;
        const axes = [
            { dir: [1, 0, 0], color: '#3b82f6', label: 'Rang' },
            { dir: [0, 1, 0], color: '#ec4899', label: 'Geschlecht' },
            { dir: [0, 0, 1], color: '#10b981', label: 'Spezies' },
        ];

        axes.forEach(axis => {
            // Axis line
            const line = document.createElement('div');
            const len = axisLength;
            const dx = axis.dir[0], dy = axis.dir[1], dz = axis.dir[2];

            line.style.cssText = `
                position: absolute; left: 50%; top: 50%;
                width: ${len}px; height: 2px;
                background: ${axis.color}; opacity: 0.5;
                transform-origin: 0% 50%;
                transform: translate3d(0, 0, 0)
                    rotateY(${dx ? 0 : dz ? 90 : 0}deg)
                    rotateZ(${dy ? -90 : 0}deg)
                    rotateX(${0}deg);
            `;

            // Simpler approach: position axis endpoints
            const axisEl = document.createElement('div');
            axisEl.style.cssText = `
                position: absolute;
                left: 50%; top: 50%;
                width: 2px; height: 2px;
                transform-style: preserve-3d;
            `;

            // Create axis with SVG line
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '0');
            svg.setAttribute('height', '0');
            svg.style.overflow = 'visible';
            svg.style.position = 'absolute';

            cube.appendChild(axisEl);

            // Axis label
            const lbl = document.createElement('div');
            lbl.textContent = axis.label;
            lbl.style.cssText = `
                position: absolute; left: 50%; top: 50%;
                transform: translate3d(${dx * (axisLength + 15)}px, ${-dy * (axisLength + 15)}px, ${dz * (axisLength + 15)}px);
                font: bold 11px system-ui; color: ${axis.color};
                white-space: nowrap; pointer-events: none;
            `;
            cube.appendChild(lbl);
        });

        // Draw 3D axis lines using thin divs
        // X axis
        this.create3DLine(cube, 0, 0, 0, axisLength, 0, 0, '#3b82f6', 2, 0.5);
        // Y axis
        this.create3DLine(cube, 0, 0, 0, 0, -axisLength, 0, '#ec4899', 2, 0.5);
        // Z axis
        this.create3DLine(cube, 0, 0, 0, 0, 0, axisLength, '#10b981', 2, 0.5);

        // Draw connection lines between related words
        const scale = 110;
        const offset = { x: 0, y: 0, z: 0 };

        const get3DPos = (id) => {
            const p = this.positions3D[id];
            return {
                x: (p.x - 0.5) * scale * 2,
                y: -(p.y - 0.5) * scale * 2,
                z: (p.z - 0.5) * scale * 2
            };
        };

        // Connection lines
        const connections = [
            ['king', 'queen'], ['man', 'woman'], ['king', 'man'],
            ['queen', 'woman'], ['cat', 'dog']
        ];

        connections.forEach(([id1, id2]) => {
            const p1 = get3DPos(id1);
            const p2 = get3DPos(id2);
            this.create3DLine(cube, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, '#10b981', 1.5, 0.3);
        });

        // Place word dots
        this.words.forEach(word => {
            const p = get3DPos(word.id);

            const dot = document.createElement('div');
            dot.style.cssText = `
                position: absolute; left: 50%; top: 50%;
                width: 24px; height: 24px; border-radius: 50%;
                background: ${word.color}; border: 2px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transform: translate3d(${p.x}px, ${p.y}px, ${p.z}px) translate(-50%, -50%);
                display: flex; align-items: center; justify-content: center;
            `;

            const label = document.createElement('div');
            label.textContent = word.label;
            label.style.cssText = `
                position: absolute; left: 50%; top: 50%;
                transform: translate3d(${p.x}px, ${p.y + 20}px, ${p.z}px) translate(-50%, 0);
                font: bold 12px system-ui; color: ${word.color};
                white-space: nowrap; pointer-events: none;
                text-shadow: 0 0 4px #fff, 0 0 4px #fff, 0 0 4px #fff;
            `;

            cube.appendChild(dot);
            cube.appendChild(label);
        });

        scene.appendChild(cube);
        container.appendChild(scene);

        // Drag hint
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: absolute; bottom: 8px; right: 12px;
            font: 11px system-ui; color: #94a3b8;
        `;
        hint.textContent = '🖱️ Ziehen zum Drehen';
        container.style.position = 'relative';
        container.appendChild(hint);

        // Axis legend
        const legend = document.createElement('div');
        legend.style.cssText = `
            position: absolute; top: 8px; left: 12px;
            font: 11px system-ui; line-height: 1.6;
        `;
        legend.innerHTML = `
            <span style="color:#3b82f6">━ Rang</span> (königlich↔gewöhnlich)<br>
            <span style="color:#ec4899">━ Geschlecht</span> (m↔w)<br>
            <span style="color:#10b981">━ Spezies</span> (Mensch↔Tier)
        `;
        container.appendChild(legend);

        // Mouse drag for rotation
        scene.addEventListener('mousedown', (e) => {
            this.dragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            scene.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.dragging) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.rotY += dx * 0.5;
            this.rotX += dy * 0.5;
            this.rotX = Math.max(-80, Math.min(80, this.rotX));
            cube.style.transform = `rotateX(${this.rotX}deg) rotateY(${this.rotY}deg)`;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            this.dragging = false;
            scene.style.cursor = 'grab';
        });

        // Touch support
        scene.addEventListener('touchstart', (e) => {
            this.dragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        });

        scene.addEventListener('touchmove', (e) => {
            if (!this.dragging) return;
            e.preventDefault();
            const dx = e.touches[0].clientX - this.lastMouseX;
            const dy = e.touches[0].clientY - this.lastMouseY;
            this.rotY += dx * 0.5;
            this.rotX += dy * 0.5;
            this.rotX = Math.max(-80, Math.min(80, this.rotX));
            cube.style.transform = `rotateX(${this.rotX}deg) rotateY(${this.rotY}deg)`;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        });

        scene.addEventListener('touchend', () => { this.dragging = false; });
    },

    // Helper: create a 3D line between two points using a rotated div
    create3DLine: function(parent, x1, y1, z1, x2, y2, z2, color, width, opacity) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length < 0.1) return;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const midZ = (z1 + z2) / 2;

        // Calculate rotation angles
        const phi = Math.atan2(dy, dx);
        const theta = Math.acos(dz / length);

        const line = document.createElement('div');
        line.style.cssText = `
            position: absolute; left: 50%; top: 50%;
            width: ${length}px; height: ${width}px;
            background: ${color}; opacity: ${opacity};
            border-radius: ${width}px;
            transform-origin: 50% 50%;
            transform: translate3d(${midX}px, ${midY}px, ${midZ}px)
                       rotateZ(${phi * 180 / Math.PI}deg)
                       rotateY(${(Math.PI / 2 - theta) * 180 / Math.PI}deg)
                       translate(-50%, -50%);
            pointer-events: none;
        `;
        parent.appendChild(line);
    },

    // ===================== EXPLANATION =====================
    renderExplanation: function() {
        const explDiv = document.getElementById('dimension-explanation');
        if (!explDiv) return;

        const dim = this.currentDim;

        if (dim === 1) {
            explDiv.style.background = '#fef2f2';
            explDiv.style.borderColor = '#fecaca';
            explDiv.style.color = '#991b1b';
            explDiv.innerHTML = `🔴 <b>1 Dimension:</b> Auf einer Zahlenlinie muss man sich entscheiden: 
                Entweder König nah bei Königin (Paar) ODER König nah bei Mann (männlich) – aber nicht beides gleichzeitig, 
                ohne dass die Tiere dazwischen geraten! Hier sind König↔Mann und Königin↔Frau <b>zu weit auseinander</b>.
                <br><span style="font-size:0.85em; margin-top:4px; display:inline-block;">→ Eine Linie hat nur <b>eine</b> Richtung – aber wir brauchen mindestens zwei (Rang + Geschlecht)!</span>`;
        } else if (dim === 2) {
            explDiv.style.background = '#fefce8';
            explDiv.style.borderColor = '#fef08a';
            explDiv.style.color = '#854d0e';
            explDiv.innerHTML = `🟡 <b>2 Dimensionen:</b> Jetzt klappt alles! Eine Achse für Rang (links=königlich, rechts=gewöhnlich), 
                eine für Geschlecht (oben=m, unten=w). Alle Paare sind nah beieinander. 
                <br><span style="font-size:0.85em; margin-top:4px; display:inline-block;">⚠️ Aber: Katze & Hund sind einfach "rechts daneben" – es gibt keine eigene <b>Spezies-Achse</b>. 
                Bei mehr Tieren wird es eng!</span>`;
        } else {
            explDiv.style.background = '#f0fdf4';
            explDiv.style.borderColor = '#bbf7d0';
            explDiv.style.color = '#166534';
            explDiv.innerHTML = `🟢 <b>3 Dimensionen (Raum):</b> Jetzt hat jede Beziehung ihre eigene Achse! Drehe den Plot – du siehst: 
                Menschen oben, Tiere unten (Spezies-Achse). König/Königin links, Mann/Frau rechts (Rang-Achse). Männlich vorne, weiblich hinten (Geschlecht-Achse).
                <br><span style="font-size:0.85em; margin-top:4px; display:inline-block;">→ Reale Sprache hat <b>hunderte</b> solcher Beziehungen (Zeitform, Emotion, Formalität, Thema, Konkretheit...). 
                Deshalb nutzen LLMs <b>4096–12288 Dimensionen</b> – eine pro Bedeutungsfacette!</span>`;
        }
    }
};

function loadIntuitionModule() {
    // CSS animation (same as before, still eager — it's just a style tag)
    const intuitionStyle = document.createElement('style');
    intuitionStyle.textContent = `
        @keyframes tokenAppear {
            from { opacity: 0; transform: translateY(10px) scale(0.8); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
    `;
    document.head.appendChild(intuitionStyle);

    // --- Register each section for lazy init ---

    // Step 1: Tokenizer
    _lazyRegister('tokenizer-output', () => {
        const tokInput = document.getElementById('tokenizer-input');
        if (tokInput) {
		let _tokenDebounce = null;
		tokInput.addEventListener('input', () => {
			clearTimeout(_tokenDebounce);
			_tokenDebounce = setTimeout(() => TokenizerViz.render(), 150);
		});
        }
        TokenizerViz.render();
    });

    // Step 2: Embedding
    _lazyRegister('embedding-viz-plot', () => {
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
        EmbeddingViz.doArithmetic();
    });

    // Step 3: Positional Encoding
    _lazyRegister('positional-encoding-plot', () => {
        const peSlider = document.getElementById('pe-num-dims');
        if (peSlider) {
            peSlider.addEventListener('input', () => PositionalEncodingViz.render());
        }
        PositionalEncodingViz.render();
        PositionalEncodingViz.renderAdditionDemo();

        ['pe-demo-word', 'pe-demo-pos1', 'pe-demo-pos2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => PositionalEncodingViz.renderAdditionDemo());
        });
    });

    // Step 4a: Attention (bank/river/money plot)
    _lazyRegister('transformer-plot', () => {
        runAttention();
    });

    // Step 4b: FFN
    _lazyRegister('ffn-viz-container', () => {
        FFNViz.setScenario('apple_fruit');
    });

    // Step 4c: Residual Stream
    _lazyRegister('residual-stream-plot', () => {
        ResidualStreamViz.init();
        ResidualStreamViz.render();
        const layerSlider = document.getElementById('residual-stream-layer');
        if (layerSlider) {
            layerSlider.addEventListener('input', function () {
                ResidualStreamViz.setLayer(parseInt(this.value));
            });
        }
    });

    // Step 5: Prediction
    _lazyRegister('prediction-plot', () => {
        const tempSlider = document.getElementById('prediction-temperature');
        if (tempSlider) {
            tempSlider.addEventListener('input', () => PredictionViz.render());
        }
        PredictionViz.render();
    });


    // NN Approximation Demo
    _lazyRegister('nn-approx-plot', () => {
        const nnTargetFn = document.getElementById('nn-target-fn');
        const nnNeuronSlider = document.getElementById('nn-num-neurons');
        if (nnTargetFn) nnTargetFn.addEventListener('change', () => NNApproxViz.render());
        if (nnNeuronSlider) nnNeuronSlider.addEventListener('input', () => NNApproxViz.render());
        NNApproxViz.render();
    });

    // NN Step-by-Step Demo
    _lazyRegister('nn-step-viz', () => {
        const nnStepInput = document.getElementById('nn-step-input');
        if (nnStepInput) nnStepInput.addEventListener('input', () => NNStepViz.render());
        NNStepViz.render();
    });

    // Dimension Visualizer
    _lazyRegister('dimension-plot', () => {
        DimensionViz.setDim(2);
    });

    // NN Token Prediction Demo
    _lazyRegister('nn-token-viz', () => {
        NNTokenViz.setStep(0);
    });

    // Start observing everything
    _lazyCreateObserver();
}
