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
// STEP 2: EMBEDDING VISUALIZER (lndw style — Power / Gender)
// ============================================================

const EmbeddingViz = (() => {
    // Two semantic axes that an LLM might plausibly discover.
    // (X) Power   (Y) Gender
    // Positions chosen so directions encode meaning:
    //   Man → Woman  (gender)   and   Man → Prince → King  (power)
    // are the SAME vector applied at different points.
    const space = {
        vocab: {
            'Man':       [ 5, -10],
            'Woman':     [ 5,  10],
            'Male':      [ 0, -20],
            'Female':    [ 0,  20],
            'Prince':    [15, -10],
            'Princess':  [15,  10],
            'King':      [25, -10],
            'Queen':     [25,  10],
            'Power':     [10,   0]
        },
        axes:  { x: 'Power', y: 'Gender' },
        rangeX: [-5, 40],
        rangeY: [-30, 30]
    };

    let result = null;        // { pos, nearest, steps }

    // Theme helpers (resolved each render so they react to dark-mode toggles)
    const theme = () => {
        const dark = isDarkMode();
        return {
            dark,
            grid:     themeColor('#e2e8f0'),
            axis:     themeColor('#475569'),
            axisTitle:dark ? '#cbd5e1' : '#334155',
            bg:       themeColor('#fff'),
            textMuted:themeColor('#94a3b8'),
            labelIdle:'#94a3b8'
        };
    };

    // Tokenize "King - Man + Woman", "Woman + 2*Power" etc.
    function tokenize(expr) {
        return expr.match(/[a-zA-ZäöüÄÖÜß]+|\d+|[+\-*/()]/g) || [];
    }

    function calc(parts) {
        // parts = array of (word|k|num) with optional preceding sign
        // We use a tiny recursive-descent so "Woman + 2*Power" and "(Man+Woman)/2" work.
        let i = 0;
        function parseFactor() {
            const t = parts[i++];
            if (t === '(') {
                const v = parseExpr();
                if (parts[i] === ')') i++;
                return v;
            }
            if (/^\d+$/.test(t)) return { kind: 'num', n: parseInt(t, 10), sign: 1 };
            const lc = t.toLowerCase();
            const norm = Object.keys(space.vocab).find(w => w.toLowerCase() === lc);
            if (norm) return { kind: 'vec', w: norm, sign: 1 };
            return { kind: 'num', n: 0, sign: 1 };
        }
        function parseTerm(sign) {
            let left = parseFactor();
            left.sign *= sign;
            while (i < parts.length && (parts[i] === '*' || parts[i] === '/')) {
                const op = parts[i++];
                const right = parseFactor();
                right.sign = 1;
                if (op === '*') {
                    if (left.kind === 'num' && right.kind === 'num') { left.n *= right.n; }
                    else if (left.kind === 'vec' && right.kind === 'num') { left = { kind: 'vec', w: left.w, scale: right.n, sign: left.sign }; }
                    else if (left.kind === 'num' && right.kind === 'vec') { left = { kind: 'vec', w: right.w, scale: left.n, sign: 1 }; }
                    else if (left.kind === 'vec' && right.kind === 'vec') {
                        // dot product — uncommon, return scalar
                        const a = space.vocab[left.w], b = space.vocab[right.w];
                        left = { kind: 'num', n: a[0]*b[0] + a[1]*b[1], sign: left.sign };
                    }
                } else {
                    if (right.kind === 'num' && right.n !== 0) {
                        if (left.kind === 'num') left.n /= right.n;
                        else left = { kind: 'vec', w: left.w, scale: 1/right.n, sign: left.sign };
                    }
                }
            }
            return left;
        }
        function parseExpr() {
            let sign = 1;
            if (parts[i] === '+') { i++; sign = 1; }
            else if (parts[i] === '-') { i++; sign = -1; }
            let left = parseTerm(sign);
            while (i < parts.length && (parts[i] === '+' || parts[i] === '-')) {
                const op = parts[i++];
                const right = parseTerm(op === '-' ? -1 : 1);
                // combine
                if (left.kind === 'num' && right.kind === 'num') {
                    left.n += right.n * right.sign;
                } else if (left.kind === 'vec' && right.kind === 'vec') {
                    const lScale = left.scale || 1;
                    const rScale = right.scale || 1;
                    left = {
                        kind: 'vec',
                        w: '__sum__',
                        components: [
                            space.vocab[left.w][0] * lScale * left.sign + space.vocab[right.w][0] * rScale * right.sign,
                            space.vocab[left.w][1] * lScale * left.sign + space.vocab[right.w][1] * rScale * right.sign
                        ]
                    };
                } else if (left.kind === 'vec' && right.kind === 'num') {
                    const lScale = left.scale || 1;
                    left = {
                        kind: 'vec',
                        w: '__sum__',
                        components: [
                            space.vocab[left.w][0] * lScale * left.sign + right.n * right.sign,
                            space.vocab[left.w][1] * lScale * left.sign
                        ]
                    };
                } else if (left.kind === 'num' && right.kind === 'vec') {
                    const rScale = right.scale || 1;
                    left = {
                        kind: 'vec',
                        w: '__sum__',
                        components: [
                            left.n * left.sign + space.vocab[right.w][0] * rScale * right.sign,
                            space.vocab[right.w][1] * rScale * right.sign
                        ]
                    };
                }
            }
            return left;
        }
        return parseExpr();
    }

    function evaluate(expr) {
        const parts = tokenize(expr);
        if (!parts.length) return null;
        try {
            const r = calc(parts);
            if (!r) return null;
            if (r.kind === 'num') return { kind: 'num', n: r.n * r.sign };
            if (r.kind === 'vec') {
                if (r.w === '__sum__') return { kind: 'vec', pos: r.components };
                const v = space.vocab[r.w];
                const s = (r.scale || 1) * r.sign;
                return { kind: 'vec', pos: [v[0] * s, v[1] * s] };
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    function nearest(pos) {
        let best = null, bd = Infinity;
        Object.entries(space.vocab).forEach(([w, v]) => {
            const d = Math.hypot(pos[0] - v[0], pos[1] - v[1]);
            if (d < bd) { bd = d; best = w; }
        });
        return { word: best, dist: bd };
    }

    // ── Drawing modes ──

    function renderNormal(highlightWords) {
        const t = theme();
        const traces = [];
        const annotations = [];

        // Background vocabulary (greyed out but visible)
        const bg = Object.keys(space.vocab).filter(w => w !== 'Power' && !highlightWords.includes(w));
        traces.push({
            x: bg.map(w => space.vocab[w][0]),
            y: bg.map(w => space.vocab[w][1]),
            text: bg,
            mode: 'markers+text',
            textposition: 'top center',
            textfont: { size: 11, color: t.textMuted, family: 'system-ui, sans-serif' },
            marker: { size: 7, color: t.labelIdle, opacity: 0.4 },
            showlegend: false,
            hovertemplate: '<b>%{text}</b><br>(%{x:.1f}, %{y:.1f})<extra></extra>'
        });

        // Highlighted words
        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        highlightWords.forEach((w, i) => {
            if (!(w in space.vocab)) return;
            const pos = space.vocab[w];
            const c = palette[i % palette.length];
            traces.push({
                x: [pos[0]], y: [pos[1]],
                text: [w],
                mode: 'markers+text',
                textposition: 'top center',
                textfont: { size: 14, color: c, family: 'system-ui, sans-serif' },
                marker: { size: 14, color: c, line: { width: 2, color: t.bg } },
                showlegend: false,
                hovertemplate: `<b>${w}</b><br>(${pos[0]}, ${pos[1]})<extra></extra>`
            });
        });

        // Vector-arithmetic steps + result diamond
        if (result && result.steps) {
            result.steps.forEach(step => {
                annotations.push({
                    ax: step.from[0], ay: step.from[1], axref: 'x', ayref: 'y',
                    x: step.to[0], y: step.to[1], xref: 'x', yref: 'y',
                    showarrow: true, arrowhead: 3, arrowsize: 1.4, arrowwidth: 2.5,
                    arrowcolor: '#3b82f6'
                });
                annotations.push({
                    x: (step.from[0] + step.to[0]) / 2,
                    y: (step.from[1] + step.to[1]) / 2 + 1.4,
                    xref: 'x', yref: 'y',
                    text: `<b>${step.label}</b>`,
                    showarrow: false,
                    font: { size: 11, color: '#3b82f6', family: 'system-ui, sans-serif' },
                    bgcolor: t.dark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.92)',
                    borderpad: 3
                });
            });
        }

        if (result && result.pos) {
            traces.push({
                x: [result.pos[0]], y: [result.pos[1]],
                text: ['≈ ' + result.nearest],
                mode: 'markers+text',
                textposition: 'bottom center',
                textfont: { size: 13, color: '#ef4444', family: 'system-ui, sans-serif' },
                marker: { size: 16, color: '#ef4444', symbol: 'diamond', line: { width: 2, color: t.bg } },
                showlegend: false,
                hovertemplate: `<b>≈ ${result.nearest}</b><br>(${result.pos[0].toFixed(1)}, ${result.pos[1].toFixed(1)})<extra></extra>`
            });
        }

        Plotly.react('embedding-viz-plot', traces, {
            margin: { l: 50, r: 30, b: 50, t: 10 },
            showlegend: false,
            xaxis: {
                title: { text: '⟶ ' + space.axes.x, font: { size: 13, color: t.axisTitle, family: 'system-ui, sans-serif' } },
                range: space.rangeX,
                gridcolor: t.grid, zeroline: true, zerolinecolor: t.grid,
                tickfont: { size: 10, color: t.axis }
            },
            yaxis: {
                title: { text: '⟶ ' + space.axes.y, font: { size: 13, color: t.axisTitle, family: 'system-ui, sans-serif' } },
                range: space.rangeY,
                gridcolor: t.grid, zeroline: true, zerolinecolor: t.grid,
                scaleanchor: 'x', tickfont: { size: 10, color: t.axis }
            },
            annotations,
            plot_bgcolor: t.bg,
            paper_bgcolor: t.bg
        }, { displayModeBar: false, responsive: true });
    }

    function renderDirections(stage) {
        const t = theme();
        const traces = [];
        const annotations = [];

        // Background vocabulary (subdued)
        Object.keys(space.vocab).forEach(w => {
            const v = space.vocab[w];
            traces.push({
                x: [v[0]], y: [v[1]],
                mode: 'markers+text',
                text: [w], textposition: 'top center',
                textfont: { size: 12, color: t.textMuted, family: 'system-ui, sans-serif' },
                marker: { size: 8, color: t.labelIdle, opacity: 0.45 },
                showlegend: false, cliponaxis: false
            });
        });

        const GREEN = '#10b981';
        const ORANGE = '#f59e0b';

        function addArrow(x0, y0, x1, y1, color, dashed) {
            annotations.push({
                ax: x0, ay: y0, axref: 'x', ayref: 'y',
                x: x1, y: y1, xref: 'x', yref: 'y',
                showarrow: true, arrowhead: 3, arrowsize: 1.6,
                arrowwidth: 2.2, arrowcolor: color,
                arrowdash: dashed ? 'dash' : 'solid'
            });
        }

        // Gender direction: the same vector wherever you anchor it
        addArrow( 5, -10,  5, 10, GREEN);   // Man → Woman
        addArrow(25, -10, 25, 10, GREEN);   // King → Queen
        annotations.push({
            x: 15, y: 25, xref: 'x', yref: 'y',
            text: '<b>“Gender”</b> — the same direction everywhere',
            showarrow: false,
            font: { size: 13, color: GREEN, family: 'system-ui, sans-serif' },
            align: 'center'
        });

        if (stage === 'power') {
            addArrow( 5, -10, 15, -10, ORANGE);  // Man → Prince
            addArrow(15, -10, 25, -10, ORANGE);  // Prince → King
            addArrow( 5,  10, 15,  10, ORANGE);  // Woman → Princess
            addArrow(15,  10, 25,  10, ORANGE);  // Princess → Queen
            annotations.push({
                x: 15, y: -25, xref: 'x', yref: 'y',
                text: '<b>“Power”</b> — the same direction here too',
                showarrow: false,
                font: { size: 13, color: ORANGE, family: 'system-ui, sans-serif' },
                align: 'center'
            });
        }

        Plotly.react('embedding-viz-plot', traces, {
            margin: { l: 50, r: 30, b: 50, t: 10 },
            showlegend: false,
            xaxis: {
                title: { text: '⟶ ' + space.axes.x, font: { size: 13, color: t.axisTitle, family: 'system-ui, sans-serif' } },
                range: space.rangeX,
                gridcolor: t.grid, zeroline: true, zerolinecolor: t.grid,
                tickfont: { size: 10, color: t.axis }
            },
            yaxis: {
                title: { text: '⟶ ' + space.axes.y, font: { size: 13, color: t.axisTitle, family: 'system-ui, sans-serif' } },
                range: space.rangeY,
                gridcolor: t.grid, zeroline: true, zerolinecolor: t.grid,
                scaleanchor: 'x', tickfont: { size: 10, color: t.axis }
            },
            annotations,
            plot_bgcolor: t.bg,
            paper_bgcolor: t.bg
        }, { displayModeBar: false, responsive: true });

        // Update the result line with an explanatory sentence
        const r = document.getElementById('embedding-arithmetic-result');
        if (r) {
            if (stage === 'power') {
                r.innerHTML = 'The direction <b style="color:#f59e0b">Man → Prince → King</b> is the same as <b style="color:#f59e0b">Woman → Princess → Queen</b>. Meaning lives not just in <b>position</b> but also in the <b>direction</b> between words.';
            } else {
                r.innerHTML = 'The vector <b style="color:#10b981">Man → Woman</b> points the same way as <b style="color:#10b981">King → Queen</b>: “Gender" is a <b>direction</b> in space — the same direction, no matter where you anchor it.';
            }
        }
    }

    // ── Public surface ──

    function render() {
        const t = theme();
        const input = document.getElementById('embedding-viz-input');
        if (!input) return;
        const text = input.value || '';
        const words = text.split(/[\s,]+/).filter(w => w in space.vocab);
        renderNormal(words);
    }

    function doArithmetic() {
        const inp = document.getElementById('embedding-arithmetic-input');
        const r = document.getElementById('embedding-arithmetic-result');
        if (!inp || !r) return;

        const expr = inp.value.trim();
        const ev = evaluate(expr);
        if (!ev) { r.innerHTML = '<span class="res-dim">Invalid expression</span>'; result = null; render(); return; }

        if (ev.kind === 'num') {
            r.innerHTML = `Result: <b>${ev.n.toFixed(2)}</b> <span class="res-dim">(scalar)</span>`;
            result = null;
        } else {
            const near = nearest(ev.pos);
            result = { pos: ev.pos, nearest: near.word, steps: [] };
            r.innerHTML = `→ <b>(${ev.pos[0].toFixed(1)}, ${ev.pos[1].toFixed(1)})</b> · nearest point: <b style="color:#ef4444">${near.word}</b> <span class="res-dim">(d=${near.dist.toFixed(2)})</span>`;
        }
        render();
    }

    // Pre-compute step-by-step arrows so the user sees how the expression builds up.
    function doArithmeticWithSteps(expr) {
        const inp = document.getElementById('embedding-arithmetic-input');
        const r = document.getElementById('embedding-arithmetic-result');
        if (!inp || !r) return;
        inp.value = expr;

        const parts = tokenize(expr);
        if (!parts.length) return;

        // Walk the expression left-to-right, computing partial position + emitting a step arrow
        let pos = null;
        const steps = [];
        let sign = 1;
        for (let i = 0; i < parts.length; i++) {
            const t = parts[i];
            if (t === '+') { sign = 1; continue; }
            if (t === '-') { sign = -1; continue; }
            if (t === '*' || t === '/' || t === '(' || t === ')') continue;
            if (/^\d+$/.test(t)) continue;
            const norm = Object.keys(space.vocab).find(w => w.toLowerCase() === t.toLowerCase());
            if (!norm) continue;
            const v = space.vocab[norm];
            const next = pos ? [pos[0] + sign * v[0], pos[1] + sign * v[1]] : [v[0] * sign, v[1] * sign];
            if (pos) {
                steps.push({ from: [...pos], to: [...next], label: (sign === 1 ? '+ ' : '− ') + norm });
            }
            pos = next;
            sign = 1;
        }

        if (!pos) { doArithmetic(); return; }
        const near = nearest(pos);
        result = { pos, nearest: near.word, steps };
        r.innerHTML = `→ <b>(${pos[0].toFixed(1)}, ${pos[1].toFixed(1)})</b> · nearest point: <b style="color:#ef4444">${near.word}</b> <span class="res-dim">(d=${near.dist.toFixed(2)})</span>`;
        render();
    }

    function bind() {
        const inp = document.getElementById('embedding-viz-input');
        if (inp) inp.addEventListener('input', render);

        const arith = document.getElementById('embedding-arithmetic-input');
        if (arith) {
            arith.addEventListener('keyup', e => {
                if (e.key === 'Enter') doArithmeticWithSteps(arith.value);
            });
            arith.addEventListener('input', () => {
                // Live update — but without the elaborate steps (debounce via rAF)
                if (arith._raf) cancelAnimationFrame(arith._raf);
                arith._raf = requestAnimationFrame(() => doArithmeticWithSteps(arith.value));
            });
        }

        // Quick-chips
        document.querySelectorAll('#embedding-demo .emb-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const ex = btn.getAttribute('data-ex');
                document.querySelectorAll('#embedding-demo .emb-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (ex === 'directions') {
                    renderDirections('gender');
                    setTimeout(() => renderDirections('power'), 2200);
                } else {
                    doArithmeticWithSteps(ex);
                }
            });
        });
    }

    function init() {
        bind();
        // Activate the first chip automatically
        const firstChip = document.querySelector('#embedding-demo .emb-chip');
        if (firstChip) firstChip.click();
    }

    return { render, bind, init, doArithmetic, doArithmeticWithSteps, renderDirections };
})();



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
            xaxis: { title: 'Token Position', dtick: 1, gridcolor: themeColor('#f1f5f9') },
            yaxis: { title: 'Encoding Value', range: [-1.3, 1.3], gridcolor: themeColor('#f1f5f9') },
            showlegend: true,
            legend: { x: 1, y: 1, xanchor: 'right', bgcolor: isDarkMode() ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)', font: { size: 10 } },
            plot_bgcolor: themeColor('#fff'),
            paper_bgcolor: themeColor('#fff'),
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
            plot_bgcolor: themeColor('#fff'),
            paper_bgcolor: themeColor('#fff'),
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
			type: 'embedding',
			short: 'Raw embeddings',
			desc: 'This is the input layer. Each token ("The", "cat", "sat", "on") is looked up in the embedding table, a simple mapping from token ID to a learned vector. At this stage the vectors carry only the isolated meaning of each word, with no context from surrounding tokens.',
			example: '"cat" → vector [0.22, 0.85, -0.41, …]\nNo grammar, context, or relationships yet.'
		},
		{
			type: 'attention_ffn',
			short: 'Local syntax & word roles',
			attnDesc: '"cat" attends to "The" → learns it\'s part of a definite noun phrase',
			ffnDesc: 'Activates part-of-speech features: "cat"→noun, "sat"→verb',
			example: '"The cat" groups into a noun phrase;\n"sat" tagged as past-tense verb.'
		},
		{
			type: 'attention_ffn',
			short: 'Clause structure & relationships',
			attnDesc: '"sat" attends to "cat" → identifies subject-verb link',
			ffnDesc: 'Encodes who-did-what: agent="cat", action="sat", prep="on"',
			example: '"cat" is the one sitting;\n"on" opens a prepositional phrase →\nexpects a location next.'
		},
		{
			type: 'unembedding',
			short: 'Unembedding → Vocabulary',
			desc: 'The final vector of "on" is multiplied by the unembedding matrix (transpose of the embedding matrix) to produce a score for every word in the vocabulary. The highest-scoring words become the most likely next-token predictions.',
			example: '"on" vector × Unembedding →\n"the" (score 3.2, p=42%), "a" (1.8, 18%),\n"mat" (0.7, 7%), "floor" (0.5, 4%)'
		},
	],

	// Layout
	W: 900,
	H: 0,
	rowH: 220,
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

		this.H = this.topPad + (this.numLayers + 1) * this.rowH + 170;
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
			// Final layer → draw arrow to unembedding
			const endY = startY + 150;
			this.ctx.globalAlpha = this.currentLayer === this.numLayers ? 0.9 : 0.2;
			this.ctx.beginPath();
			this.ctx.moveTo(centerX, startY);
			this.ctx.lineTo(centerX, endY - 10);
			this.ctx.strokeStyle = '#3b82f6';
			this.ctx.lineWidth = 3;
			this.ctx.stroke();
			this.drawArrowHead(centerX, endY - 10, Math.PI / 2, '#3b82f6');

			// Label—centered below the arrow, far enough from the metadata
			this.ctx.font = 'bold 12px system-ui';
			this.ctx.fillStyle = themeColor('#1e293b');
			this.ctx.textAlign = 'center';
			this.ctx.fillText('Next predicted Word', centerX, endY + 20);
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
			const role = this.layerRoles[l];

			this.drawLayerBackground(l, layout);
			this.drawStream(l, layout);
			this.drawVerticalStreamArrows(l, layout);

			if (role.type === 'attention_ffn') {
				this.drawProcessingBlocks(l, layout);
				this.drawMetadata(l, layout);
				this.drawFlowArrows(l, layout);
			} else if (role.type === 'unembedding') {
				this.drawMetadata(l, layout);
				this.drawUnembeddingBlock(l, layout);
				this.drawUnembeddingArrow(l, layout);
			} else {
				// embedding layer: show explanation only
				this.drawMetadata(l, layout);
			}
		}
	},

	clearAndSetupCanvas: function() {
		this.ctx.clearRect(0, 0, this.W, this.H);
		this.ctx.fillStyle = themeColor('#ffffff');
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

	drawLayerBackground: function(l, { yBase, isCurrent, descColX }) {
		if (!isCurrent) return;
		const ctx = this.ctx;
		const role = this.layerRoles[l];
		const maxTextWidth = this.W - descColX - 40;

		// Calculate how tall the metadata text will be
		let metaHeight = 0;
		if (role.type === 'attention_ffn') {
			metaHeight += 25;
			metaHeight += this.measureWrappedHeight(role.attnDesc, '14px system-ui', maxTextWidth, 18);
			metaHeight += 15;
			metaHeight += 25;
			metaHeight += this.measureWrappedHeight(role.ffnDesc, '14px system-ui', maxTextWidth, 18);
			metaHeight += 15;
			metaHeight += 20;
			metaHeight += this.measureWrappedHeight(role.example, 'bold 14px monospace', maxTextWidth - 5, 18);
			metaHeight += 10;
		} else {
			// embedding or unembedding: generic description
			metaHeight += 25;
			metaHeight += this.measureWrappedHeight(role.desc, '14px system-ui', maxTextWidth, 18);
			metaHeight += 15;
			metaHeight += 20;
			metaHeight += this.measureWrappedHeight(role.example, 'bold 14px monospace', maxTextWidth - 5, 18);
			metaHeight += 10;
		}

		const minH = this.rowH - 5;
		const boxH = Math.max(minH, metaHeight + 30);

		ctx.fillStyle = themeColor('#f8fafc');
		ctx.beginPath();
		ctx.roundRect(25, yBase - 10, this.W - 50, boxH, 12);
		ctx.fill();
		ctx.strokeStyle = '#3b82f6';
		ctx.lineWidth = 2;
		ctx.stroke();
	},

	measureWrappedHeight: function(text, font, maxWidth, lineH) {
		if (!text) return 0;
		const ctx = this.ctx;
		ctx.font = font;

		const paragraphs = text.split('\n');
		let lineNum = 0;

		paragraphs.forEach(paragraph => {
			const words = paragraph.split(' ');
			let line = '';

			words.forEach(word => {
				const testLine = line ? line + ' ' + word : word;
				if (ctx.measureText(testLine).width > maxWidth && line) {
					line = word;
					lineNum++;
				} else {
					line = testLine;
				}
			});
			if (line) lineNum++;
		});

		return lineNum * (lineH || 18);
	},

	drawMetadata: function(l, { yBase, descColX, isCurrent }) {
		if (!isCurrent) return;
		const ctx = this.ctx;
		const dy = yBase + 5;
		const role = this.layerRoles[l];
		const maxTextWidth = this.W - descColX - 40;

		ctx.globalAlpha = 1;
		ctx.textAlign = 'left';

		if (role.type === 'attention_ffn') {
			// Attention Text
			ctx.font = 'bold 15px system-ui';
			ctx.fillStyle = '#8b5cf6';
			ctx.fillText('Attention:', descColX, dy + 5);
			ctx.font = '14px system-ui';
			ctx.fillStyle = themeColor('#475569');
			this.drawWrappedText(role.attnDesc, descColX, dy + 25, '14px system-ui', '#475569', maxTextWidth, 18);

			// FFN Text
			ctx.font = 'bold 15px system-ui';
			ctx.fillStyle = '#d97706';
			ctx.fillText('FFN (Knowledge):', descColX, dy + 60);
			ctx.font = '14px system-ui';
			ctx.fillStyle = themeColor('#475569');
			this.drawWrappedText(role.ffnDesc, descColX, dy + 80, '14px system-ui', '#475569', maxTextWidth, 18);

			// Example Text
			ctx.font = 'bold 14px monospace';
			ctx.fillStyle = '#10b981';
			ctx.fillText('Example:', descColX, dy + 115);
			this.drawWrappedText(role.example, descColX + 5, dy + 135, 'bold 14px monospace', '#10b981', maxTextWidth - 5, 18);
		} else {
			// embedding or unembedding: show a single description section
			const title = role.type === 'embedding' ? 'Embedding:' : 'Unembedding:';
			const titleColor = role.type === 'embedding' ? '#3b82f6' : '#ef4444';
			ctx.font = 'bold 15px system-ui';
			ctx.fillStyle = titleColor;
			ctx.fillText(title, descColX, dy + 5);
			ctx.font = '14px system-ui';
			ctx.fillStyle = themeColor('#475569');
			this.drawWrappedText(role.desc, descColX, dy + 25, '14px system-ui', '#475569', maxTextWidth, 18);

			// Measure where description ends
			const descH = this.measureWrappedHeight(role.desc, '14px system-ui', maxTextWidth, 18);
			const exY = dy + 30 + descH + 5;
			ctx.font = 'bold 14px monospace';
			ctx.fillStyle = '#10b981';
			ctx.fillText('Example:', descColX, exY);
			this.drawWrappedText(role.example, descColX + 5, exY + 20, 'bold 14px monospace', '#10b981', maxTextWidth - 5, 18);
		}
	},

	drawWrappedText: function(text, x, y, font, color, maxWidth, lineH) {
		if (!text) return;
		const ctx = this.ctx;
		ctx.font = font;
		ctx.fillStyle = color;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';

		const paragraphs = text.split('\n');
		let lineNum = 0;

		paragraphs.forEach(paragraph => {
			const words = paragraph.split(' ');
			let line = '';

			words.forEach(word => {
				const testLine = line ? line + ' ' + word : word;
				if (ctx.measureText(testLine).width > maxWidth && line) {
					ctx.fillText(line, x, y + lineNum * (lineH || 18));
					line = word;
					lineNum++;
				} else {
					line = testLine;
				}
			});
			if (line) {
				ctx.fillText(line, x, y + lineNum * (lineH || 18));
				lineNum++;
			}
		});
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
			this.ctx.fillStyle = themeColor('#fff');
			this.ctx.textAlign = 'center';
			this.ctx.fillText('+', centerX, returnY + 14);
		}
	},

	drawUnembeddingBlock: function(l, layout) {
		const { yBase, streamX, vecW, tokenBlockH, alpha, isCurrent, cellW, cellH } = layout;
		const boxH = tokenBlockH + 15;
		const unembedW = vecW + 40;
		const unembedX = streamX + vecW + 60;

		this.drawModuleBox(unembedX, yBase + 5, unembedW, boxH, '#fef2f2', isCurrent ? '#ef4444' : '#e2e8f0', alpha);

		if (isCurrent) {
			const ctx = this.ctx;
			ctx.font = 'bold 12px system-ui';
			ctx.fillStyle = '#ef4444';
			ctx.textAlign = 'center';
			ctx.fillText('Unembedding', unembedX + unembedW / 2, yBase + boxH / 2 - 6);
			ctx.font = '11px system-ui';
			ctx.fillStyle = themeColor('#64748b');
			ctx.fillText('(score × vocab)', unembedX + unembedW / 2, yBase + boxH / 2 + 12);
		}
	},

	drawUnembeddingArrow: function(l, layout) {
		if (!layout.isActive) return;
		const { yBase, streamX, vecW, isCurrent, tokenBlockH } = layout;
		const arrowAlpha = isCurrent ? 0.85 : 0.3;
		const arrowLW = isCurrent ? 2 : 1.2;
		const streamRightX = streamX + vecW;
		const unembedW = vecW + 40;
		const unembedX = streamX + vecW + 60;

		// Arrow from stream to unembedding
		this.drawCurvedArrow(streamRightX + 5, yBase + 15, unembedX + 5, yBase + 15, -20, '#ef4444', arrowLW, arrowAlpha);

		// Return arrow from unembedding back to stream
		const startX = unembedX + (unembedW / 2);
		const startY = yBase + tokenBlockH + 15;
		const returnY = yBase + tokenBlockH + 40;
		const centerX = streamX + vecW / 2;

		this.ctx.globalAlpha = arrowAlpha;
		this.ctx.beginPath();
		this.ctx.moveTo(startX, startY);
		this.ctx.bezierCurveTo(startX, returnY + 20, centerX + 40, returnY + 20, centerX, returnY + 10);
		this.ctx.strokeStyle = '#10b981';
		this.ctx.lineWidth = arrowLW;
		this.ctx.stroke();

		if (isCurrent) {
			this.ctx.globalAlpha = 1;
			this.ctx.fillStyle = '#10b981';
			this.ctx.beginPath();
			this.ctx.arc(centerX, returnY + 10, 8, 0, Math.PI * 2);
			this.ctx.fill();
			this.ctx.fillStyle = themeColor('#fff');
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

	drawHeaders: function() {
		const ctx = this.ctx;
		const cellW = 6;
		const streamX = 150;
		const vecW = this.dims * (cellW + 1);
		const curRole = this.layerRoles[this.currentLayer];

		ctx.font = 'bold 18px system-ui, sans-serif';
		ctx.fillStyle = themeColor('#1e293b');
		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		ctx.fillText('Residual Stream Flow', 30, this.topPad - 25);

		ctx.font = '600 11px system-ui, sans-serif';
		ctx.textAlign = 'center';

		ctx.fillStyle = themeColor('#64748b');
		ctx.fillText('RESIDUAL x', streamX + vecW / 2, this.topPad - 5);

		if (curRole && curRole.type === 'unembedding') {
			ctx.fillStyle = '#ef4444';
			ctx.fillText('UNEMBEDDING × VOCABULARY', streamX + vecW + 110, this.topPad - 5);
		} else if (curRole && curRole.type === 'embedding') {
			ctx.fillStyle = '#3b82f6';
			ctx.fillText('INPUT EMBEDDINGS', streamX + vecW + 110, this.topPad - 5);
		} else {
			ctx.fillStyle = '#8b5cf6';
			ctx.fillText('ATTENTION', streamX + vecW + 65, this.topPad - 5);
			ctx.fillStyle = '#d97706';
			ctx.fillText('FFN', streamX + vecW + 165, this.topPad - 5);
		}
	},
	
	_updateInfo: function () {
		const layer = this.currentLayer;
		const infoDiv = document.getElementById('residual-stream-info');
		if (!infoDiv) return;

		const descriptions = [
			'The residual stream starts with <b>raw embeddings</b>. "The", "cat", "sat", "on" are just lookup vectors — no grammar, no meaning, no context. Each token is independently mapped to a point in embedding space. Everything that follows will be <b>added</b> to these vectors.',

			'<b>Layer 1 — Local syntax & word roles.</b> Attention heads look at adjacent tokens: "cat" attends to "The" and recognizes it\'s part of a definite noun phrase. The FFN fires part-of-speech detectors — tagging "cat" as a noun and "sat" as a past-tense verb. These features are <b>added</b> to the residual stream.',

			'<b>Layer 2 — Clause structure & relationships.</b> Attention now connects "sat" back to "cat" — identifying the subject-verb dependency (who did the sitting?). The FFN encodes thematic roles: "cat" = agent, "sat" = action, "on" = preposition expecting a location. The stream now carries grammatical structure.',

			'<b>Layer 3 — Unembedding.</b> This is NOT an attention or FFN layer. The final residual vector of "on" is multiplied by the <b>unembedding matrix</b> (the transpose of the embedding matrix). This produces a score for every word in the vocabulary — measuring how close the final vector is to each word\'s learned embedding. A softmax converts scores to probabilities, and the next word is sampled from this distribution.'
		];

		infoDiv.innerHTML = `
	<div style="padding:14px 18px; background:#fff; border-radius:10px; border:1px solid #e2e8f0;">
	    <div style="font-size:0.95em; color:#334155; line-height:1.6;">${descriptions[layer]}</div>
	</div>`;
	},

	_syncControls: function () {
		const slider = document.getElementById('residual-stream-layer');
		if (slider) {
			slider.max = this.numLayers;
			slider.value = this.currentLayer;
		}

		const label = document.getElementById('residual-stream-layer-label');
		if (label) {
			if (this.currentLayer === 0) label.textContent = 'x\u2080 · Embedding';
			else if (this.currentLayer === this.numLayers) label.textContent = 'Unembedding';
			else label.textContent = `h${this.currentLayer}`;
		}

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
                line: { width: 1, color: themeColor('#fff') }
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
                gridcolor: themeColor('#f1f5f9')
            },
            yaxis: {
                autorange: 'reversed',
                tickfont: { size: 12 }
            },
            plot_bgcolor: themeColor('#fff'),
            paper_bgcolor: themeColor('#fff'),
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

	// ── Button state ──

	updateButton: function() {
		const btn = document.getElementById('autoregressive-play');
		if (!btn) return;

		if (this.animating) {
			this.styleButtonAsStop(btn);
		} else {
			this.styleButtonAsPlay(btn);
		}
		this.enableButton(btn);
	},

	styleButtonAsStop: function(btn) {
		btn.textContent = '⏹ Stop Generation';
		btn.style.background = '#dc2626';
		btn.style.borderColor = '#dc2626';
		btn.style.color = '#fff';
	},

	styleButtonAsPlay: function(btn) {
		btn.textContent = '▶ Play Generation';
		btn.style.background = '#3b82f6';
		btn.style.borderColor = '#3b82f6';
		btn.style.color = '#fff';
	},

	enableButton: function(btn) {
		btn.disabled = false;
		btn.style.opacity = '1';
	},

	// ── Current step data ──

	getCurrentStepData: function() {
		return this.steps[Math.min(this.currentStep, this.steps.length - 1)];
	},

	getOriginalWordCount: function() {
		return this.originalInput.split(' ').length;
	},

	getInputWords: function(stepData) {
		return stepData.input.split(' ');
	},

	// ── Word classification ──

	isOriginalWord: function(index, originalCount) {
		return index < originalCount;
	},

	isJustAddedWord: function(index, totalWords, step) {
		return index === totalWords - 1 && step > 0;
	},

	// ── Word HTML rendering ──

	renderOriginalWord: function(word) {
		return `<span class="ar-word ar-orig">${word}</span>`;
	},

	renderJustAddedWord: function(word) {
		return `<span class="ar-word ar-added">${word}</span>`;
	},

	renderContextWord: function(word) {
		return `<span class="ar-word ar-ctx">${word}</span>`;
	},

	renderWordSpan: function(word, index, totalWords, originalCount, step) {
		if (this.isOriginalWord(index, originalCount)) {
			return this.renderOriginalWord(word);
		}
		if (this.isJustAddedWord(index, totalWords, step)) {
			return this.renderJustAddedWord(word);
		}
		return this.renderContextWord(word);
	},

	// ── Sentence HTML ──

	buildSentenceHtml: function(inputWords, originalCount, step) {
		let html = '';
		inputWords.forEach((word, i) => {
			html += this.renderWordSpan(word, i, inputWords.length, originalCount, step);
		});
		return html;
	},

	// ── Prediction HTML ──

	isEndToken: function(output) {
		return output === '|endoftext|';
	},

	// In AutoregressiveViz, replace these three methods:

	renderStopPrediction: function() {
		return `<span class="ar-pill ar-stop"
		  onclick="AutoregressiveViz.clickAdvance()"
	    >⏹ STOP</span>`;
	},

	renderWordPrediction: function(output) {
		return `<span class="ar-pill ar-pred"
		  onclick="AutoregressiveViz.clickAdvance()"
		  title="Click to add this word and continue"
	    >${output}</span>`;
	},

	// Add this new method to AutoregressiveViz:
	clickAdvance: function() {
		// If currently animating, don't interfere
		if (this.animating) return;

		// If we're at the last step, reset
		if (this.isAtEnd()) {
			this.reset();
			return;
		}

		// Advance to the next step and re-render
		this.advanceStep();
		this.render();
	},


	buildPredictionHtml: function(output) {
		if (this.isEndToken(output)) {
			return this.renderStopPrediction();
		}
		return this.renderWordPrediction(output);
	},

	// ── Layout sections ──

	buildSentenceDisplayHtml: function(sentenceHtml) {
		return `
	    <div class="ar-sentence">
		${sentenceHtml}
	    </div>`;
	},

	buildPredictionRowHtml: function(predictionHtml, prob) {
		return `
	    <div class="ar-row">
		<span class="ar-label">→ Predicts:</span>
		${predictionHtml}
		<span class="ar-prob">(p=${prob.toFixed(2)})</span>
	    </div>`;
	},

	buildLegendHtml: function() {
		return `
	    <div class="ar-legend">
		<div class="ar-legend-items">
		    <span><span class="ar-swatch ar-swatch-input">■</span> user input</span>
		    <span><span class="ar-swatch ar-swatch-gen">■</span> generated</span>
		    <span><span class="ar-swatch ar-swatch-added">■</span> just added</span>
		    <span><span class="ar-swatch ar-swatch-next">■</span> next prediction</span>
		</div>
	    </div>`;
	},

	// ── Main render ──

	render: function() {
		const container = document.getElementById('autoregressive-viz');
		if (!container) return;

		const s = this.getCurrentStepData();
		const inputWords = this.getInputWords(s);
		const originalCount = this.getOriginalWordCount();

		const sentenceHtml = this.buildSentenceHtml(inputWords, originalCount, this.currentStep);
		const predictionHtml = this.buildPredictionHtml(s.output);

		const html = `
	    <div style="font-family:monospace; font-size:0.85em;">
		${this.buildSentenceDisplayHtml(sentenceHtml)}
		${this.buildPredictionRowHtml(predictionHtml, s.prob)}
		${this.buildLegendHtml()}
	    </div>`;

		container.innerHTML = html;
	},

	// ── Animation control ──

	isAtEnd: function() {
		return this.currentStep >= this.steps.length - 1;
	},

	shouldContinueAnimating: function() {
		return !this.isAtEnd() && this.animating;
	},

	restartIfAtEnd: function() {
		if (this.isAtEnd()) {
			this.currentStep = 0;
		}
	},

	beginAnimating: function() {
		this.animating = true;
		this.updateButton();
	},

	endAnimating: function() {
		this.animating = false;
		this.timeoutId = null;
		this.updateButton();
	},

	scheduleNextStep: function(callback, delay) {
		this.timeoutId = setTimeout(callback, delay);
	},

	advanceStep: function() {
		this.currentStep++;
	},

	runAnimationLoop: function() {
		const step = () => {
			this.render();
			if (this.shouldContinueAnimating()) {
				this.advanceStep();
				this.scheduleNextStep(step, 1200);
			} else {
				this.endAnimating();
			}
		};
		step();
	},

	animate: function() {
		if (this.animating) {
			this.stop();
			return;
		}

		this.restartIfAtEnd();
		this.beginAnimating();
		this.runAnimationLoop();
	},

	clearScheduledTimeout: function() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	},

	stop: function() {
		this.animating = false;
		this.clearScheduledTimeout();
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
	// Bind attention stepper buttons eagerly so the very first click
	// (before the lazy observer fires) still works.
	if (typeof AttentionDemo !== 'undefined') {
		AttentionDemo.bind();
	}

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

	// Step 2: Embedding is initialised lazily via loadIntuitionModule
	// (see _lazyRegister('embedding-viz-plot', ...)) so the bind()
	// happens only after the plot is scrolled into view.

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

	// Hand off to the lazy-init version so the attention stepper buttons
	// get their event listeners wired (loadIntuitionModule is otherwise
	// never queued because PHP's preg_match only picks the first match).
	if (typeof loadIntuitionModule === 'function') {
		loadIntuitionModule();
	}
}

// ============================================================
// STEP 4a: ATTENTION DEMO (lndw style — diamond leaps to context)
// ============================================================

const AttentionDemo = {
	currentExample: 0,

	examples: [
		{
			sentenceHTML: 'I walk to the <span class="attn-word-bank">bank</span>.',
			contextWords: [],
			bankShift: [5, 5],
			label: 'No context',
			caption: 'No context word — <b>Bank</b> stays in the middle, ambiguous.'
		},
		{
			sentenceHTML: 'I sit by the <span class="attn-word-river">river</span> on the <span class="attn-word-bank">bank</span>.',
			contextWords: ['river'],
			bankShift: [3.2, 6.8],
			label: '<span class="em">river</span> nearby',
			caption: '<b>River</b> is the neighbor → the contextualized <b>Bank</b> leaps toward <i>river bank</i> (the seat by the water).'
		},
		{
			sentenceHTML: 'I bring my <span class="attn-word-money">money</span> to the <span class="attn-word-bank">bank</span>.',
			contextWords: ['money'],
			bankShift: [7.2, 3.2],
			label: '<span class="em">money</span> nearby',
			caption: '<b>Money</b> is the neighbor → <b>Bank</b> leaps toward the financial meaning.'
		},
		{
			sentenceHTML: 'After the walk by the <span class="attn-word-river">river</span> I go to the <span class="attn-word-bank">bank</span> to deposit my <span class="attn-word-money">money</span>.',
			contextWords: ['river', 'money'],
			bankShift: [6.6, 3.9],
			label: '<span class="em">both</span> nearby',
			caption: 'Both neighbors compete — <b>money</b> wins by a hair, so <b>Bank</b> still tilts toward the financial side.'
		}
	],

	vocabPositions: {
		'bank':  { base: [5,   5],  color: '#3b82f6', label: 'Bank' },
		'river': { base: [0.5, 9.5], color: '#10b981', label: 'River' },
		'money': { base: [10.5, 0.5], color: '#f59e0b', label: 'Money' }
	},

	render: function() {
		const plotDiv = document.getElementById('transformer-plot');
		if (!plotDiv) return;

		const sentenceEl = document.getElementById('attn-sentence');
		const labelEl = document.getElementById('attn-step-label');
		const captionEl = document.getElementById('attn-caption');
		const prevBtn = document.getElementById('attn-prev');
		const nextBtn = document.getElementById('attn-next');
		const example = this.examples[this.currentExample];

		if (sentenceEl) sentenceEl.innerHTML = example.sentenceHTML;
		if (labelEl) labelEl.innerHTML = (this.currentExample + 1) + ' / ' + this.examples.length + ' · ' + example.label;
		if (captionEl) captionEl.innerHTML = example.caption;
		if (prevBtn) prevBtn.disabled = this.currentExample === 0;
		if (nextBtn) nextBtn.disabled = this.currentExample === this.examples.length - 1;

		const traces = [];
		const isDark = isDarkMode();
		const textColor = themeColor('#1e293b');
		const gridColor = themeColor('#e2e8f0');

		// 1. Static vocabulary points (background)
		Object.keys(this.vocabPositions).forEach(word => {
			const v = this.vocabPositions[word];
			traces.push({
				x: [v.base[0]], y: [v.base[1]],
				mode: 'markers+text',
				name: v.label,
				text: [v.label],
				textposition: 'bottom center',
				textfont: { size: 13, color: v.color, family: 'system-ui, sans-serif' },
				marker: { size: 14, opacity: 0.55, color: v.color, line: { width: 0 } },
				type: 'scatter',
				showlegend: false,
				hovertemplate: `<b>${v.label}</b><br>base embedding<br>[${v.base[0]}, ${v.base[1]}]<extra></extra>`
			});
		});

		// 2. Attention lines from Bank to context words (dotted orange "handshake")
		const bankBase = this.vocabPositions['bank'].base;
		example.contextWords.forEach(word => {
			const v = this.vocabPositions[word];
			if (!v) return;
			traces.push({
				x: [bankBase[0], v.base[0]],
				y: [bankBase[1], v.base[1]],
				mode: 'lines',
				line: { color: isDark ? 'rgba(249,115,22,0.55)' : 'rgba(249,115,22,0.7)', width: 2.5, dash: 'dot' },
				hoverinfo: 'skip',
				showlegend: false,
				type: 'scatter'
			});
		});

		// 3. The contextualized Bank (the diamond — its movement is the whole point)
		traces.push({
			x: [example.bankShift[0]], y: [example.bankShift[1]],
			mode: 'markers+text',
			text: ['"Bank" in context'],
			textposition: 'top center',
			textfont: { size: 12, color: textColor, family: 'system-ui, sans-serif' },
			marker: {
				size: 18,
				color: '#3b82f6',
				symbol: 'diamond',
				line: { color: isDark ? '#f1f5f9' : '#1e293b', width: 2 }
			},
			type: 'scatter',
			showlegend: false,
			hovertemplate: `<b>"Bank" in context</b><br>contextualized embedding<br>[${example.bankShift[0].toFixed(2)}, ${example.bankShift[1].toFixed(2)}]<extra></extra>`
		});

		// 4. Trajectory arrow from Bank base → shifted position (only if it moved)
		const moved = Math.hypot(example.bankShift[0] - bankBase[0], example.bankShift[1] - bankBase[1]) > 0.05;
		if (moved) {
			traces.push({
				x: [bankBase[0], example.bankShift[0]],
				y: [bankBase[1], example.bankShift[1]],
				mode: 'lines',
				line: { color: '#3b82f6', width: 2 },
				hoverinfo: 'skip',
				showlegend: false,
				type: 'scatter'
			});
		}

		const layout = {
			margin: { l: 40, r: 30, b: 40, t: 30 },
			hovermode: 'closest',
			xaxis: { range: [-1, 12], title: { text: 'Semantic dimension A', font: { size: 11, color: textColor } }, gridcolor: gridColor, zeroline: false, tickfont: { color: textColor } },
			yaxis: { range: [-1, 11], title: { text: 'Semantic dimension B', font: { size: 11, color: textColor } }, gridcolor: gridColor, zeroline: false, scaleanchor: 'x', tickfont: { color: textColor } },
			showlegend: false,
			plot_bgcolor: themeColor('#fff'),
			paper_bgcolor: themeColor('#fff'),
			annotations: []
		};

		Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
	},

	next: function() { if (this.currentExample < this.examples.length - 1) { this.currentExample++; this.render(); } },
	prev: function() { if (this.currentExample > 0)                  { this.currentExample--; this.render(); } },

	bind: function() {
		const prev = document.getElementById('attn-prev');
		const next = document.getElementById('attn-next');
		// Idempotent — bind() may be called twice (once eagerly, once via lazy observer).
		// Guard with a flag so each click only fires once.
		if (next && !next._attnBoundNext) {
			next._attnBoundNext = true;
			next.addEventListener('click', () => this.next());
		}
		if (prev && !prev._attnBoundPrev) {
			prev._attnBoundPrev = true;
			prev.addEventListener('click', () => this.prev());
		}
	}
};

// Backwards-compatible alias used by older call sites
function runAttention() { AttentionDemo.render(); }

// ============================================================
// STEP 4b: FFN VISUALIZER (gorgeous dark mode via CSS classes)
// ============================================================

const FFNViz = {
    scenarios: {
        apple_fruit: {
            desc: "The context is <b>eating</b>, so the keys for <b>food</b> and <b>tree/orchard</b> match; the tech key stays silent. Each matching key writes a value that raises the odds of tokens like “pie”, “juice”, “crunchy”.",
            detectors: [
                { id: 'd1', label: 'Key: tech company?', active: false, fireClass: 'idle' },
                { id: 'd2', label: 'Key: edible fruit?', active: true,  fireClass: 'fire' },
                { id: 'd3', label: 'Key: tree / orchard?', active: true,  fireClass: 'fire' }
            ],
            facts: [
                { id: 'f1', label: '→ pie · juice · sugar',      active: true,  fireClass: 'fire',      from: ['d2'] },
                { id: 'f2', label: '→ Mac · iPhone · Cupertino', active: false, fireClass: 'idle',      from: [] },
                { id: 'f3', label: '→ orchard · green · tree',   active: true,  fireClass: 'fire',      from: ['d3'] }
            ]
        },
        apple_tech: {
            desc: "The context is <b>buying</b>, so the <b>tech company</b> key matches and the fruit/orchard keys stay silent. That key's value raises the odds of tokens like “Mac”, “iPhone”, “stock”.",
            detectors: [
                { id: 'd1', label: 'Key: tech company?', active: true,  fireClass: 'fire-tech' },
                { id: 'd2', label: 'Key: edible fruit?', active: false, fireClass: 'idle' },
                { id: 'd3', label: 'Key: tree / orchard?', active: false, fireClass: 'idle' }
            ],
            facts: [
                { id: 'f1', label: '→ pie · juice · sugar',      active: false, fireClass: 'idle',      from: [] },
                { id: 'f2', label: '→ Mac · iPhone · stock',     active: true,  fireClass: 'fire-tech', from: ['d1'] },
                { id: 'f3', label: '→ orchard · green · tree',   active: false, fireClass: 'idle',      from: [] }
            ]
        }
    },

    currentScenario: null,

    setScenario: function(scenarioKey) {
        this.currentScenario = scenarioKey;

        // Toggle the active class on the buttons — the CSS handles every color
        const fruitBtn = document.getElementById('btn-ffn-fruit');
        const techBtn  = document.getElementById('btn-ffn-tech');
        if (fruitBtn) fruitBtn.classList.toggle('active-fruit', scenarioKey === 'apple_fruit');
        if (techBtn)  techBtn.classList.toggle('active-tech',  scenarioKey === 'apple_tech');

        this.render();
    },

    render: function() {
        if (!this.currentScenario) return;
        const data = this.scenarios[this.currentScenario];

        // 1. Detectors
        const detContainer = document.getElementById('ffn-detectors');
        detContainer.innerHTML = data.detectors.map(d => `
            <div id="node-${d.id}" class="ffn-pill ${d.fireClass}">
                ${d.label}
                <div class="ffn-sub">${d.active ? 'matches' : 'gated out'}</div>
            </div>
        `).join('');

        // 2. Facts
        const factsContainer = document.getElementById('ffn-facts');
        factsContainer.innerHTML = data.facts.map(f => `
            <div id="node-${f.id}" class="ffn-pill ${f.fireClass}">
                ${f.label}
            </div>
        `).join('');

        // 3. Explanation
        const expl = document.getElementById('ffn-explanation');
        if (expl) expl.innerHTML = data.desc;

        // 4. Lines (wait one frame for layout)
        setTimeout(() => this.drawLines(data), 50);
    },

    drawLines: function(data) {
        const svg = document.getElementById('ffn-lines');
        const container = document.getElementById('ffn-viz-container');
        if (!svg || !container) return;
        const cRect = container.getBoundingClientRect();
        svg.innerHTML = '';

        const isDark = isDarkMode();
        const activeColor = isDark ? '#f59e0b' : '#f59e0b';
        const idleColor   = isDark ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.55)';

        const drawCurve = (el1, el2, active) => {
            if (!el1 || !el2) return;
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();
            const x1 = r1.right  - cRect.left;
            const y1 = r1.top + r1.height / 2 - cRect.top;
            const x2 = r2.left   - cRect.left;
            const y2 = r2.top + r2.height / 2 - cRect.top;
            const cx1 = x1 + 40;
            const cx2 = x2 - 40;
            const color = active ? activeColor : idleColor;
            const width = active ? 2.5 : 1.2;
            const dash = active ? '' : 'stroke-dasharray="4 4"';
            svg.innerHTML += `<path d="M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="transparent" ${dash} />`;
        };

        const inputBox  = document.getElementById('ffn-input-box');
        const outputBox = document.getElementById('ffn-output-box');

        // Input → Detectors
        data.detectors.forEach(d => drawCurve(inputBox, document.getElementById(`node-${d.id}`), d.active));

        // Detectors → Facts → Output
        data.facts.forEach(f => {
            const factNode = document.getElementById(`node-${f.id}`);
            if (f.from.length) {
                f.from.forEach(srcId => drawCurve(document.getElementById(`node-${srcId}`), factNode, true));
            } else if (!f.active) {
                // Faint hint-line from any detector so the column doesn't look disconnected
                const anyDet = document.getElementById(`node-d2`);
                drawCurve(anyDet, factNode, false);
            }
            drawCurve(factNode, outputBox, f.active);
        });
    }
};

// ============================================================
// SIMPLIFIED ISOSURFACE ("truth tunnel")
// Ported from foam_of_meaning.js — same drawing, far less chrome:
// just the canvas, a "next word" readout and a temperature slider.
// ============================================================

const MnIsoViz = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    temperature: 0.8,
    step: 0,
    sentence: {
        tokens: ['The', 'capital', 'of', 'France', 'is', 'Paris', '.'],
        entropy: [0.95, 0.55, 0.20, 0.60, 0.15, 0.05, 0.10],
        path: [
            { x: 0.08, y: 0.50 },
            { x: 0.20, y: 0.42 },
            { x: 0.32, y: 0.38 },
            { x: 0.45, y: 0.35 },
            { x: 0.58, y: 0.32 },
            { x: 0.74, y: 0.30 },
            { x: 0.88, y: 0.32 }
        ],
        branches: [
            {
                atStep: 3,
                alternatives: [
                    { token: 'Germany', path: { x: 0.45, y: 0.55 }, entropy: 0.55 },
                    { token: 'Japan',   path: { x: 0.45, y: 0.22 }, entropy: 0.50 }
                ]
            },
            {
                atStep: 5,
                alternatives: [
                    { token: 'the', path: { x: 0.74, y: 0.40 }, entropy: 0.25 }
                ]
            }
        ]
    },

    init: function () {
        const canvas = document.getElementById('mn-iso-canvas');
        if (!canvas) return;
        this.canvas = canvas;

        const temp = document.getElementById('mn-iso-temp');
        if (temp) {
            this.temperature = parseFloat(temp.value) || 0.8;
            temp.addEventListener('input', () => {
                this.temperature = parseFloat(temp.value);
                this.render();
            });
        }

        const advance = document.getElementById('mn-iso-advance');
        if (advance) {
            advance.addEventListener('click', () => {
                this.step = (this.step + 1) % this.sentence.tokens.length;
                this.render();
            });
        }

        let rz;
        window.addEventListener('resize', () => {
            clearTimeout(rz);
            rz = setTimeout(() => { this.resize(); this.render(); }, 150);
        });

        this.resize();
        this.render();
    },

    resize: function () {
        const c = this.canvas;
        if (!c) return;
        const rect = c.getBoundingClientRect();
        if (rect.width < 10) return;
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        c.width = Math.round(rect.width * dpr);
        c.height = Math.round(rect.height * dpr);
        this.ctx = c.getContext('2d');
        if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    render: function () {
        const ctx = this.ctx;
        if (!ctx) return;
        const W = this.width, H = this.height;
        if (!W || !H) return;
        const sent = this.sentence;
        const step = Math.min(this.step, sent.tokens.length - 1);
        const temp = this.temperature;
        const baseWidth = 80;
        const toCanvas = p => ({ x: p.x * W, y: p.y * H });

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(51,65,85,0.3)';
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
        for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

        // Faint guide of the whole path
        ctx.beginPath();
        sent.path.forEach((p, i) => { const q = toCanvas(p); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
        ctx.strokeStyle = 'rgba(96,165,250,0.10)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Isosurface envelope for completed steps
        if (step >= 1) {
            const upper = [], lower = [];
            for (let i = 0; i <= step; i++) {
                const q = toCanvas(sent.path[i]);
                const env = sent.entropy[i] * temp * baseWidth;
                let dx = 0, dy = -1;
                if (i < sent.path.length - 1) {
                    const n = toCanvas(sent.path[i + 1]);
                    const tx = n.x - q.x, ty = n.y - q.y, len = Math.hypot(tx, ty);
                    if (len > 0) { dx = -ty / len; dy = tx / len; }
                } else if (i > 0) {
                    const p = toCanvas(sent.path[i - 1]);
                    const tx = q.x - p.x, ty = q.y - p.y, len = Math.hypot(tx, ty);
                    if (len > 0) { dx = -ty / len; dy = tx / len; }
                }
                upper.push({ x: q.x + dx * env, y: q.y + dy * env });
                lower.push({ x: q.x - dx * env, y: q.y - dy * env });
            }

            for (let layer = 3; layer >= 0; layer--) {
                const scale = 1 + layer * 0.3;
                const alpha = 0.03 + (3 - layer) * 0.03;
                ctx.beginPath();
                upper.forEach((p, i) => {
                    const q = toCanvas(sent.path[i]);
                    const x = q.x + (p.x - q.x) * scale, y = q.y + (p.y - q.y) * scale;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                for (let i = lower.length - 1; i >= 0; i--) {
                    const q = toCanvas(sent.path[i]);
                    const p = lower[i];
                    ctx.lineTo(q.x + (p.x - q.x) * scale, q.y + (p.y - q.y) * scale);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(139,92,246,' + alpha + ')';
                ctx.fill();
            }

            ctx.beginPath();
            upper.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i].x, lower[i].y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(139,92,246,0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(139,92,246,0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Branches (forks) at visible steps
        sent.branches.forEach(branch => {
            if (step < branch.atStep) return;
            const origin = toCanvas(sent.path[branch.atStep]);
            branch.alternatives.forEach(alt => {
                const target = toCanvas(alt.path);
                const env = Math.max(6, alt.entropy * temp * baseWidth * 0.6);
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = 'rgba(251,191,36,0.3)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.arc(target.x, target.y, env, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251,191,36,0.06)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(251,191,36,0.25)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.font = '11px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(251,191,36,0.75)';
                ctx.fillText(alt.token, target.x, target.y - env - 6);
                ctx.beginPath();
                ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
            });
        });

        // Main trajectory
        if (step >= 1) {
            ctx.beginPath();
            for (let i = 0; i <= step; i++) { const q = toCanvas(sent.path[i]); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(96,165,250,0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // Token nodes up to the current step
        for (let i = 0; i <= step; i++) {
            const q = toCanvas(sent.path[i]);
            const entropy = sent.entropy[i];
            const radius = 5 + entropy * temp * 4;
            ctx.beginPath();
            ctx.arc(q.x, q.y, radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(96,165,250,' + (0.1 + entropy * 0.1) + ')';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(q.x, q.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'hsl(' + (220 - entropy * 180) + ',80%,60%)';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font = 'bold 12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f1f5f9';
            ctx.fillText(sent.tokens[i], q.x, q.y - radius - 8);
        }

        // Future tokens (faint)
        for (let i = step + 1; i < sent.tokens.length; i++) {
            const q = toCanvas(sent.path[i]);
            ctx.beginPath();
            ctx.arc(q.x, q.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(148,163,184,0.15)';
            ctx.fill();
            ctx.font = '10px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(148,163,184,0.18)';
            ctx.fillText(sent.tokens[i], q.x, q.y - 10);
        }

        // Certainty bar
        const barX = W - 50, barY = 40, barW = 16, barH = H - 80;
        if (barH > 40) {
            ctx.fillStyle = 'rgba(30,41,59,0.8)';
            ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
            ctx.strokeStyle = 'rgba(71,85,105,0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX - 4, barY - 4, barW + 8, barH + 8);
            const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
            grad.addColorStop(0, '#3b82f6');
            grad.addColorStop(0.5, '#8b5cf6');
            grad.addColorStop(1, '#f59e0b');
            ctx.fillStyle = grad;
            ctx.fillRect(barX, barY, barW, barH);
            const eff = Math.min(1, sent.entropy[step] * temp);
            const markerY = barY + (1 - eff) * barH;
            ctx.beginPath();
            ctx.moveTo(barX - 8, markerY);
            ctx.lineTo(barX, markerY - 4);
            ctx.lineTo(barX, markerY + 4);
            ctx.closePath();
            ctx.fillStyle = '#f1f5f9';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(barX, markerY);
            ctx.lineTo(barX + barW, markerY);
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = '9px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('certain', barX + barW / 2, barY - 8);
            ctx.fillText('open', barX + barW / 2, barY + barH + 14);
            ctx.font = 'bold 10px system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#f1f5f9';
            ctx.fillText('H=' + eff.toFixed(2), barX + barW + 6, markerY + 4);
        }

        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(148,163,184,0.65)';
        ctx.fillText('T = ' + temp.toFixed(2), 12, 20);

        this.updateSide();
    },

    updateSide: function () {
        const sent = this.sentence;
        const step = Math.min(this.step, sent.tokens.length - 1);
        const nextEl = document.getElementById('mn-iso-next');
        const metaEl = document.getElementById('mn-iso-meta');
        const tempVal = document.getElementById('mn-iso-temp-val');
        if (tempVal) tempVal.textContent = this.temperature.toFixed(2);
        if (!nextEl || !metaEl) return;

        const isEnd = step >= sent.tokens.length - 1;
        const nextWord = isEnd ? '|endoftext|' : sent.tokens[step + 1];
        const entropy = isEnd ? 0.02 : sent.entropy[step + 1];
        const eff = Math.min(1, entropy * this.temperature);
        nextEl.textContent = nextWord;
        nextEl.classList.toggle('is-end', isEnd);

        let label = 'near-certain', cls = 'is-certain';
        if (!isEnd) {
            if (eff >= 0.6) { label = 'wide open'; cls = 'is-wide'; }
            else if (eff >= 0.35) { label = 'open'; cls = 'is-open'; }
            else if (eff >= 0.12) { label = 'likely'; cls = 'is-likely'; }
        }

        metaEl.innerHTML = '';
        const badge = document.createElement('span');
        badge.className = 'mn-iso-conf ' + cls;
        badge.textContent = label;
        metaEl.appendChild(badge);
        const line = document.createElement('div');
        line.style.marginTop = '.55em';
        line.innerHTML = 'tunnel width <b>' + eff.toFixed(2) + '</b>';
        metaEl.appendChild(line);
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

    // Autoregressive loop
    _lazyRegister('autoregressive-viz', () => {
        AutoregressiveViz.render();
    });

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

    // Step 2: Embedding (lndw-style Power/Gender demo)
    _lazyRegister('embedding-viz-plot', () => {
        EmbeddingViz.init();
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

    // Step 4a: Attention (bank/river/money stepper)
    _lazyRegister('transformer-plot', () => {
        AttentionDemo.bind();
        AttentionDemo.render();
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

    // Step 5b: simplified truth-tunnel isosurface
    _lazyRegister('mn-iso-canvas', () => {
        MnIsoViz.init();
    });

    // The meadow of words: Voronoi cells over a finite vocabulary
    _lazyRegister('word-meadow-wrap', () => {
        WordMeadowViz.init();
    });

    // Start observing everything
    _lazyCreateObserver();

    // Re-render every initialised section when the user toggles dark/light mode
    // so that themeColor() picks up the new palette on the next call.
    if (window.__MN_DARK) {
        window.__MN_DARK.onChange(() => {
            _lazyInitRegistry.forEach(r => { if (r.initialized) { try { r.initFn(); } catch (e) { /* ignore */ } } });
        });
    }
}

// ============================================================
// THE MEADOW OF WORDS - a Voronoi field over a finite vocabulary
// Ends intuition.php. Every word is a pin; every thought falls
// into the cell of the nearest pin. Works in 1-D or 2-D (and the
// same construction, with hyperplane walls, in any dimension).
// ============================================================

const WordMeadowViz = (() => {
	const WORDS = ["Dog", "Cat", "Tree", "House", "Car", "Book", "Mouse", "Lamp", "Flower", "Stone", "Table", "Chair", "Water", "Fire", "Night", "Sun", "Rain", "Moon", "Coffee", "Star", "River", "Mountain", "Bird", "Fish", "Milk", "Sugar", "Door", "Window", "Bridge", "Field", "Kitchen", "Garden", "Ship", "Clock", "Road", "City", "Bread", "Apple", "Tea", "Hat", "Bell"];
	const HUES = [188, 220, 260, 290, 320, 350, 15, 40, 60, 90, 140, 170, 200, 240, 280, 310, 340, 25, 50, 75, 120, 155, 195, 230, 270, 300, 330, 10, 45, 100, 160, 210, 250, 295, 335, 20, 65, 130, 185, 245, 305];

	const CW = 560;
	const CH = 392;
	const DISPLAY_H = 460;
	const N_CHECKPOINTS = [12, 18, 24, 30];
	const N_ANIM_DUR = 1800;
	const T_ANIM_DUR = 1100;
	const PTR_ANIM_DUR = 800;
	const STEP_HOLD = 2600;
	const ROWS_PER_FRAME = 14;
	const LAST_STEP = 5;

	const CAPTIONS = [
		'Every point of the meadow is a possible <b>in-between thought</b>. The words sit in the field like pins &mdash; and <b>the nearest pin wins</b>.',
		'A clear thought sits deep inside one cell, far from every seam. The next word wins here <b>with a wide lead</b> &mdash; the winning chance is high.',
		'Now the thought lies on a <b>golden seam</b>: two words are almost equally close. It still falls into a cell, but barely &mdash; <b>no word fits exactly</b>.',
		'More words &rarr; smaller cells and thinner bands. But the <b>share</b> of the ambiguous zone never reaches zero: between any two words there is always a seam.',
		'<b>Temperature</b> sets how open the draw is: <b>low</b> &rarr; almost always the same word &middot; <b>high</b> &rarr; many words get a real chance (the circle shows the reach).',
		'These seams are the <b>expressibility gap</b>: the loss has a lower bound that no larger dictionary removes.'
	];

	let cv, sN, sT, rN, rT, rWord, rCell, rProb, rRunner, rEdge, rGap, captionEl, playBtn, prevBtn, nextBtn;
	let inited = false;
	let running = false;
	let rafId = null;

	let currentN = 12;
	let T = 0.8;
	let dim = 2;
	let gapFrac = 0;
	let anchors = [];
	let fieldCache = {};
	let precompQueue = [];
	let precomp = null;

	let step = 0;
	let autoPlay = true;
	let stepStart = 0;
	let lastAnimDur = 0;
	let tweens = [];

	let pointer = null;
	let scriptTarget = null;
	let realActive = false;
	let realPos = null;

	const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

	function mulberry32(a) {
		return function () {
			a |= 0; a = a + 0x6D2B79F5 | 0;
			let t = Math.imul(a ^ a >>> 15, 1 | a);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	}

	function hsl(h, s, l) {
		s /= 100; l /= 100;
		const k = n => (n + h / 30) % 12;
		const a = s * Math.min(l, 1 - l);
		const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
	}

	function smoothstep(a, b, t) {
		if (a === b) return t < a ? 0 : 1;
		t = clamp((t - a) / (b - a), 0, 1);
		return t * t * (3 - 2 * t);
	}

	function mix(c1, c2, t) {
		return [
			Math.round(c1[0] + (c2[0] - c1[0]) * t),
			Math.round(c1[1] + (c2[1] - c1[1]) * t),
			Math.round(c1[2] + (c2[2] - c1[2]) * t)
		];
	}

	function palette() {
		const api = window.__MN_DARK;
		const dark = api ? api.isDark() : false;
		const v = (name, fallback) => {
			const x = typeof cssVar === 'function' ? cssVar(name) : '';
			return x || fallback;
		};
		return {
			dark: dark,
			surface: v('--mn-surface', dark ? '#1e293b' : '#FDFAF1'),
			text: v('--mn-text', dark ? '#cbd5e1' : '#3A2F25'),
			muted: v('--mn-text-muted', dark ? '#64748b' : '#8C7E68'),
			border: v('--mn-border', dark ? '#334155' : '#D8CFB6'),
			accent: v('--mn-accent', '#6366f1'),
			edge: dark ? [148, 163, 184] : [71, 85, 105],
			gold: dark ? [245, 158, 11] : [180, 83, 9],
			thought: dark ? '#2dd4bf' : '#0f766e',
			thoughtFill: dark ? 'rgba(45,212,191,.14)' : 'rgba(15,118,110,.08)',
			ink: dark ? '#e2e8f0' : '#28303c'
		};
	}

	function gen2D(n) {
		const rng = mulberry32(7 + n * 13);
		const cols = Math.ceil(Math.sqrt(n * CW / CH));
		const rows = Math.ceil(n / cols);
		const pts = [];
		for (let i = 0; i < n; i++) {
			const cx = (i % cols);
			const cy = Math.floor(i / cols);
			const jx = (rng() - 0.5) * 0.72;
			const jy = (rng() - 0.5) * 0.72;
			pts.push({
				x: clamp((cx + 0.3 + jx) / cols * CW, 24, CW - 24),
				y: clamp((cy + 0.3 + jy) / rows * CH, 24, CH - 24),
				w: WORDS[i % WORDS.length],
				c: HUES[i % HUES.length]
			});
		}
		return pts;
	}

	function gen1D(n) {
		const rng = mulberry32(11 + n * 17);
		const pts = [];
		const span = CW - 56;
		for (let i = 0; i < n; i++) {
			const base = 28 + (i + 0.5) / n * span;
			const jitter = (rng() - 0.5) * (span / n) * 0.4;
			pts.push({
				x: clamp(base + jitter, 22, CW - 22),
				y: CH / 2,
				w: WORDS[i % WORDS.length],
				c: HUES[i % HUES.length]
			});
		}
		pts.sort((a, b) => a.x - b.x);
		return pts;
	}

	function genFor(n) {
		return dim === 1 ? gen1D(n) : gen2D(n);
	}

	function scaleFor(a) {
		if (dim === 1) {
			const spacing = (CW - 56) / Math.max(1, a.length);
			return Math.max(12, spacing * 0.62);
		}
		return Math.sqrt(CW * CH / Math.max(1, a.length)) * 0.52;
	}

	function distTo(a, x, y) {
		return dim === 1 ? Math.abs(x - a.x) : Math.hypot(x - a.x, y - a.y);
	}

	function nearestTwo(x, y, a) {
		let d1 = 1e9, d2 = 1e9, i1 = 0;
		for (let i = 0; i < a.length; i++) {
			const d = distTo(a[i], x, y);
			if (d < d1) { d2 = d1; i1 = i; d1 = d; }
			else if (d < d2) { d2 = d; }
		}
		return { i1: i1, d1: d1, d2: d2, m: d2 - d1 };
	}

	function colorFor(m, idx, pal, scale, arr) {
		const q = clamp(m / scale, 0, 1);
		let col = hsl(arr[idx].c, 34 + 16 * q, pal.dark ? 28 + 16 * q : 64 + 16 * q);
		const eps = 0.32 * scale;
		const edgePx = 2.4;
		if (m < eps) col = mix(col, pal.gold, 0.55 * (1 - smoothstep(edgePx, eps, m)));
		if (m < edgePx) col = mix(pal.edge, col, smoothstep(0, edgePx * 0.75, m));
		return col;
	}

	function computeRows(a, imgData, y0, y1, pal, scale) {
		let cnt = 0;
		const eps = 0.32 * scale;
		for (let y = y0; y < y1; y++) {
			for (let x = 0; x < CW; x++) {
				const n2 = nearestTwo(x, y, a);
				const col = colorFor(n2.m, n2.i1, pal, scale, a);
				const p = (y * CW + x) * 4;
				imgData.data[p] = col[0];
				imgData.data[p + 1] = col[1];
				imgData.data[p + 2] = col[2];
				imgData.data[p + 3] = 255;
				if (n2.m < eps) cnt++;
			}
		}
		return cnt;
	}

	function makeFieldSync(n, pal) {
		const a = gen2D(n);
		const scale = scaleFor(a);
		const c = document.createElement('canvas');
		c.width = CW; c.height = CH;
		const cctx = c.getContext('2d');
		const imgData = cctx.createImageData(CW, CH);
		const cnt = computeRows(a, imgData, 0, CH, pal, scale);
		cctx.putImageData(imgData, 0, 0);
		return { canvas: c, gapFrac: cnt / (CW * CH) };
	}

	function fieldKey(n, pal) {
		return n + '|' + (pal.dark ? 'd' : 'l');
	}

	function ensureField(n, pal) {
		const key = fieldKey(n, pal);
		if (!fieldCache[key]) fieldCache[key] = makeFieldSync(n, pal);
		return fieldCache[key];
	}

	function queuePrecompute(pal) {
		if (dim !== 2) return;
		const key = fieldKey(currentN, pal);
		for (let i = 0; i < N_CHECKPOINTS.length; i++) {
			const n = N_CHECKPOINTS[i];
			if (fieldCache[fieldKey(n, pal)]) continue;
			if (precomp && precomp.N === n) continue;
			if (n === currentN && fieldCache[key]) continue;
			if (precompQueue.indexOf(n) === -1) precompQueue.push(n);
		}
	}

	function stepPrecompute() {
		if (dim !== 2) { precomp = null; precompQueue = []; return; }
		const pal = palette();
		if (precomp && precomp.dark !== pal.dark) { precomp = null; precompQueue = []; fieldCache = {}; }
		if (precomp) {
			const endRow = Math.min(CH, precomp.row + ROWS_PER_FRAME);
			precomp.cnt += computeRows(precomp.anchors, precomp.imgData, precomp.row, endRow, pal, precomp.scale);
			precomp.row = endRow;
			if (precomp.row >= CH) {
				precomp.ctx.putImageData(precomp.imgData, 0, 0);
				fieldCache[fieldKey(precomp.N, pal)] = { canvas: precomp.canvas, gapFrac: precomp.cnt / (CW * CH) };
				if (precomp.N === currentN) gapFrac = fieldCache[fieldKey(precomp.N, pal)].gapFrac;
				precomp = null;
			}
			return;
		}
		if (precompQueue.length) {
			const n = precompQueue.shift();
			if (fieldCache[fieldKey(n, pal)]) return;
			const a = gen2D(n);
			const c = document.createElement('canvas');
			c.width = CW; c.height = CH;
			const cctx = c.getContext('2d');
			const imgData = cctx.createImageData(CW, CH);
			precomp = {
				N: n, canvas: c, ctx: cctx, imgData: imgData,
				anchors: a, scale: scaleFor(a), dark: pal.dark, row: 0, cnt: 0
			};
		}
	}

	function gapOf1D(a) {
		if (!a.length) return 0;
		const scale = scaleFor(a);
		const eps = 0.32 * scale;
		let cnt = 0;
		for (let x = 0; x < CW; x++) {
			if (nearestTwo(x, CH / 2, a).m < eps) cnt++;
		}
		return cnt / CW;
	}

	function setN(n) {
		currentN = n;
		anchors = genFor(n);
		const pal = palette();
		if (dim === 2) {
			gapFrac = ensureField(n, pal).gapFrac;
		} else {
			gapFrac = gapOf1D(anchors);
		}
	}

	function setT(t) {
		T = t;
		if (sT) sT.value = Math.round(t * 100);
		if (rT) rT.textContent = t.toFixed(2);
	}

	function findPoint2D(a, mode) {
		let best = null;
		let bestM = mode === 'clear' ? -1 : 1e9;
		const GX = 16, GY = 11, M = 30;
		for (let gy = 0; gy < GY; gy++) {
			for (let gx = 0; gx < GX; gx++) {
				const x = M + (gx + 0.5) / GX * (CW - 2 * M);
				const y = M + (gy + 0.5) / GY * (CH - 2 * M);
				const m = nearestTwo(x, y, a).m;
				if (mode === 'clear' ? m > bestM : m < bestM) { bestM = m; best = { x: x, y: y }; }
			}
		}
		for (let dy = -8; dy <= 8; dy += 2) {
			for (let dx = -8; dx <= 8; dx += 2) {
				const x = best.x + dx, y = best.y + dy;
				if (x < 20 || y < 20 || x > CW - 20 || y > CH - 20) continue;
				const m = nearestTwo(x, y, a).m;
				if (mode === 'clear' ? m > bestM : m < bestM) { bestM = m; best = { x: x, y: y }; }
			}
		}
		return best;
	}

	function findPoint1D(a, mode) {
		const sorted = a.slice().sort((p, q) => p.x - q.x);
		let bestX = CW / 2;
		let bestScore = mode === 'clear' ? -1 : 1e9;
		for (let i = 0; i < sorted.length - 1; i++) {
			const mid = (sorted[i].x + sorted[i + 1].x) / 2;
			const gap = sorted[i + 1].x - sorted[i].x;
			const score = mode === 'clear' ? gap : Math.abs(mid - CW / 2);
			if (mode === 'clear' ? score > bestScore : score < bestScore) {
				bestScore = score;
				bestX = mid;
			}
		}
		return { x: bestX, y: CH / 2 };
	}

	function findPoint(a, mode) {
		return dim === 1 ? findPoint1D(a, mode) : findPoint2D(a, mode);
	}

	function targetFor(k) {
		switch (k) {
			case 0: return { N: 12, T: 0.8, pointer: null };
			case 1: return { N: 12, T: 0.8, pointer: findPoint(genFor(12), 'clear') };
			case 2: return { N: 12, T: 0.8, pointer: findPoint(genFor(12), 'boundary') };
			case 3: return { N: 30, T: 0.8, pointer: 'keep' };
			case 4: return { N: 30, T: 2.6, pointer: findPoint(genFor(30), 'boundary') };
			case 5: return { N: 30, T: 0.8, pointer: 'keep' };
		}
		return { N: 12, T: 0.8, pointer: null };
	}

	function addTween(tw) { tw.t0 = performance.now(); tweens.push(tw); }

	function removeTweens(tag) {
		for (let i = tweens.length - 1; i >= 0; i--) {
			if (tweens[i].tag === tag) tweens.splice(i, 1);
		}
	}

	function updateTweens(now) {
		let active = false;
		for (let i = tweens.length - 1; i >= 0; i--) {
			const tw = tweens[i];
			let u = (now - tw.t0) / tw.dur;
			if (u >= 1) u = 1;
			const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
			tw.onUpdate(tw.from + (tw.to - tw.from) * e, e);
			if (u >= 1) {
				tweens.splice(i, 1);
				if (tw.onDone) tw.onDone();
			} else {
				active = true;
			}
		}
		return active;
	}

	function checkpointAt(f) {
		let best = N_CHECKPOINTS[0];
		for (let i = 0; i < N_CHECKPOINTS.length; i++) {
			if (N_CHECKPOINTS[i] <= f) best = N_CHECKPOINTS[i];
		}
		return best;
	}

	function aimPointer(target) {
		scriptTarget = target;
		removeTweens('ptr');
		const from = pointer ? { x: pointer.x, y: pointer.y } : { x: CW / 2, y: CH / 2 };
		addTween({
			tag: 'ptr', dur: PTR_ANIM_DUR, from: 0, to: 1,
			onUpdate: u => {
				pointer = {
					x: from.x + (target.x - from.x) * u,
					y: from.y + (target.y - from.y) * u
				};
			}
		});
	}

	function stepPointerTarget() {
		if (step === 0) return null;
		const t = targetFor(step);
		if (!t.pointer || t.pointer === 'keep') return null;
		return t.pointer;
	}

	function setPills(k) {
		document.querySelectorAll('#word-meadow-wrap .wm-step').forEach(el => {
			el.classList.toggle('is-active', +el.getAttribute('data-wstep') === k);
		});
	}

	function setCaption(k) {
		if (captionEl) captionEl.innerHTML = CAPTIONS[k] || '';
	}

	function updateNav() {
		if (prevBtn) prevBtn.disabled = step <= 0;
		if (nextBtn) nextBtn.disabled = step >= LAST_STEP;
		if (playBtn) playBtn.textContent = autoPlay ? 'Pause' : (step >= LAST_STEP ? 'Replay' : 'Play');
	}

	function animateToStep(k) {
		step = k;
		setCaption(k);
		setPills(k);
		const t = targetFor(k);
		let maxDur = 0;
		if (t.N !== currentN) {
			removeTweens('n');
			const from = currentN;
			maxDur = Math.max(maxDur, N_ANIM_DUR);
			addTween({
				tag: 'n', dur: N_ANIM_DUR, from: from, to: t.N,
				onUpdate: v => {
					if (sN) sN.value = Math.round(v);
					if (rN) rN.textContent = Math.round(v);
					const cf = checkpointAt(v);
					if (cf !== currentN) setN(cf);
				},
				onDone: () => {
					if (sN) sN.value = t.N;
					if (rN) rN.textContent = t.N;
					if (currentN !== t.N) setN(t.N);
				}
			});
		}
		if (Math.abs(t.T - T) > 1e-6) {
			removeTweens('t');
			const from = T;
			maxDur = Math.max(maxDur, T_ANIM_DUR);
			addTween({ tag: 't', dur: T_ANIM_DUR, from: from, to: t.T, onUpdate: v => setT(v) });
		}
		if (t.pointer && t.pointer !== 'keep') {
			aimPointer(t.pointer);
			maxDur = Math.max(maxDur, PTR_ANIM_DUR);
		} else if (t.pointer === null) {
			removeTweens('ptr');
			pointer = null;
			scriptTarget = null;
		}
		lastAnimDur = maxDur;
		stepStart = performance.now();
		if (k >= LAST_STEP) autoPlay = false;
		updateNav();
		draw();
	}

	function applyStepInstant(k) {
		step = k;
		setCaption(k);
		setPills(k);
		removeTweens('n');
		removeTweens('t');
		removeTweens('ptr');
		const t = targetFor(k);
		if (sN) sN.value = t.N;
		if (rN) rN.textContent = t.N;
		setN(t.N);
		setT(t.T);
		if (t.pointer === null) {
			pointer = null;
			scriptTarget = null;
		} else if (t.pointer !== 'keep') {
			pointer = { x: t.pointer.x, y: t.pointer.y };
			scriptTarget = { x: t.pointer.x, y: t.pointer.y };
		}
		if (k >= LAST_STEP) autoPlay = false;
		updateNav();
		draw();
	}

	function drawCursor(c, x, y) {
		c.save();
		c.translate(x, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(0, 16);
		c.lineTo(3.8, 12.4);
		c.lineTo(6.6, 18.4);
		c.lineTo(9.2, 17.2);
		c.lineTo(6.4, 11.4);
		c.lineTo(11.6, 11);
		c.closePath();
		c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 4; c.shadowOffsetY = 1;
		c.fillStyle = 'rgba(255,255,255,.95)';
		c.fill();
		c.shadowColor = 'transparent';
		c.strokeStyle = 'rgba(30,41,59,.75)'; c.lineWidth = 1.2; c.stroke();
		c.restore();
	}

	function drawWordPins(c, sx, sy, pal, showLabels) {
		for (let i = 0; i < anchors.length; i++) {
			const a = anchors[i];
			const ax = a.x * sx;
			const ay = (dim === 1 ? CH / 2 : a.y) * sy;
			c.save();
			c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 6; c.shadowOffsetY = 1;
			c.beginPath(); c.arc(ax, ay, 6, 0, Math.PI * 2);
			c.fillStyle = pal.surface; c.fill();
			c.restore();
			c.beginPath(); c.arc(ax, ay, 6, 0, Math.PI * 2);
			c.strokeStyle = pal.ink; c.globalAlpha = 0.55; c.lineWidth = 1.5; c.stroke();
			c.globalAlpha = 1;
			if (showLabels) {
				c.font = '600 11px system-ui';
				c.textAlign = 'center'; c.textBaseline = 'top';
				const ly = ay + 11;
				const tw = c.measureText(a.w).width;
				c.globalAlpha = 0.86;
				c.fillStyle = pal.surface;
				c.fillRect(ax - tw / 2 - 4, ly - 2, tw + 8, 16);
				c.globalAlpha = 1;
				c.fillStyle = pal.ink;
				c.fillText(a.w, ax, ly + 1);
			}
		}
	}

	function draw2D(c, w, pal) {
		const f = ensureField(currentN, pal);
		gapFrac = f.gapFrac;
		c.imageSmoothingEnabled = true;
		c.imageSmoothingQuality = 'high';
		c.drawImage(f.canvas, 0, 0, w, DISPLAY_H);
		drawWordPins(c, w / CW, DISPLAY_H / CH, pal, currentN <= 20);
	}

	function draw1D(c, w, pal) {
		const bandTop = DISPLAY_H * 0.17;
		const bandH = DISPLAY_H * 0.66;
		const scale = scaleFor(anchors);
		const eps = 0.32 * scale;
		c.fillStyle = pal.surface;
		c.fillRect(0, 0, w, DISPLAY_H);

		let cnt = 0;
		for (let sx = 0; sx < w; sx++) {
			const x = (sx + 0.5) / w * CW;
			const n2 = nearestTwo(x, CH / 2, anchors);
			const col = colorFor(n2.m, n2.i1, pal, scale, anchors);
			if (n2.m < eps) cnt++;
			c.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
			c.fillRect(sx, bandTop, 1, bandH);
		}
		gapFrac = cnt / Math.max(1, w);

		c.strokeStyle = 'rgb(' + pal.edge[0] + ',' + pal.edge[1] + ',' + pal.edge[2] + ')';
		c.globalAlpha = 0.75;
		c.lineWidth = 1.3;
		for (let i = 0; i < anchors.length - 1; i++) {
			const mid = (anchors[i].x + anchors[i + 1].x) / 2;
			const mx = mid / CW * w;
			c.beginPath();
			c.moveTo(mx, bandTop);
			c.lineTo(mx, bandTop + bandH);
			c.stroke();
		}
		c.globalAlpha = 1;

		const mid = CH / 2;
		c.strokeStyle = pal.border;
		c.lineWidth = 1;
		c.beginPath();
		c.moveTo(0, mid / CH * DISPLAY_H);
		c.lineTo(w, mid / CH * DISPLAY_H);
		c.stroke();

		drawWordPins(c, w / CW, DISPLAY_H / CH, pal, anchors.length <= 20);
	}

	function drawThought(c, P, w, pal) {
		const scale = scaleFor(anchors);
		const px = clamp(P.x, 0, CW - 1);
		const py = dim === 1 ? CH / 2 : clamp(P.y, 0, CH - 1);
		const mx = px * w / CW;
		const my = py * DISPLAY_H / CH;
		const radiusPx = T * scale * 1.2 * (w / CW);

		c.beginPath();
		if (dim === 1) {
			const rx = T * scale * 1.2 / CW * w;
			c.moveTo(mx - rx, my);
			c.lineTo(mx + rx, my);
			c.strokeStyle = pal.thought;
			c.globalAlpha = 0.55; c.lineWidth = 2; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
			c.globalAlpha = 1;
			c.fillStyle = pal.thoughtFill;
			c.fillRect(mx - rx, DISPLAY_H * 0.17, rx * 2, DISPLAY_H * 0.66);
		} else {
			c.arc(mx, my, radiusPx, 0, Math.PI * 2);
			c.strokeStyle = pal.thought;
			c.globalAlpha = 0.55; c.lineWidth = 2; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
			c.globalAlpha = 1;
			c.fillStyle = pal.thoughtFill; c.fill();
		}

		const allD = [];
		for (let i = 0; i < anchors.length; i++) {
			allD.push({ i: i, d: distTo(anchors[i], px, py) });
		}
		allD.sort((a, b) => a.d - b.d);
		const near = allD.slice(0, Math.min(5, allD.length));
		const sigma = Math.max(1e-6, T * scale * 0.5);
		const scores = near.map(cd => ({ i: cd.i, d: cd.d, s: Math.exp(-cd.d / sigma) }));
		let sum = 0;
		for (let j = 0; j < scores.length; j++) sum += scores[j].s;
		if (!sum) sum = 1;

		const panelW = 178;
		const rowH = 24;
		const panelH = near.length * rowH + 22;
		const right = mx + radiusPx + 16;
		const panelX = (right + panelW > w - 8)
			? clamp(mx - radiusPx - panelW - 16, 4, w - panelW - 8)
			: clamp(right, 4, w - panelW - 8);
		const panelY = clamp(my - panelH / 2, 8, DISPLAY_H - panelH - 8);

		c.globalAlpha = 0.96;
		c.fillStyle = pal.surface;
		c.beginPath(); c.roundRect(panelX, panelY, panelW, panelH, 10); c.fill();
		c.globalAlpha = 1;
		c.strokeStyle = pal.border; c.lineWidth = 1; c.stroke();

		c.font = '700 10px system-ui';
		c.fillStyle = pal.muted;
		c.textAlign = 'left'; c.textBaseline = 'middle';
		c.fillText('CHANCES', panelX + 10, panelY + 11);

		const barX = panelX + 68;
		const barMax = panelW - 68 - 44;
		for (let j = 0; j < scores.length; j++) {
			const cd = scores[j];
			const prob = cd.s / sum;
			const rowY = panelY + 26 + j * rowH;
			c.font = (j === 0 ? '700' : '400') + ' 12px system-ui';
			c.fillStyle = j === 0 ? pal.thought : pal.text;
			c.textAlign = 'left';
			c.fillText(anchors[cd.i].w, panelX + 10, rowY);
			const bw = Math.max(3, prob * barMax);
			c.fillStyle = pal.border;
			c.beginPath(); c.roundRect(barX, rowY - 5, barMax, 10, 5); c.fill();
			c.fillStyle = j === 0 ? pal.thought : pal.muted;
			c.globalAlpha = j === 0 ? 1 : 0.5;
			c.beginPath(); c.roundRect(barX, rowY - 5, bw, 10, 5); c.fill();
			c.globalAlpha = 1;
			c.font = '600 10px monospace';
			c.fillStyle = j === 0 ? pal.thought : pal.muted;
			c.textAlign = 'right';
			c.fillText(Math.round(prob * 100) + '%', panelX + panelW - 8, rowY);
		}

		c.beginPath(); c.arc(mx, my, 7, 0, Math.PI * 2);
		c.fillStyle = pal.surface; c.fill();
		c.strokeStyle = pal.thought; c.lineWidth = 2.5; c.stroke();

		if (!realActive) drawCursor(c, mx, my);

		const winner = scores[0];
		const runner = scores[1];
		const seamGap = near.length > 1 ? near[1].d - near[0].d : 0;
		if (winner) {
			if (rWord) rWord.textContent = anchors[winner.i].w;
			if (rCell) rCell.textContent = 'cell ' + (winner.i + 1) + ' of ' + anchors.length + ' - nearest pin wins';
			if (rProb) rProb.textContent = Math.round(winner.s / sum * 100) + '%';
			if (rRunner) rRunner.textContent = runner ? 'runner-up: ' + anchors[runner.i].w + ' - ' + Math.round(runner.s / sum * 100) + '%' : 'runner-up: -';
			if (rEdge) rEdge.textContent = (seamGap / scale).toFixed(2);
			if (rGap) rGap.textContent = 'ambiguous zone: ' + Math.round(gapFrac * 100) + '% of the field';
		}
	}

	function clearReadouts() {
		if (rWord) rWord.textContent = '-';
		if (rCell) rCell.textContent = 'move the pointer across the field';
		if (rProb) rProb.textContent = '-';
		if (rRunner) rRunner.textContent = 'runner-up: -';
		if (rEdge) rEdge.textContent = '-';
		if (rGap) rGap.textContent = 'ambiguous zone: ' + Math.round(gapFrac * 100) + '% of the field';
	}

	function draw() {
		if (!cv || !cv.clientWidth) return;
		const w = cv.clientWidth;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const W = Math.round(w * dpr);
		const H = Math.round(DISPLAY_H * dpr);
		if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
		const c = cv.getContext('2d');
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.clearRect(0, 0, w, DISPLAY_H);
		const pal = palette();
		if (dim === 1) draw1D(c, w, pal);
		else draw2D(c, w, pal);
		const P = realActive ? realPos : pointer;
		if (P) drawThought(c, P, w, pal);
		else clearReadouts();
	}

	function loop() {
		if (!running) { rafId = null; return; }
		rafId = requestAnimationFrame(loop);
		const now = performance.now();
		stepPrecompute();
		const animating = updateTweens(now);
		if (autoPlay && step < LAST_STEP && now - stepStart > lastAnimDur + STEP_HOLD) {
			animateToStep(step + 1);
		}
		if (animating) draw();
	}

	function startLoop() {
		if (rafId == null) rafId = requestAnimationFrame(loop);
	}

	function stopLoop() {
		if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
	}

	function setDim(k) {
		if (dim === k) return;
		dim = k;
		document.querySelectorAll('#word-meadow-wrap .wm-dim-btn').forEach(el => {
			el.classList.toggle('is-active', +el.getAttribute('data-wdim') === k);
		});
		removeTweens('n');
		anchors = genFor(currentN);
		if (dim === 2) {
			gapFrac = ensureField(currentN, palette()).gapFrac;
			queuePrecompute(palette());
		} else {
			gapFrac = gapOf1D(anchors);
			precomp = null;
			precompQueue = [];
		}
		draw();
	}

	function bindEvents() {
		sN.addEventListener('input', () => {
			removeTweens('n');
			autoPlay = false;
			updateNav();
			const n = +sN.value;
			if (rN) rN.textContent = n;
			if (n !== currentN) setN(n);
			draw();
		});
		sT.addEventListener('input', () => {
			removeTweens('t');
			autoPlay = false;
			updateNav();
			setT(+sT.value / 100);
			draw();
		});
		cv.addEventListener('pointermove', e => {
			if (!running) return;
			const r = cv.getBoundingClientRect();
			realPos = {
				x: (e.clientX - r.left) / r.width * CW,
				y: (e.clientY - r.top) / r.height * CH
			};
			realActive = true;
			draw();
		});
		cv.addEventListener('pointerdown', e => {
			autoPlay = false;
			updateNav();
			const r = cv.getBoundingClientRect();
			realPos = {
				x: (e.clientX - r.left) / r.width * CW,
				y: (e.clientY - r.top) / r.height * CH
			};
			realActive = true;
			draw();
		});
		cv.addEventListener('pointerleave', () => {
			if (!realActive) return;
			realActive = false;
			if (realPos) {
				pointer = { x: realPos.x, y: realPos.y };
				const target = stepPointerTarget();
				if (target) aimPointer(target);
			}
			realPos = null;
			draw();
		});
		window.addEventListener('resize', () => { if (running) draw(); });

		document.querySelectorAll('#word-meadow-wrap .wm-step').forEach(el => {
			el.addEventListener('click', () => {
				autoPlay = false;
				applyStepInstant(+el.getAttribute('data-wstep'));
			});
		});
		document.querySelectorAll('#word-meadow-wrap .wm-dim-btn').forEach(el => {
			el.addEventListener('click', () => setDim(+el.getAttribute('data-wdim')));
		});
		if (nextBtn) nextBtn.addEventListener('click', () => {
			if (step >= LAST_STEP) return;
			autoPlay = false;
			animateToStep(step + 1);
		});
		if (prevBtn) prevBtn.addEventListener('click', () => {
			if (step <= 0) return;
			autoPlay = false;
			applyStepInstant(step - 1);
		});
		if (playBtn) playBtn.addEventListener('click', () => {
			if (autoPlay) {
				autoPlay = false;
			} else {
				if (step >= LAST_STEP) applyStepInstant(0);
				autoPlay = true;
				stepStart = performance.now();
			}
			updateNav();
		});
	}

	function initEls() {
		if (inited) return;
		cv = document.getElementById('wm-canvas');
		sN = document.getElementById('wm-sN');
		sT = document.getElementById('wm-sT');
		rN = document.getElementById('wm-rN');
		rT = document.getElementById('wm-rT');
		rWord = document.getElementById('wm-rWord');
		rCell = document.getElementById('wm-rCell');
		rProb = document.getElementById('wm-rProb');
		rRunner = document.getElementById('wm-rRunner');
		rEdge = document.getElementById('wm-rEdge');
		rGap = document.getElementById('wm-rGap');
		captionEl = document.getElementById('wm-caption');
		playBtn = document.getElementById('wm-play');
		prevBtn = document.getElementById('wm-prev');
		nextBtn = document.getElementById('wm-next');
		if (!cv || !sN || !sT) return;
		inited = true;
		bindEvents();
	}

	function startMeadow() {
		if (inited) return;
		initEls();
		if (!inited) return;
		anchors = genFor(12);
		gapFrac = dim === 2 ? ensureField(12, palette()).gapFrac : gapOf1D(anchors);
		applyStepInstant(0);
		queuePrecompute(palette());
		running = true;
		autoPlay = true;
		stepStart = performance.now();
		startLoop();
		if (window.__MN_DARK) {
			window.__MN_DARK.onChange(() => {
				fieldCache = {};
				precomp = null;
				precompQueue = [];
				if (dim === 2) {
					gapFrac = ensureField(currentN, palette()).gapFrac;
					queuePrecompute(palette());
				}
				draw();
			});
		}
	}

	function destroy() {
		stopLoop();
		running = false;
		inited = false;
	}

	return { init: startMeadow, destroy: destroy, draw: draw };
})();
