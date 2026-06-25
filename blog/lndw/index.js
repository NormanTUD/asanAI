// intuition.js

/**
 * Interactive Visualizations for LLM Intuition Steps
 * Covers: Tokenization, Embedding, Positional Encoding, Transformer Layers, Final Prediction
 */

// ============================================================
// STEP 1: TOKENIZATION VISUALIZER — Hybrid: Morphem-Match + Live BPE Fallback
// ============================================================

const TokenizerViz = {
    tokenColors: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
        '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7', '#d946ef'
    ],

    knownSubwords: null,

    _rawSubwords: [
        // Deutsche Morpheme — Präfixe
        'un', 'ver', 'be', 'ge', 'er', 'zer', 'ent', 'emp', 'miss', 'vor',
        'nach', 'aus', 'ein', 'auf', 'ab', 'an', 'über', 'unter', 'durch',
        'um', 'mit', 'zu', 'bei', 'von', 'hin', 'her', 'weg', 'zurück',
	"ein", "mal", "ein", "könig", "s", "kind",
        // Suffixe
        'ung', 'heit', 'keit', 'lich', 'isch', 'bar', 'sam', 'haft',
        'chen', 'lein', 'schaft', 'tum', 'nis', 'sal', 'ig', 'los',
        // Komposita-Bausteine
        'donau', 'dampf', 'schiff', 'fahrt',
        'gesellschaft', 'haupt', 'stadt', 'bahn', 'hof', 'straße',
        'arbeit', 'geber', 'nehmer', 'platz', 'zeit', 'raum',
        'hand', 'werk', 'zeug', 'bau', 'stein', 'holz', 'wasser',
        'feuer', 'luft', 'erde', 'berg', 'wald', 'feld', 'land',
        'haus', 'tür', 'fenster', 'dach', 'wand', 'boden',
        'tag', 'nacht', 'morgen', 'abend', 'mittag', 'jahr',
        'monat', 'woche', 'stunde', 'minute', 'sekunde',
        'kopf', 'herz', 'auge', 'ohr', 'mund', 'fuß', 'arm', 'bein',
        'kind', 'mann', 'frau', 'mensch', 'tier', 'hund', 'katze',
        'groß', 'klein', 'alt', 'neu', 'gut', 'schlecht', 'schön',
        'lang', 'kurz', 'hoch', 'tief', 'breit', 'schmal', 'schnell',
        'wort', 'satz', 'text', 'buch', 'brief', 'bild', 'lied',
        'spiel', 'leben', 'liebe', 'freund', 'feind', 'kraft',
        'elektr', 'izität', 'kapitän', 'betrieb', 'beamte',
        // Ganze kurze Wörter
        'ist', 'und', 'oder', 'aber', 'weil', 'dass', 'wenn', 'als',
        'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer',
        'ich', 'du', 'wir', 'ihr', 'sie', 'es', 'er', 'man',
        'nicht', 'auch', 'noch', 'schon', 'nur', 'sehr', 'mehr',
        'hat', 'haben', 'sein', 'war', 'wird', 'kann', 'muss',
        'langes', 'lange', 'langen', 'langer',
        'besteht', 'bestehen',
        // Englisch
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'can', 'could', 'shall', 'should', 'may', 'might', 'must',
        'not', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
        'cat', 'dog', 'sat', 'on', 'mat', 'hat', 'bat', 'rat',
        'king', 'queen', 'man', 'woman', 'child', 'boy', 'girl',
        'once', 'upon', 'time', 'there', 'here', 'where', 'what',
        'play', 'ing', 'ed', 'ly', 'ness', 'ment', 'tion', 'sion',
        'pre', 'dis', 'mis', 'over', 'out', 'up', 'down', 're', 'in',
        'able', 'ible', 'ful', 'less', 'ous', 'ive', 'al', 'ial',
        'trans', 'form', 'under', 'stand', 'break',
        'hello', 'world', 'good', 'great', 'happy', 'love',
        'dragon', 'fly', 'fire', 'ice', 'stone', 'wood',
    ],

    maxSubwordLen: 14,
    minSubwordLen: 2,

    init: function() {
        this.knownSubwords = new Set(this._rawSubwords);
    },

    _hashID: function(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return hash % 50000;
    },

    segmentWord: function(word) {
        if (!this.knownSubwords) this.init();
        word = word.toLowerCase();

        const segments = [];
        let i = 0;
        let unknownBuffer = '';

        while (i < word.length) {
            let bestLen = 0;
            let bestSegment = '';

            for (let len = Math.min(this.maxSubwordLen, word.length - i); len >= this.minSubwordLen; len--) {
                const candidate = word.substring(i, i + len);
                if (this.knownSubwords.has(candidate)) {
                    bestLen = len;
                    bestSegment = candidate;
                    break;
                }
            }

            if (bestLen > 0) {
                if (unknownBuffer.length > 0) {
                    const fallbackTokens = this._bpeFallback(unknownBuffer);
                    segments.push(...fallbackTokens);
                    unknownBuffer = '';
                }
                segments.push(bestSegment);
                i += bestLen;
            } else {
                unknownBuffer += word[i];
                i++;
            }
        }

        if (unknownBuffer.length > 0) {
            const fallbackTokens = this._bpeFallback(unknownBuffer);
            segments.push(...fallbackTokens);
        }

        return segments;
    },

    _commonPairs: new Set([
        'th', 'he', 'in', 'er', 'an', 'en', 'on', 'at', 'es', 'or',
        'te', 'of', 'ed', 'is', 'it', 'al', 'ar', 'st', 'to', 'nt',
        'ng', 'se', 'ha', 'ou', 'io', 'le', 'no', 're', 'hi', 'ea',
        'ri', 'ro', 'co', 'de', 'ra', 'li', 'ch', 'ei', 'ie', 'au',
        'sc', 'un', 'ge', 'be', 'ck', 'nd', 'tz', 'pf', 'sch',
    ]),

    _bpeFallback: function(str) {
        if (str.length <= 2) return [str];

        let tokens = str.split('');

        for (let round = 0; round < 20 && tokens.length > 1; round++) {
            let bestIdx = -1;
            let bestScore = -1;

            for (let i = 0; i < tokens.length - 1; i++) {
                const pair = tokens[i] + tokens[i + 1];
                let score = tokens[i].length + tokens[i + 1].length;
                if (this._commonPairs.has(pair)) score += 10;
                if (this.knownSubwords.has(pair)) score += 100;

                if (score > bestScore) {
                    bestScore = score;
                    bestIdx = i;
                }
            }

            if (bestIdx < 0) break;

            const merged = tokens[bestIdx] + tokens[bestIdx + 1];

            if (this.knownSubwords.has(merged)) {
                tokens = [...tokens.slice(0, bestIdx), merged, ...tokens.slice(bestIdx + 2)];
                continue;
            }

            if (this._commonPairs.has(tokens[bestIdx] + tokens[bestIdx + 1]) || tokens.length > 4) {
                tokens = [...tokens.slice(0, bestIdx), merged, ...tokens.slice(bestIdx + 2)];
            } else {
                break;
            }
        }

        return tokens;
    },

    // ——— Hauptfunktion: Text → Tokens (MIT Whitespace-Support) ———
    tokenize: function(text) {
        if (!this.knownSubwords) this.init();

        // Split mit Capture-Group: Whitespace bleibt als eigenes Element erhalten
        const parts = text.split(/(\s+)/).filter(p => p.length > 0);
        const allTokens = [];
        let wordIdx = 0;

        parts.forEach((part) => {
            // Prüfe ob es ein Whitespace-Segment ist
            if (/^\s+$/.test(part)) {
                const displayText = part
                    .replace(/ /g, '␣')
                    .replace(/\t/g, '⇥')
                    .replace(/\n/g, '↵')
                    .replace(/\r/g, '⏎');

                allTokens.push({
                    text: part,
                    displayText: displayText,
                    id: this._hashID(part),
                    isSubword: false,
                    originalWord: part,
                    displayOriginal: displayText,
                    splitIndex: 0,
                    splitTotal: 1,
                    wordIndex: wordIdx,
                    isPunct: false,
                    isWhitespace: true
                });
                wordIdx++;
                return;
            }

            // Normales Wort verarbeiten
            const rawWord = part;

            // Satzzeichen abtrennen
            let word = rawWord;
            let punctBefore = '';
            let punctAfter = '';

            const punctMatchAfter = word.match(/^(.+?)([.,!?;:"""'']+)$/);
            if (punctMatchAfter) {
                word = punctMatchAfter[1];
                punctAfter = punctMatchAfter[2];
            }
            const punctMatchBefore = word.match(/^(["""'']+)(.+)$/);
            if (punctMatchBefore) {
                punctBefore = punctMatchBefore[1];
                word = punctMatchBefore[2];
            }

            // Satzzeichen vorne
            if (punctBefore) {
                allTokens.push({
                    text: punctBefore, displayText: punctBefore,
                    id: this._hashID(punctBefore), isSubword: false,
                    originalWord: rawWord, displayOriginal: rawWord,
                    splitIndex: 0, splitTotal: 1, wordIndex: wordIdx, isPunct: true,
                    isWhitespace: false
                });
            }

            // Wort segmentieren
            const lowerWord = word.toLowerCase();

            if (this.knownSubwords.has(lowerWord)) {
                allTokens.push({
                    text: lowerWord, displayText: word.toLowerCase(),
                    id: this._hashID(lowerWord), isSubword: false,
                    originalWord: rawWord, displayOriginal: rawWord,
                    splitIndex: 0, splitTotal: 1, wordIndex: wordIdx, isPunct: false,
                    isWhitespace: false
                });
            } else {
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
                        splitTotal: segments.length + (punctAfter ? 1 : 0),
                        wordIndex: wordIdx,
                        isPunct: false,
                        isWhitespace: false
                    });
                });
            }

            // Satzzeichen hinten
            if (punctAfter) {
                allTokens.push({
                    text: punctAfter, displayText: punctAfter,
                    id: this._hashID(punctAfter), isSubword: false,
                    originalWord: rawWord, displayOriginal: rawWord,
                    splitIndex: 0, splitTotal: 1, wordIndex: wordIdx, isPunct: true,
                    isWhitespace: false
                });
            }

            wordIdx++;
        });

        return allTokens;
    },

    // ——— Rendering ———
    render: function() {
        const input = document.getElementById('tokenizer-input');
        const outputDiv = document.getElementById('tokenizer-output');
        if (!input || !outputDiv) return;

        const text = input.value || 'Donaudampfschifffahrt ist ein langes Wort';
        const tokens = this.tokenize(text);

        // Token-Chips
        let html = '<div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; min-height:60px; align-items:flex-start;">';

        let currentWordIdx = -1;
        let colorIdx = -1;

        tokens.forEach((token, i) => {
            if (token.wordIndex !== currentWordIdx) {
                currentWordIdx = token.wordIndex;
                colorIdx++;
            }

            // Whitespace-Token speziell darstellen
            if (token.isWhitespace) {
                html += `
                    <div class="token-chip" style="
                        display:inline-flex; flex-direction:column; align-items:center;
                        padding:8px 10px; background:#f1f5f9; border-radius:8px;
                        border:1px dashed #94a3b8;
                        box-shadow:0 1px 2px rgba(0,0,0,0.05);
                        cursor:default; font-family:monospace;
                        transition: transform 0.15s;
                    " onmouseover="this.style.transform='translateY(-3px)'"
                      onmouseout="this.style.transform='translateY(0)'"
                      title="Whitespace: ${token.text.length} Zeichen">
                        <span style="font-weight:bold; font-size:1.05em; color:#64748b;">${token.displayText}</span>
                        <span style="font-size:0.65em; color:#94a3b8; font-family:monospace;">ID: ${token.id}</span>
                    </div>`;
                return;
            }

            const color = this.tokenColors[colorIdx % this.tokenColors.length];
            const isSplit = token.splitTotal > 1 && !token.isPunct;
            const isSubword = token.isSubword;

            html += `
                <div class="token-chip" style="
                    display:inline-flex; flex-direction:column; align-items:center;
                    padding:8px 12px; background:${isSplit ? color + '0a' : '#fff'}; border-radius:8px;
                    border-left:3px ${isSubword ? 'dashed' : 'solid'} ${color};
                    border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0;
                    box-shadow:0 2px 4px rgba(0,0,0,0.05);
                    cursor:default; transition: transform 0.15s;
                    ${isSubword ? 'margin-left:-3px;' : ''}
                " onmouseover="this.style.transform='translateY(-3px)'"
                  onmouseout="this.style.transform='translateY(0)'"
                  title="${token.displayOriginal} → Teil ${token.splitIndex + 1}/${token.splitTotal}">
                    <span style="font-weight:bold; font-size:1.05em; color:${color};">${token.displayText}</span>
                    <span style="font-size:0.65em; color:#94a3b8; font-family:monospace;">ID: ${token.id}</span>
                </div>`;
        });
        html += '</div>';

        // Zerlegungsanzeige
        const compoundWords = [];
        const seen = new Set();
        tokens.forEach(t => {
            if (t.splitTotal > 1 && !seen.has(t.originalWord) && !t.isPunct && !t.isWhitespace) {
                seen.add(t.originalWord);
                const parts = tokens.filter(tok => tok.originalWord === t.originalWord && !tok.isPunct && !tok.isWhitespace);
                if (parts.length > 1) {
                    compoundWords.push({ word: t.displayOriginal, parts: parts.map(p => p.displayText) });
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
// STEP 5: FINAL PREDICTION VISUALIZER — Smooth Tween Animation
// ============================================================

const PredictionViz = {
    vocabulary: [
        { word: 'ein', baseScore: 3.2 },
        { word: 'Drache', baseScore: 1.5 },
        { word: 'Königin', baseScore: -0.5 },
        { word: 'König', baseScore: -0.5 },
        { word: 'der', baseScore: -1.2 },
        { word: 'die', baseScore: 0.8 },
        { word: 'konnte', baseScore: 0.6 },
        { word: 'wollte', baseScore: -0.8 },
        { word: 'fliegen', baseScore: 0.3 },
        { word: 'für', baseScore: -0.3 },
        { word: 'dass', baseScore: 1.0 },
        { word: 'eine', baseScore: -1.8 },
        { word: ',', baseScore: -1.5 },
        { word: '.', baseScore: -1.5 },
    ],

    // Animation state
    animStep: 0,

    // Current interpolated values (what's actually displayed)
    currentTopK: 3,
    currentTemp: 1.0,

    // Tween state
    _tweenActive: false,
    _tweenStartTopK: 3,
    _tweenEndTopK: 3,
    _tweenStartTemp: 1.0,
    _tweenEndTemp: 1.0,
    _tweenStartTime: 0,
    _tweenDuration: 600,

    // Steps definition — each step is a TARGET state
    // Phase 1: Top-K von 3 auf 6 (bleibt dort)
    // Phase 2: Temperatur von 1.0 auf 1.8 (kreativ, Zwischenschritt)
    // Phase 3: Temperatur von 1.8 auf 3.0 (sehr kreativ)
    // Phase 4: Temperatur von 3.0 auf 0.1 (sehr unkreativ)
    _steps: [
        { topK: 3, temp: 1.0 },  // 0: Start
        { topK: 4, temp: 1.0 },  // 1
        { topK: 5, temp: 1.0 },  // 2
        { topK: 6, temp: 1.0 },  // 3: Top-K bleibt hier
        { topK: 6, temp: 1.8 },  // 4: Zwischenschritt — kreativ
        { topK: 6, temp: 3.0 },  // 5: sehr kreativ
        { topK: 6, temp: 0.1 },  // 6: sehr unkreativ
    ],

    getAnimState: function(step) {
        if (step < 0) step = 0;
        if (step >= this._steps.length) step = this._steps.length - 1;
        return this._steps[step];
    },

    isOnPredictionSlide: function() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Die finale Vorhersage';
    },

    canGoNext: function() {
        if (!this.isOnPredictionSlide()) return false;
        if (this._tweenActive) return false;
        const demoBox = document.querySelector('[data-title="Die finale Vorhersage"] .demo-box');
        if (!demoBox) return false;
        const parentFragment = demoBox.closest('.fragment');
        if (parentFragment && !parentFragment.classList.contains('visible')) return false;
        return this.animStep < this._steps.length - 1;
    },

    canGoPrev: function() {
        if (!this.isOnPredictionSlide()) return false;
        if (this._tweenActive) return false;
        const demoBox = document.querySelector('[data-title="Die finale Vorhersage"] .demo-box');
        if (!demoBox) return false;
        const parentFragment = demoBox.closest('.fragment');
        if (parentFragment && !parentFragment.classList.contains('visible')) return false;
        return this.animStep > 0;
    },

    next: function() {
        if (this.animStep < this._steps.length - 1) {
            this.animStep++;
            this._startTween();
        }
    },

    prev: function() {
        if (this.animStep > 0) {
            this.animStep--;
            this._startTween();
        }
    },

    reset: function() {
        this.animStep = 0;
        this._tweenActive = false;
        this.currentTopK = 3;
        this.currentTemp = 1.0;
        this._applyCurrentValues();
    },

    // ---- Smooth Tween Engine ----

    _startTween: function() {
        const target = this.getAnimState(this.animStep);
        this._tweenStartTopK = this.currentTopK;
        this._tweenEndTopK = target.topK;
        this._tweenStartTemp = this.currentTemp;
        this._tweenEndTemp = target.temp;
        this._tweenStartTime = performance.now();

        // Duration depends on distance — longer for temperature changes
        const topKDist = Math.abs(this._tweenEndTopK - this._tweenStartTopK);
        const tempDist = Math.abs(this._tweenEndTemp - this._tweenStartTemp);

        if (tempDist > 0.01) {
            // Temperature animation: scale duration with distance, min 800ms, max 2500ms
            this._tweenDuration = Math.min(2500, Math.max(800, tempDist * 700));
        } else if (topKDist > 0) {
            // TopK animation: 400ms per step
            this._tweenDuration = 400;
        } else {
            this._tweenDuration = 300;
        }

        if (!this._tweenActive) {
            this._tweenActive = true;
            this._tweenLoop();
        }
    },

    _easeInOutCubic: function(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    _tweenLoop: function() {
        if (!this._tweenActive) return;

        const now = performance.now();
        const elapsed = now - this._tweenStartTime;
        let t = Math.min(elapsed / this._tweenDuration, 1.0);
        const eased = this._easeInOutCubic(t);

        // Interpolate
        this.currentTopK = this._tweenStartTopK + (this._tweenEndTopK - this._tweenStartTopK) * eased;
        this.currentTemp = this._tweenStartTemp + (this._tweenEndTemp - this._tweenStartTemp) * eased;

        this._applyCurrentValues();

        if (t >= 1.0) {
            // Snap to exact target
            this.currentTopK = this._tweenEndTopK;
            this.currentTemp = this._tweenEndTemp;
            this._applyCurrentValues();
            this._tweenActive = false;
        } else {
            requestAnimationFrame(() => this._tweenLoop());
        }
    },

    _applyCurrentValues: function() {
        // Update sliders visually (smooth movement)
        const topKSlider = document.getElementById('prediction-topk');
        const tempSlider = document.getElementById('prediction-temperature');
        if (topKSlider) topKSlider.value = this.currentTopK;
        if (tempSlider) tempSlider.value = this.currentTemp;

        this.render();
    },

    // ---- Rendering ----

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

        const temperature = this.currentTemp;
        const topK = Math.round(this.currentTopK);

        // Update labels
        const tempLabel = document.getElementById('prediction-temp-val');
        if (tempLabel) {
            let desc = '';
            if (temperature < 0.2) desc = ' (sehr unkreativ)';
            else if (temperature < 0.5) desc = ' (unkreativ)';
            else if (temperature < 0.8) desc = ' (fokussiert)';
            else if (temperature < 1.3) desc = ' (balanciert)';
            else if (temperature < 2.2) desc = ' (kreativ)';
            else desc = ' (sehr kreativ)';
            tempLabel.textContent = temperature.toFixed(2) + desc;
        }

        const topKLabel = document.getElementById('prediction-topk-val');
        if (topKLabel) topKLabel.textContent = topK;

        const scores = this.vocabulary.map(v => v.baseScore);
        const probs = this.softmax(scores, temperature);

        // Sort by probability
        const items = this.vocabulary.map((v, i) => ({
            word: v.word,
            score: v.baseScore,
            prob: probs[i]
        })).sort((a, b) => b.prob - a.prob);

        const tokenColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7'];

        const colors = items.map((item, i) => {
            if (i < topK) {
                return tokenColors[i % tokenColors.length];
            }
            return '#e2e8f0';
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
            text: items.map((it, i) => i < topK ? (it.prob * 100).toFixed(1) + '%' : ''),
            textposition: 'outside',
            textfont: { size: 11 },
            hovertemplate: '<b>%{y}</b><br>P = %{x:.4f}<extra></extra>'
        };

        const layout = {
            margin: { l: 80, r: 60, b: 40, t: 10 },
            xaxis: {
                title: 'Wahrscheinlichkeit',
                range: [0, Math.min(1, Math.max(...items.map(it => it.prob)) * 1.3)],
                gridcolor: '#f1f5f9'
            },
            yaxis: {
                autorange: 'reversed',
                tickfont: { size: 12 }
            },
            plot_bgcolor: '#fff',
            bargap: 0.15,
            shapes: [{
                type: 'rect',
                xref: 'paper', yref: 'paper',
                x0: 0, x1: 1,
                y0: 0, y1: topK / items.length,
                fillcolor: 'rgba(99, 102, 241, 0.03)',
                line: { width: 0 }
            }],
            annotations: [{
                x: 0.95, y: 0,
                xref: 'paper', yref: 'paper',
                text: `Top-${topK}`,
                showarrow: false,
                font: { size: 12, color: '#6366f1', weight: 'bold' },
                xanchor: 'right', yanchor: 'top'
            }]
        };

        Plotly.react(plotDiv, [trace], layout, { displayModeBar: false, responsive: true });

        // Render token display below
        const topKItems = items.slice(0, topK);
        this.renderTokenDisplay(topKItems, temperature);
    },

    renderTokenDisplay: function(topKItems, temperature) {
        const container = document.getElementById('prediction-token-display');
        if (!container) return;

        const tokenColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7'];

        const totalProb = topKItems.reduce((s, it) => s + it.prob, 0);

        let html = '<div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; align-items:center;">';
        html += '<span style="color:#64748b; font-size:0.85em; margin-right:8px;">Auswahl aus:</span>';

        topKItems.forEach((item, i) => {
            const color = tokenColors[i % tokenColors.length];
            const relProb = (item.prob / totalProb * 100).toFixed(0);
            const opacity = 0.4 + (item.prob / topKItems[0].prob) * 0.6;

            html += `<div style="
                display:inline-flex; align-items:center; gap:4px;
                padding:6px 12px; border-radius:8px;
                background:${color}15; border:2px solid ${color};
                opacity:${opacity};
                transition: all 0.1s ease;
            ">
                <span style="font-weight:bold; color:${color};">${item.word}</span>
                <span style="font-size:0.75em; color:${color}88;">${relProb}%</span>
            </div>`;
        });

        html += '</div>';

        // Temperature indicator
        let tempNote = '';
        if (temperature < 0.3) {
            tempNote = '🎯 Niedrige Temperatur: Fast immer wird das wahrscheinlichste Token gewählt.';
        } else if (temperature > 2.0) {
            tempNote = '🎲 Hohe Temperatur: Auch unwahrscheinliche Tokens haben eine Chance — mehr Überraschung!';
        } else if (temperature > 1.4) {
            tempNote = '🎲 Kreative Temperatur: Die Verteilung wird flacher, mehr Variation möglich.';
        } else {
            tempNote = '⚖️ Balancierte Temperatur: Gute Mischung aus Vorhersagbarkeit und Variation.';
        }
        html += `<div style="margin-top:8px; color:#64748b; font-size:0.85em; text-align:center;">${tempNote}</div>`;

        container.innerHTML = html;
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

// Step 2: Embedding (from embeddinglab.js)
initEmbeddingEditor();  // Renders the editable table
renderSpace('2d');      // Renders the 2D plot
// Also render the dual manifold if the div exists
if (document.getElementById('plot-dual-manifolds')) {
    renderDualManifolds();
}

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
	'park': { base: [1, 9], color: '#10b981' },
	'geld': { base: [9, 1], color: '#f59e0b' }
};

// ============================================================
// ATTENTION DEMO — Beispielsätze mit Pfeiltasten-Navigation
// ============================================================

const AttentionDemo = {
    currentExample: 0,

	examples: [
		{
			sentence: 'Ich gehe zur <b class="attnexample" style="color:#3b82f6;">Bank</b>.',
			// Kein Kontextwort → "Bank" bleibt in der Mitte (ambig)
			contextWords: [],
			bankShift: [5, 5] // Bleibt genau auf der Basisposition – keine Verschiebung
		},
		{
			sentence: 'Ich bringe mein <b class="attnexample" style="color:#f59e0b;">Geld</b> auf die <b class="attnexample" style="color:#3b82f6;">Bank</b>.',
			// "Bank" wird Richtung "Geld" gezogen (Finanzinstitut)
			contextWords: ['geld'],
			bankShift: [7.5, 2.5] // Richtung Geld (oben rechts = Finanzen)
		},
		{
			sentence: 'Ich sitze im <b class="attnexample" style="color:#10b981;">Park</b> auf der <b class="attnexample" style="color:#3b82f6;">Bank</b>.',
			// "Bank" wird Richtung "Park" gezogen (Sitzgelegenheit)
			contextWords: ['park'],
			bankShift: [2.5, 7.5] // Richtung Park (oben links = Natur/Sitzen)
		},
		{
			sentence: 'Nach dem <b class="attnexample" style="color:#10b981;">Spaziergang</b> im <b class="attnexample" style="color:#10b981;">Park</b> gehe ich zur <b class="attnexample" style="color:#f59e0b;">Bank</b>, um <b class="attnexample" style="color:#f59e0b;">Geld</b> abzuheben.',
			// Beide Kontexte, aber "Geld" + "Bank" (abheben) dominiert → Finanzinstitut
			contextWords: ['park', 'geld'],
			bankShift: [6.8, 3.8] // Stärker Richtung Geld, leicht von Park beeinflusst
		}
	],

    vocabPositions: {
        'bank':  { base: [5, 5], color: '#3b82f6', label: 'Bank' },
        'park':  { base: [1, 9], color: '#10b981', label: 'Park' },
        'geld':  { base: [9, 1], color: '#f59e0b', label: 'Geld' }
    },

    isOnAttentionSlide: function() {
        const slides = document.querySelectorAll('.slide');
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Attention';
    },

    canGoNext: function() {
        if (!this.isOnAttentionSlide()) return false;
        // Prüfe ob das fragment mit dem Plot schon sichtbar ist
        const plotContainer = document.getElementById('transformer-plot');
        if (!plotContainer) return false;
        const parentFragment = plotContainer.closest('.fragment');
        if (parentFragment && !parentFragment.classList.contains('visible')) return false;
        return this.currentExample < this.examples.length - 1;
    },

    canGoPrev: function() {
        if (!this.isOnAttentionSlide()) return false;
        const plotContainer = document.getElementById('transformer-plot');
        if (!plotContainer) return false;
        const parentFragment = plotContainer.closest('.fragment');
        if (parentFragment && !parentFragment.classList.contains('visible')) return false;
        return this.currentExample > 0;
    },

    next: function() {
        if (this.currentExample < this.examples.length - 1) {
            this.currentExample++;
            this.render();
        }
    },

    prev: function() {
        if (this.currentExample > 0) {
            this.currentExample--;
            this.render();
        }
    },

    reset: function() {
        this.currentExample = 0;
        this.render();
    },

    render: function() {
        const container = 'transformer-plot';
        const plotDiv = document.getElementById(container);
        const sentenceDisplay = document.getElementById('attention-sentence-display');
        if (!plotDiv) return;

        const example = this.examples[this.currentExample];

        // Update sentence display
        if (sentenceDisplay) {
            sentenceDisplay.innerHTML = example.sentence;
        }

        let traces = [];

        // 1. Statische Vokabular-Punkte (Hintergrund)
        Object.keys(this.vocabPositions).forEach(word => {
            const pos = this.vocabPositions[word].base;
            traces.push({
                x: [pos[0]], y: [pos[1]],
                mode: 'markers+text',
                name: this.vocabPositions[word].label,
                text: [this.vocabPositions[word].label],
                textposition: 'bottom center',
                textfont: { size: 13, color: this.vocabPositions[word].color },
                marker: { size: 14, opacity: 0.5, color: this.vocabPositions[word].color },
                type: 'scatter',
                showlegend: false
            });
        });

        // 2. Attention-Linien von Bank zu Kontextwörtern
        const bankBase = this.vocabPositions['bank'].base;

        example.contextWords.forEach(word => {
            if (this.vocabPositions[word]) {
                const otherBase = this.vocabPositions[word].base;
                traces.push({
                    x: [bankBase[0], otherBase[0]],
                    y: [bankBase[1], otherBase[1]],
                    mode: 'lines',
                    line: { color: '#f97316', width: 2.5, dash: 'dot' },
                    hoverinfo: 'none',
                    showlegend: false,
                    type: 'scatter'
                });
            }
        });

        // 3. Kontextualisiertes Embedding (verschobener Punkt)
        traces.push({
            x: [example.bankShift[0]], y: [example.bankShift[1]],
            mode: 'markers+text',
            text: ['"Bank" im Kontext'],
            textposition: 'top center',
            textfont: { size: 12, color: '#1e293b' },
            marker: {
                size: 18,
                color: '#3b82f6',
                symbol: 'diamond',
                line: { color: '#1e293b', width: 2 }
            },
            type: 'scatter',
            showlegend: false
        });

        // 4. Pfeil/Linie von Bank-Basis zum verschobenen Punkt
        traces.push({
            x: [bankBase[0], example.bankShift[0]],
            y: [bankBase[1], example.bankShift[1]],
            mode: 'lines',
            line: { color: '#3b82f6', width: 2, dash: 'solid' },
            hoverinfo: 'none',
            showlegend: false,
            type: 'scatter'
        });

        const layout = {
            margin: { l: 40, r: 40, b: 40, t: 40 },
            hovermode: 'closest',
            xaxis: {
                range: [0, 10],
                title: 'Semantische Dimension A',
                gridcolor: '#e2e8f0',
                zeroline: false
            },
            yaxis: {
                range: [0, 10],
                title: 'Semantische Dimension B',
                gridcolor: '#e2e8f0',
                zeroline: false
            },
            showlegend: false,
            annotations: [
                {
                    x: 9, y: 0.5,
                    showarrow: false,
                    font: { size: 11, color: '#f59e0b' }
                },
                {
                    x: 1, y: 9.5,
                    showarrow: false,
                    font: { size: 11, color: '#10b981' }
                }
            ]
        };

        Plotly.react(container, traces, layout, { displayModeBar: false, responsive: true });
    }
};

// Alte runAttention-Funktion ersetzen
function runAttention() {
    AttentionDemo.render();
}

// ============================================================
// LAZY LOADING VIA INTERSECTION OBSERVER
// ============================================================

const _lazyInitRegistry = [];
let _lazyObserver = null;

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
}

// ============================================================
// LOSS LANDSCAPE VISUALIZATION – v5
// Eigenes Click-to-Start (kein plotly_click!), turntable rotation,
// ZERO Plotly-Hover, freies Drehen/Zoomen während Animation
// ============================================================

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
        const tokInput = document.getElementById('tokenizer-input');
        if (tokInput) {
		let _tokenDebounce = null;
		tokInput.addEventListener('input', () => {
			clearTimeout(_tokenDebounce);
			_tokenDebounce = setTimeout(() => TokenizerViz.render(), 150);
		});
        }
        TokenizerViz.render();

    // Step 3: Positional Encoding
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

    // Step 4a: Attention (bank/river/money plot)
        runAttention();

    // Step 4c: Residual Stream
        ResidualStreamViz.init();
        ResidualStreamViz.render();
        const layerSlider = document.getElementById('residual-stream-layer');
        if (layerSlider) {
            layerSlider.addEventListener('input', function () {
                ResidualStreamViz.setLayer(parseInt(this.value));
            });
        }

    // Step 5: Prediction — beide Slider + smooth
    const tempSlider = document.getElementById('prediction-temperature');
    const topKSlider = document.getElementById('prediction-topk');
    if (tempSlider) {
        tempSlider.addEventListener('input', () => {
            PredictionViz.currentTemp = parseFloat(tempSlider.value);
            PredictionViz.render();
        });
    }
    if (topKSlider) {
        topKSlider.addEventListener('input', () => {
            PredictionViz.currentTopK = parseInt(topKSlider.value);
            PredictionViz.render();
        });
    }
    PredictionViz.render();

    // NN Approximation Demo
        const nnTargetFn = document.getElementById('nn-target-fn');
        const nnNeuronSlider = document.getElementById('nn-num-neurons');
        if (nnTargetFn) nnTargetFn.addEventListener('change', () => NNApproxViz.render());
        if (nnNeuronSlider) nnNeuronSlider.addEventListener('input', () => NNApproxViz.render());
        NNApproxViz.render();

	    //TrainingViz.render();

    // Start observing everything
    _lazyCreateObserver();


	renderSpace('2d');

	initEmbeddingEditor();
}

// ============================================================
// NN STEP DEMO – Pfeiltasten-gesteuertes Durchlaufen der Stückelungs-Folie
// ============================================================

// ============================================================
// NN STEP DEMO – Pfeiltasten-gesteuertes Durchlaufen der Stückelungs-Folie
// ============================================================

const NNStepDemo = (() => {
    // Schritte für Sinus: 1,2,4,6,8,10,20 Neuronen
    const sinSteps = [1, 2, 4, 6, 8, 10, 20];
    // Schritte für Wellenform: auch 1,2,4,6,8,10,20 Neuronen
    const customSteps = [1, 2, 4, 6, 8, 10, 20];
    // step 0..6 = sinus mit sinSteps[step] Neuronen
    // step 7..13 = wellenform mit customSteps[step-7] Neuronen
    // step 14 = Bilder einblenden
    const totalSteps = sinSteps.length + customSteps.length + 1; // 15
    let currentStep = 0;

    function isOnStückelungSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Stückelung';
    }

    function canGoNext() {
        if (!isOnStückelungSlide()) return false;
        return currentStep < totalSteps - 1;
    }

    function canGoPrev() {
        if (!isOnStückelungSlide()) return false;
        return currentStep > 0;
    }

    function applyStep() {
        const slider = document.getElementById('nn-num-neurons');
        const fnSelect = document.getElementById('nn-target-fn');
        const countLabel = document.getElementById('nn-neuron-count');
        const imagesDiv = document.getElementById('nn-bottom-images');

        if (!slider || !fnSelect) return;

        const sinEnd = sinSteps.length - 1;          // 6
        const customStart = sinSteps.length;          // 7
        const customEnd = sinSteps.length + customSteps.length - 1; // 13
        const imagesStep = sinSteps.length + customSteps.length;    // 14

        if (currentStep <= sinEnd) {
            // Sinus-Schritte
            fnSelect.value = 'sin';
            const neurons = sinSteps[currentStep];
            slider.value = neurons;
            if (countLabel) countLabel.textContent = neurons;
            if (imagesDiv) imagesDiv.style.opacity = '0';
            NNApproxViz.render();
        } else if (currentStep >= customStart && currentStep <= customEnd) {
            // Wellenform-Schritte
            fnSelect.value = 'custom';
            const neurons = customSteps[currentStep - customStart];
            slider.value = neurons;
            if (countLabel) countLabel.textContent = neurons;
            if (imagesDiv) imagesDiv.style.opacity = '0';
            NNApproxViz.render();
        } else if (currentStep === imagesStep) {
            // Bilder einblenden
            if (imagesDiv) imagesDiv.style.opacity = '1';
        }
    }

    function next() {
        if (!canGoNext()) return;
        currentStep++;
        applyStep();
    }

    function prev() {
        if (!canGoPrev()) return;
        currentStep--;
        applyStep();
    }

    function reset() {
        currentStep = 0;
        applyStep();
    }

    return {
        isOnStückelungSlide,
        canGoNext,
        canGoPrev,
        next,
        prev,
        reset
    };
})();

function reset_nn_num_neurons () {
	$("#nn-num-neurons").val(1).trigger("change");
}
