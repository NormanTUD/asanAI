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
                        <span style="font-size:0.6em; color:#94a3b8;">ws</span>
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
// STEP 5: FINAL PREDICTION VISUALIZER
// ============================================================

const PredictionViz = {
    // Mock vocabulary with probabilities at different temperatures
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
            if (temperature < 0.3) desc = ' (wenig kreativ)';
            else if (temperature < 0.7) desc = ' (sehr fokussiert)';
            else if (temperature < 1.3) desc = ' (balanciert)';
            else if (temperature < 2.0) desc = ' (kreativ)';
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
			text: 'Kontextualisiertes Embedding für "Bank"',
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

const LossLandscapeViz = {
    posX: null,
    posY: null,
    path: [],
    stepCount: 0,
    animating: false,
    animInterval: null,
    surfaceRendered: false,
    plotDiv: null,
    _surfaceX: null,
    _surfaceY: null,
    _surfaceZ: null,
    _mouseDownX: 0,
    _mouseDownY: 0,
    _mouseDownTime: 0,
    _clickListenerAttached: false,

    lossFunction: function(x, y) {
        const globalMin = -2.5 * Math.exp(-(Math.pow(x + 0.3, 2) + Math.pow(y - 0.2, 2)) * 2.2);
        const bowl = 0.15 * (x * x + y * y);
        const ridge = 2.2 * Math.exp(-Math.pow(y - 0.5 * x + 0.3, 2) * 2.0) * Math.exp(-(x * x + y * y) * 0.03);
        const localMin = -1.5 * Math.exp(-(Math.pow(x - 2.2, 2) + Math.pow(y + 1.8, 2)) * 0.8);
        const localMin2 = -1.0 * Math.exp(-(Math.pow(x + 2.5, 2) + Math.pow(y + 2.2, 2)) * 1.0);
        const peak1 = 2.0 * Math.exp(-(Math.pow(x - 1.5, 2) + Math.pow(y + 0.5, 2)) * 1.2);
        const peak2 = 1.6 * Math.exp(-(Math.pow(x + 1.8, 2) + Math.pow(y - 2.0, 2)) * 0.8);
        const bumps = 0.18 * Math.sin(x * 2.8) * Math.cos(y * 2.3);
        const bumps2 = 0.1 * Math.cos(x * 4.0 + y * 1.2) * Math.sin(y * 3.5 - x * 0.6);
        const saddle = 0.25 * (x * x - y * y) * Math.exp(-(x * x + y * y) * 0.1);
        return bowl + ridge + globalMin + localMin + localMin2 + peak1 + peak2 + bumps + bumps2 + saddle + 3.5;
    },

    gradient: function(x, y) {
        const eps = 0.005;
        const dfdx = (this.lossFunction(x + eps, y) - this.lossFunction(x - eps, y)) / (2 * eps);
        const dfdy = (this.lossFunction(x, y + eps) - this.lossFunction(x, y - eps)) / (2 * eps);
        return { dx: dfdx, dy: dfdy };
    },

    getLR: function() {
        const slider = document.getElementById('loss-lr-slider');
        return slider ? parseFloat(slider.value) : 0.18;
    },

    _computeSurface: function() {
        if (this._surfaceX) return;
        const n = 50;
        const xRange = [], yRange = [];
        for (let i = 0; i < n; i++) {
            xRange.push(-3.5 + 7 * i / (n - 1));
            yRange.push(-3.5 + 7 * i / (n - 1));
        }
        const zData = [];
        for (let j = 0; j < n; j++) {
            const row = [];
            for (let i = 0; i < n; i++) {
                row.push(this.lossFunction(xRange[i], yRange[j]));
            }
            zData.push(row);
        }
        this._surfaceX = xRange;
        this._surfaceY = yRange;
        this._surfaceZ = zData;
    },

    // ===== EIGENES CLICK-TO-START =====
    // Unterscheidet Click (< 5px Bewegung, < 250ms) von Drag (= Rotation)
    // Projiziert 2D-Mausposition auf die XY-Ebene der 3D-Scene
    _setupClickToStart: function() {
        if (this._clickListenerAttached) return;
        const plotDiv = this.plotDiv;
        if (!plotDiv) return;

        const self = this;

        plotDiv.addEventListener('pointerdown', function(e) {
            self._mouseDownX = e.clientX;
            self._mouseDownY = e.clientY;
            self._mouseDownTime = Date.now();
        }, { passive: true });

        plotDiv.addEventListener('pointerup', function(e) {
            const dx = Math.abs(e.clientX - self._mouseDownX);
            const dy = Math.abs(e.clientY - self._mouseDownY);
            const dt = Date.now() - self._mouseDownTime;

            // Nur Click, kein Drag
            if (dx > 4 || dy > 4 || dt > 250) return;

            const coords = self._pixelToWorld(e.clientX, e.clientY);
            if (!coords) return;

            self._setStartPoint(coords.x, coords.y);
        }, { passive: true });

        this._clickListenerAttached = true;
    },

    // Projiziert Pixel-Koordinaten auf die XY-Ebene der 3D-Scene
    // Nutzt Plotly's interne Scene-Informationen (Camera + Viewport)
    // ===== FIX 2: Korrekte Pixel→Welt Projektion =====
    // Liest Plotly's TATSÄCHLICHE Projektionsmatrix aus dem GL-Context
    _pixelToWorld: function(clientX, clientY) {
        const plotDiv = this.plotDiv;
        if (!plotDiv || !plotDiv._fullLayout) return null;

        const sceneLayout = plotDiv._fullLayout.scene;
        if (!sceneLayout || !sceneLayout._scene) return null;

        const scene = sceneLayout._scene;
        if (!scene.glplot) return null;

        const glplot = scene.glplot;

        // Canvas für Koordinaten
        const canvas = plotDiv.querySelector('canvas');
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();

        // NDC (-1 bis +1)
        const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

        // ===== METHODE: Plotly's gl-plot3d hat eine .camera mit .matrix =====
        // Das ist die kombinierte Model-View-Projection Matrix (4x4, column-major)
        const camera = glplot.camera;
        if (!camera) return null;

        // Versuche die Projektionsmatrix direkt zu bekommen
        let mvp = null;

        // gl-plot3d speichert camera.matrix als Float32Array(16)
        if (camera.matrix && camera.matrix.length === 16) {
            mvp = Array.from(camera.matrix);
        } else if (camera._view && camera._view.matrix) {
            mvp = Array.from(camera._view.matrix);
        }

        if (mvp) {
            // Invertiere die MVP-Matrix
            const inv = this._invertMatrix4(mvp);
            if (!inv) return null;

            // Unproject: NDC → Welt
            // Zwei Punkte auf dem Ray: near (z=-1) und far (z=1)
            const nearWorld = this._mulMatVec4(inv, [ndcX, ndcY, -1, 1]);
            const farWorld = this._mulMatVec4(inv, [ndcX, ndcY, 1, 1]);

            if (Math.abs(nearWorld[3]) < 1e-10 || Math.abs(farWorld[3]) < 1e-10) return null;

            // Perspective divide
            const near = [nearWorld[0]/nearWorld[3], nearWorld[1]/nearWorld[3], nearWorld[2]/nearWorld[3]];
            const far = [farWorld[0]/farWorld[3], farWorld[1]/farWorld[3], farWorld[2]/farWorld[3]];

            // Ray direction
            const rayDir = [far[0]-near[0], far[1]-near[1], far[2]-near[2]];

            // Intersect mit z = 0.5 (Plotly normalisiert z in [0,1] für den Bereich)
            // Eigentlich wollen wir die Ebene auf halber Höhe der Loss-Surface treffen
            // Plotly's interner Raum: x,y,z jeweils in [-0.5, 0.5] * aspectratio
            // Wir intersecten mit z = 0 (Mitte des z-Bereichs)
            if (Math.abs(rayDir[2]) < 1e-6) return null;

            const t = (0 - near[2]) / rayDir[2];
            const hitX = near[0] + t * rayDir[0];
            const hitY = near[1] + t * rayDir[1];

            // Plotly's interner Raum → Daten-Raum
            // aspectratio ist {x:1, y:1, z:0.5}
            // Interner Raum geht von -0.5 bis 0.5 pro Achse (mal aspectratio)
            // Daten-Raum: x [-3.5, 3.5], y [-3.5, 3.5]
            const xRange = sceneLayout.xaxis.range || [-3.5, 3.5];
            const yRange = sceneLayout.yaxis.range || [-3.5, 3.5];

            // Mapping: interner Raum [-0.5, 0.5] → Daten-Raum
            const worldX = (hitX + 0.5) * (xRange[1] - xRange[0]) + xRange[0];
            const worldY = (hitY + 0.5) * (yRange[1] - yRange[0]) + yRange[0];

            const clampedX = Math.max(-3.4, Math.min(3.4, worldX));
            const clampedY = Math.max(-3.4, Math.min(3.4, worldY));

            if (isNaN(clampedX) || isNaN(clampedY)) return null;
            return { x: clampedX, y: clampedY };
        }

        // ===== FALLBACK: Einfache Projektion basierend auf Camera-Eye =====
        // (weniger genau, aber besser als nichts)
        let eye;
        if (camera.eye) {
            eye = [camera.eye.x || camera.eye[0] || 1.8, camera.eye.y || camera.eye[1] || 1.8, camera.eye.z || camera.eye[2] || 1.0];
        } else {
            eye = [1.8, 1.8, 1.0];
        }

        // Kamera-Azimuth und Elevation
        const dist = Math.sqrt(eye[0]*eye[0] + eye[1]*eye[1] + eye[2]*eye[2]);
        const azimuth = Math.atan2(eye[1], eye[0]);
        const elevation = Math.asin(Math.min(1, Math.max(-1, eye[2] / dist)));

        // Sichtfeld-Skalierung
        const fov = 0.45;
        const aspect = rect.width / rect.height;

        // Kamera-Koordinatensystem
        const cosA = Math.cos(azimuth), sinA = Math.sin(azimuth);
        const cosE = Math.cos(elevation), sinE = Math.sin(elevation);

        // Right-Vektor (horizontal im Bild)
        const rightX = -sinA;
        const rightY = cosA;

        // Up-Vektor projiziert auf XY-Ebene
        const upX = -cosA * sinE;
        const upY = -sinA * sinE;

        // Skalierung basierend auf Distanz und FOV
        const scale = dist * fov * 3.5; // 3.5 = halbe Range

        const worldX = -(ndcX * rightX * aspect + ndcY * upX) * scale;
        const worldY = -(ndcX * rightY * aspect + ndcY * upY) * scale;

        const clampedX = Math.max(-3.4, Math.min(3.4, worldX));
        const clampedY = Math.max(-3.4, Math.min(3.4, worldY));

        if (isNaN(clampedX) || isNaN(clampedY)) return null;
        return { x: clampedX, y: clampedY };
    },

    // 4x4 Matrix invertieren (column-major wie WebGL)
    _invertMatrix4: function(m) {
        const inv = new Array(16);
        inv[0] = m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
        inv[4] = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
        inv[8] = m[4]*m[9]*m[15] - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
        inv[12] = -m[4]*m[9]*m[14] + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
        inv[1] = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
        inv[5] = m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
        inv[9] = -m[0]*m[9]*m[15] + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
        inv[13] = m[0]*m[9]*m[14] - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
        inv[2] = m[1]*m[6]*m[15] - m[1]*m[7]*m[14] - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7] - m[13]*m[3]*m[6];
        inv[6] = -m[0]*m[6]*m[15] + m[0]*m[7]*m[14] + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7] + m[12]*m[3]*m[6];
        inv[10] = m[0]*m[5]*m[15] - m[0]*m[7]*m[13] - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7] - m[12]*m[3]*m[5];
        inv[14] = -m[0]*m[5]*m[14] + m[0]*m[6]*m[13] + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6] + m[12]*m[2]*m[5];
        inv[3] = -m[1]*m[6]*m[11] + m[1]*m[7]*m[10] + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7] + m[9]*m[3]*m[6];
        inv[7] = m[0]*m[6]*m[11] - m[0]*m[7]*m[10] - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7] - m[8]*m[3]*m[6];
        inv[11] = -m[0]*m[5]*m[11] + m[0]*m[7]*m[9] + m[4]*m[1]*m[11] - m[4]*m[3]*m[9] - m[8]*m[1]*m[7] + m[8]*m[3]*m[5];
        inv[15] = m[0]*m[5]*m[10] - m[0]*m[6]*m[9] - m[4]*m[1]*m[10] + m[4]*m[2]*m[9] + m[8]*m[1]*m[6] - m[8]*m[2]*m[5];

        let det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
        if (Math.abs(det) < 1e-10) return null;

        det = 1.0 / det;
        for (let i = 0; i < 16; i++) inv[i] *= det;
        return inv;
    },

    // Matrix4 × Vec4 (column-major)
    _mulMatVec4: function(m, v) {
        return [
            m[0]*v[0] + m[4]*v[1] + m[8]*v[2] + m[12]*v[3],
            m[1]*v[0] + m[5]*v[1] + m[9]*v[2] + m[13]*v[3],
            m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]*v[3],
            m[3]*v[0] + m[7]*v[1] + m[11]*v[2] + m[15]*v[3]
        ];
    },

    _setStartPoint: function(x, y) {
        if (this.animInterval) {
            clearInterval(this.animInterval);
            this.animInterval = null;
            this.animating = false;
            const btn = document.getElementById('loss-animate-btn');
            if (btn) { btn.textContent = '⏩ Animieren'; btn.style.background = '#10b981'; }
        }
        this.posX = x;
        this.posY = y;
        this.path = [{ x: x, y: y, loss: this.lossFunction(x, y) }];
        this.stepCount = 0;
        if (this.surfaceRendered) {
            this._updatePathTrace();
        }
        this.updateUI();
    },

    setStartPoint: function(x, y) {
        this._setStartPoint(x, y);
    },

    reset: function() {
        if (this.animInterval) {
            clearInterval(this.animInterval);
            this.animInterval = null;
            this.animating = false;
        }
        const btn = document.getElementById('loss-animate-btn');
        if (btn) { btn.textContent = '⏩ Animieren'; btn.style.background = '#10b981'; }
        this.posX = 3.0;
        this.posY = -2.8;
        this.path = [{ x: this.posX, y: this.posY, loss: this.lossFunction(this.posX, this.posY) }];
        this.stepCount = 0;
        this.surfaceRendered = false;
        this._surfaceX = null;
        this._surfaceY = null;
        this._surfaceZ = null;
        this._clickListenerAttached = false;
        this.renderFull();
    },

    step: function() {
        if (this.posX == null) {
            this.posX = 3.0;
            this.posY = -2.8;
            this.path = [{ x: this.posX, y: this.posY, loss: this.lossFunction(this.posX, this.posY) }];
        }
        const lr = this.getLR();
        const grad = this.gradient(this.posX, this.posY);
        const noise = 0.012;
        const rawX = this.posX - lr * grad.dx + (Math.random() - 0.5) * noise;
        const rawY = this.posY - lr * grad.dy + (Math.random() - 0.5) * noise;
        this.posX = 0.88 * rawX + 0.12 * this.posX;
        this.posY = 0.88 * rawY + 0.12 * this.posY;
        this.posX = Math.max(-3.4, Math.min(3.4, this.posX));
        this.posY = Math.max(-3.4, Math.min(3.4, this.posY));
        this.stepCount++;
        this.path.push({ x: this.posX, y: this.posY, loss: this.lossFunction(this.posX, this.posY) });
        this._updatePathTrace();
        this.updateUI();
    },

    animate: function() {
        if (this.animating) {
            this.animating = false;
            const btn = document.getElementById('loss-animate-btn');
            if (btn) { btn.textContent = '⏩ Animieren'; btn.style.background = '#10b981'; }
            return;
        }
        if (this.posX == null) {
            this.posX = 3.0;
            this.posY = -2.8;
            this.path = [{ x: this.posX, y: this.posY, loss: this.lossFunction(this.posX, this.posY) }];
        }
        this.animating = true;
        const btn = document.getElementById('loss-animate-btn');
        if (btn) { btn.textContent = '⏸ Stopp'; btn.style.background = '#ef4444'; }

        const self = this;
        let lastTime = 0;
        const stepInterval = 120; // ms zwischen Steps

        function animLoop(timestamp) {
            if (!self.animating) return;
            if (timestamp - lastTime >= stepInterval) {
                lastTime = timestamp;
                self.step();
                if (self.stepCount >= 200) {
                    self.animating = false;
                    if (btn) { btn.textContent = '⏩ Animieren'; btn.style.background = '#10b981'; }
                    return;
                }
            }
            requestAnimationFrame(animLoop);
        }
        requestAnimationFrame(animLoop);
    },

    _renderStartPointSelector: function() {
        const container = document.getElementById('loss-startpoint-selector');
        if (!container) return;
        const presets = [
            { label: '🏔️ Gipfel', x: 1.5, y: -0.5 },
            { label: '🏔️ Berg 2', x: -1.8, y: 2.0 },
            { label: '📐 Sattel', x: 0.0, y: 0.0 },
            { label: '↗️ Fern', x: 3.0, y: -2.8 },
            { label: '↙️ Ecke', x: -3.0, y: 3.0 },
            { label: '⬇️ Nah', x: -0.5, y: 0.3 },
            { label: '🌊 Lok.1', x: 2.2, y: -1.8 },
            { label: '🌊 Lok.2', x: -2.5, y: -2.2 },
        ];
        let html = `<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
            <span style="font-size:11px;font-weight:600;color:#475569;">Start:</span>`;
        presets.forEach(p => {
            html += `<button onclick="LossLandscapeViz.setStartPoint(${p.x},${p.y})"
                style="padding:3px 7px;font-size:11px;border:1px solid #cbd5e1;border-radius:5px;
                background:#f8fafc;cursor:pointer;white-space:nowrap;"
                onmouseover="this.style.background='#dbeafe'"
                onmouseout="this.style.background='#f8fafc'">${p.label}</button>`;
        });
        html += `<span style="color:#cbd5e1;margin:0 4px;">|</span>
            <input id="loss-custom-x" type="number" step="0.5" min="-3.5" max="3.5" value="0"
                style="width:44px;padding:2px 4px;font-size:11px;border:1px solid #cbd5e1;border-radius:4px;">
            <input id="loss-custom-y" type="number" step="0.5" min="-3.5" max="3.5" value="0"
                style="width:44px;padding:2px 4px;font-size:11px;border:1px solid #cbd5e1;border-radius:4px;">
            <button onclick="LossLandscapeViz.setStartPoint(
                parseFloat(document.getElementById('loss-custom-x').value)||0,
                parseFloat(document.getElementById('loss-custom-y').value)||0
            )" style="padding:3px 7px;font-size:11px;border:1px solid #10b981;border-radius:5px;
                background:#ecfdf5;cursor:pointer;color:#065f46;font-weight:600;">✓</button>
            <span style="color:#94a3b8;font-size:10px;margin-left:6px;">oder klicke in den Plot!</span>
        </div>`;
        container.innerHTML = html;
    },

    renderFull: function() {
        const plotDiv = document.getElementById('loss-landscape-plot');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;

        Plotly.purge(plotDiv);
        this._computeSurface();
        this._renderStartPointSelector();

        const traces = [
            {
                x: this._surfaceX,
                y: this._surfaceY,
                z: this._surfaceZ,
                type: 'surface',
                colorscale: [
                    [0, '#022c22'], [0.06, '#065f46'], [0.15, '#10b981'],
                    [0.3, '#84cc16'], [0.45, '#fbbf24'],
                    [0.6, '#f97316'], [0.78, '#dc2626'], [1, '#450a0a']
                ],
                opacity: 0.92,
                showscale: true,
                colorbar: { title: 'Loss', titleside: 'right', len: 0.5, thickness: 15 },
                contours: { z: { show: true, usecolormap: true, highlightcolor: '#fff', project: { z: false } } },
                hoverinfo: 'none',
                lighting: { roughness: 0.4, diffuse: 0.9, specular: 0.3, fresnel: 0.1 },
                name: 'surface'
            },
            {
                x: this.path.map(p => p.x),
                y: this.path.map(p => p.y),
                z: this.path.map(p => p.loss + 0.15),
                type: 'scatter3d',
                mode: 'lines+markers',
                line: { color: '#1e40af', width: 7 },
                marker: { size: [12], color: ['#fbbf24'], symbol: ['diamond'], line: { width: 1, color: '#fff' } },
                hoverinfo: 'none',
                name: 'path'
            }
        ];

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'W₁', range: [-3.5, 3.5], gridcolor: '#e2e8f0', backgroundcolor: '#fafafa' },
                yaxis: { title: 'W₂', range: [-3.5, 3.5], gridcolor: '#e2e8f0', backgroundcolor: '#fafafa' },
                zaxis: { title: 'Loss', range: [0, 7], gridcolor: '#e2e8f0', backgroundcolor: '#fafafa' },
                camera: { eye: { x: 1.8, y: 1.8, z: 1.0 } },
                aspectratio: { x: 1, y: 1, z: 0.5 },
                // TURNTABLE statt ORBIT → natürlicheres Drehen
                dragmode: 'turntable'
            },
            showlegend: false,
            hovermode: false
        };

        const config = {
            displayModeBar: false, // Cleaner Look
            responsive: true,
            scrollZoom: true,
            editable: false
        };

        Plotly.newPlot(plotDiv, traces, layout, config).then(() => {
            this.surfaceRendered = true;
            this._setupClickToStart();
            this.updateUI();
        });
    },

    _updatePathTrace: function() {
        const plotDiv = this.plotDiv;
        if (!plotDiv || !this.surfaceRendered) { this.renderFull(); return; }

        const pathX = this.path.map(p => p.x);
        const pathY = this.path.map(p => p.y);
        const pathZ = this.path.map(p => p.loss + 0.15);
        const sizes = this.path.map((_, i) => i === this.path.length - 1 ? 12 : i === 0 ? 7 : 3);
        const colors = this.path.map((_, i) => {
            if (i === this.path.length - 1) return '#ef4444';
            if (i === 0) return '#fbbf24';
            return i / this.path.length < 0.5 ? '#3b82f6' : '#10b981';
        });
        const symbols = this.path.map((_, i) => (i === 0 || i === this.path.length - 1) ? 'diamond' : 'circle');

        try {
            Plotly.restyle(plotDiv, {
                x: [pathX], y: [pathY], z: [pathZ],
                'marker.size': [sizes], 'marker.color': [colors], 'marker.symbol': [symbols]
            }, [1]);
        } catch (e) { /* silent */ }
    },

    updateUI: function() {
        const counter = document.getElementById('loss-step-counter');
        if (counter) {
            const currentLoss = this.path.length > 0 ? this.path[this.path.length - 1].loss : 0;
            counter.innerHTML = `Schritt: <b>${this.stepCount}</b> | Loss: <b style="color:${this.stepCount > 0 ? '#10b981' : '#64748b'};">${currentLoss.toFixed(3)}</b>`;
        }
        const infoDiv = document.getElementById('loss-landscape-info');
        if (infoDiv) {
            if (this.stepCount === 0) {
                infoDiv.innerHTML = `👆 Wähle einen <b>Startpunkt</b> (Buttons oben oder klicke in den Plot), dann <b>"Ein Schritt"</b> oder <b>"Animieren"</b>. Drehen: Klicken+Ziehen. Zoom: Scrollrad.`;
                infoDiv.style.cssText = 'padding:8px 12px;border-radius:8px;font-size:13px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;';
            } else {
                const startLoss = this.path[0].loss;
                const currentLoss = this.path[this.path.length - 1].loss;
                const pct = startLoss > 0 ? ((1 - currentLoss / startLoss) * 100).toFixed(1) : '0';
                if (currentLoss < 1.5 || this.stepCount >= 150) {
                    infoDiv.innerHTML = `🏆 <b>Konvergiert!</b> ${startLoss.toFixed(2)} → ${currentLoss.toFixed(3)} (${pct}% besser)`;
                    infoDiv.style.cssText = 'padding:8px 12px;border-radius:8px;font-size:13px;background:#dcfce7;border:1px solid #34d399;color:#166534;';
                } else {
                    infoDiv.innerHTML = `📉 Schritt ${this.stepCount} | Loss: ${currentLoss.toFixed(3)} | ${pct}% besser | LR: ${this.getLR()}`;
                    infoDiv.style.cssText = 'padding:8px 12px;border-radius:8px;font-size:13px;background:#f0fdf4;border:1px solid #86efac;color:#166534;';
                }
            }
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

    // Step 5: Prediction
        const tempSlider = document.getElementById('prediction-temperature');
        if (tempSlider) {
            tempSlider.addEventListener('input', () => PredictionViz.render());
        }
        PredictionViz.render();


    // NN Approximation Demo
        const nnTargetFn = document.getElementById('nn-target-fn');
        const nnNeuronSlider = document.getElementById('nn-num-neurons');
        if (nnTargetFn) nnTargetFn.addEventListener('change', () => NNApproxViz.render());
        if (nnNeuronSlider) nnNeuronSlider.addEventListener('input', () => NNApproxViz.render());
        NNApproxViz.render();

	    //TrainingViz.render();

	    LossLandscapeViz.reset();

    // Start observing everything
    _lazyCreateObserver();


	renderSpace('2d');

	initEmbeddingEditor();
}

function reset_nn_num_neurons () {
	$("#nn-num-neurons").val(1).trigger("change");
}
