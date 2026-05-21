/**
 * Fourier Multiplication Algorithm - Interactive Step-by-Step Visualization
 *
 * Demonstrates how a 1-layer Transformer learns modular addition via
 * Fourier features and constructive interference.
 *
 * Reference: Nanda et al. (2023) "Progress Measures for Grokking
 * via Mechanistic Interpretability"
 *
 * @param {string|HTMLElement} container - Target div or its ID
 * @param {object} [options]
 * @param {number} [options.a=42]
 * @param {number} [options.b=80]
 * @param {number} [options.P=113]
 */
function renderFourierAlgorithm(container, options = {}) {
    const root = typeof container === 'string' ? document.getElementById(container) : container;
    if (!root) { console.error('renderFourierAlgorithm: container not found'); return; }

    let a = options.a ?? 42;
    let b = options.b ?? 80;
    let P = options.P ?? 113;
    let correctAnswer = (a + b) % P;
    const FREQS = [14, 35, 41, 42, 52];

    // Precompute
    let tokens = Array.from({ length: P }, (_, i) => i);

    function computeSignals(aa, bb, pp, freqs) {
        const toks = Array.from({ length: pp }, (_, i) => i);
        const sigs = freqs.map(k => {
            const wk = 2 * Math.PI * k / pp;
            return toks.map(c => Math.cos(wk * (aa + bb) - wk * c));
        });
        const total = toks.map((_, i) => sigs.reduce((s, sig) => s + sig[i], 0));
        return { sigs, total, toks };
    }

    let computed = computeSignals(a, b, P, FREQS);
    let allSignals = computed.sigs;
    let totalSignal = computed.total;

    function getSoftmax(signal) {
        const maxV = Math.max(...signal);
        const exps = signal.map(v => Math.exp(v - maxV));
        const sum = exps.reduce((s, v) => s + v, 0);
        return exps.map(v => v / sum);
    }
    let softmaxSignal = getSoftmax(totalSignal);

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function cite(text, key) {
        const entry = (typeof window.bibData !== 'undefined' && window.bibData[key]);
        if (entry && entry.url) {
            return `<a href="${entry.url}" target="_blank" rel="noopener" style="color:inherit; text-decoration:underline dotted; text-underline-offset:2px;" title="${entry.title} (${entry.author}, ${entry.year})">${text}</a>`;
        }
        return text;
    }

    function mathBlock(tex) {
        return `<div class="math-block" data-tex="${tex.replace(/"/g, '&quot;')}" style="text-align:center; margin:18px 0; font-size:1.15em; overflow-x:auto;"></div>`;
    }

    function mathInline(tex) {
        return `<span class="math-inline" data-tex="${tex.replace(/"/g, '&quot;')}"></span>`;
    }

    function renderMath() {
        if (typeof temml !== 'undefined') {
            root.querySelectorAll('.math-block').forEach(el => {
                try { temml.render(el.getAttribute('data-tex'), el, { displayMode: true }); }
                catch (e) { el.textContent = el.getAttribute('data-tex'); console.warn('temml error:', e.message); }
            });
            root.querySelectorAll('.math-inline').forEach(el => {
                try { temml.render(el.getAttribute('data-tex'), el, { displayMode: false }); }
                catch (e) { el.textContent = el.getAttribute('data-tex'); }
            });
        }
    }

    function card(title, body, color = '#3b82f6') {
        return `<div style="background:#fff; border-radius:10px; border-left:4px solid ${color}; padding:18px 22px; margin:14px 0; box-shadow:0 1px 6px rgba(0,0,0,0.05);">
            <h3 style="margin:0 0 8px 0; color:${color}; font-size:1.05em;">${title}</h3>
            <div style="color:#334155; line-height:1.75; font-size:0.97em;">${body}</div>
        </div>`;
    }

    function plotDiv(id, height = '340px') {
        return `<div id="${id}" style="width:100%; height:${height}; margin:12px 0; border-radius:6px;"></div>`;
    }

    // ─── Build UI Shell ──────────────────────────────────────────────────────
    root.innerHTML = '';
    root.style.fontFamily = "'Segoe UI', system-ui, -apple-system, sans-serif";
    root.style.maxWidth = '900px';
    root.style.margin = '0 auto';

    // Global config bar
    const configBar = document.createElement('div');
    configBar.style.cssText = 'display:flex; align-items:center; gap:12px; padding:10px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:12px; flex-wrap:wrap;';
    configBar.innerHTML = `
        <label style="font-size:0.85em; font-weight:600;">a: <input type="number" id="cfg-a" min="0" max="200" value="${a}" style="width:50px; padding:3px 6px; border:1px solid #cbd5e1; border-radius:4px;"></label>
        <label style="font-size:0.85em; font-weight:600;">b: <input type="number" id="cfg-b" min="0" max="200" value="${b}" style="width:50px; padding:3px 6px; border:1px solid #cbd5e1; border-radius:4px;"></label>
        <label style="font-size:0.85em; font-weight:600;">P: <input type="number" id="cfg-P" min="2" max="500" value="${P}" style="width:55px; padding:3px 6px; border:1px solid #cbd5e1; border-radius:4px;"></label>
        <button id="cfg-apply" style="padding:5px 14px; border:none; border-radius:5px; background:#3b82f6; color:#fff; font-size:0.85em; cursor:pointer; font-weight:600;">Apply</button>
        <span id="cfg-result" style="font-size:0.85em; color:#059669; font-weight:600;">(${a}+${b}) mod ${P} = ${correctAnswer}</span>
    `;
    root.appendChild(configBar);

    // Navigation bar
    const nav = document.createElement('div');
    nav.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px 18px; background:#1e293b; border-radius:10px; margin-bottom:18px; position:sticky; top:0; z-index:100;';

    const btnPrev = document.createElement('button');
    btnPrev.textContent = '\u2190 Back';
    btnPrev.style.cssText = 'padding:7px 16px; border:none; border-radius:5px; background:#475569; color:#fff; font-size:13px; cursor:pointer;';

    const stepLabel = document.createElement('span');
    stepLabel.style.cssText = 'color:#fff; font-size:13px; font-weight:600;';

    const btnNext = document.createElement('button');
    btnNext.textContent = 'Next \u2192';
    btnNext.style.cssText = 'padding:7px 16px; border:none; border-radius:5px; background:#22c55e; color:#fff; font-size:13px; cursor:pointer; font-weight:600;';

    nav.append(btnPrev, stepLabel, btnNext);
    root.appendChild(nav);

    const content = document.createElement('div');
    content.style.cssText = 'min-height:500px;';
    root.appendChild(content);

    const dotsEl = document.createElement('div');
    dotsEl.style.cssText = 'display:flex; justify-content:center; gap:7px; margin-top:16px; padding:12px;';
    root.appendChild(dotsEl);

    // Config apply handler
    document.getElementById('cfg-apply').addEventListener('click', () => {
        const newA = parseInt(document.getElementById('cfg-a').value) || 0;
        const newB = parseInt(document.getElementById('cfg-b').value) || 0;
        const newP = parseInt(document.getElementById('cfg-P').value) || 113;
        if (newP < 2) return;
        a = newA % newP;
        b = newB % newP;
        P = newP;
        correctAnswer = (a + b) % P;
        tokens = Array.from({ length: P }, (_, i) => i);
        computed = computeSignals(a, b, P, FREQS);
        allSignals = computed.sigs;
        totalSignal = computed.total;
        softmaxSignal = getSoftmax(totalSignal);
        document.getElementById('cfg-a').value = a;
        document.getElementById('cfg-b').value = b;
        document.getElementById('cfg-result').textContent = `(${a}+${b}) mod ${P} = ${correctAnswer}`;
        goToStep(currentStep);
    });

    // ─── Steps ───────────────────────────────────────────────────────────────
    const steps = [];

    // ── STEP 0: The Problem ──
    steps.push({ title: 'The Problem', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 0: The Problem</h2>
            <p style="text-align:center; color:#64748b;">What does the network need to compute?</p>

            ${card('The Task', `
                <div style="text-align:center; font-size:1.4em; padding:14px; background:#f0f9ff; border-radius:8px;">
                    ${mathBlock(`\\underbrace{${a}}_{\\text{first input token}} + \\underbrace{${b}}_{\\text{second input token}} \\mod \\underbrace{${P}}_{\\text{prime modulus}} = \\;?`)}
                </div>
                <p>A tiny Transformer receives two number-tokens and must output the correct answer from ${P} possible tokens.</p>
                <p>Correct answer: <span style="color:#16a34a; font-weight:bold; font-size:1.2em;">${correctAnswer}</span></p>
            `)}

            ${card('The Architecture', `
                <ul style="margin:0; padding-left:20px;">
                    <li>1 Attention layer (4 heads, dimension 128)</li>
                    <li>1 MLP layer (512 neurons, ReLU activation)</li>
                    <li>Vocabulary: ${P} tokens (the numbers 0 to ${P - 1})</li>
                    <li>No positional encoding needed (only 3 positions: a, b, =)</li>
                </ul>
                <p>Despite its tiny size, this network achieves <strong>100% accuracy</strong> after "grokking" ${cite('(Power et al., 2022)', 'grokking')}.</p>
            `, '#8b5cf6')}

            ${card('The Discovered Algorithm (Overview)', `
                <p>The network independently discovers a Fourier-based algorithm ${cite('(Nanda et al., 2023)', 'nanda2023grokking')}:</p>
                <ol style="padding-left:20px;">
                    <li><strong>Numbers to Angles:</strong> Each number becomes a point on a circle</li>
                    <li><strong>Addition to Rotation:</strong> Adding numbers = adding angles</li>
                    <li><strong>Interference to Selection:</strong> Multiple waves combine so only the correct answer survives</li>
                </ol>
            `, '#059669')}
        `;
        renderMath();
    }});

    // ── STEP 1: What is a frequency? ──
    steps.push({ title: 'What is a Frequency k?', render() {
        const k = FREQS[0];
        const wk = 2 * Math.PI * k / P;

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 1: What is a Frequency ${mathInline('k')}?</h2>
            <p style="text-align:center; color:#64748b;">The fundamental idea: represent numbers as angles on a circle</p>

            ${card('The Core Formula', `
                ${mathBlock(`\\omega_k = \\underbrace{\\frac{2\\pi}{P}}_{\\text{base angle} = \\frac{2\\pi}{${P}} = ${(2*Math.PI/P).toFixed(6)}} \\cdot \\underbrace{k}_{\\text{frequency index}}`)}
                <p style="text-align:center;">For ${mathInline(`k = ${k}`)}, ${mathInline(`P = ${P}`)}:</p>
                ${mathBlock(`\\omega_{${k}} = \\frac{2\\pi}{${P}} \\cdot ${k} = ${(2*Math.PI/P).toFixed(6)} \\cdot ${k} = ${wk.toFixed(6)} \\text{ rad}`)}
            `)}

            ${card('What does this mean?', `
                <p>${mathInline('\\omega_k')} is the <strong>angular velocity</strong>. It determines how fast a point rotates around the unit circle as we count from 0 to ${P-1}.</p>
                <ul>
                    <li>${mathInline('k=1')}: Each number advances the point by ${mathInline(`\\frac{2\\pi}{${P}} = ${(2*Math.PI/P).toFixed(5)}`)} rad (1 full rotation total)</li>
                    <li>${mathInline(`k=${k}`)}: Each number advances by ${mathInline(`${wk.toFixed(5)}`)} rad (<strong>${k} full rotations</strong> from 0 to ${P-1})</li>
                </ul>
                <p>Think of it like a clock hand: ${mathInline('k')} controls how many times the hand goes around as you count through all numbers.</p>
            `, '#8b5cf6')}

            ${card('Why is this useful for addition?', `
                <p>Because addition of numbers becomes addition of angles:</p>
                ${mathBlock(`\\underbrace{\\cos(\\omega_k \\cdot (a+b))}_{\\substack{\\text{cosine of the angle}\\\\\\text{for the SUM}}} = \\cos\\!\\left(\\underbrace{\\omega_k \\cdot a}_{\\substack{\\text{angle}\\\\\\text{for }a}} + \\underbrace{\\omega_k \\cdot b}_{\\substack{\\text{angle}\\\\\\text{for }b}}\\right)`)}
                <p>And angle-addition can be computed with simple multiplications (the addition theorem). This is what the MLP learns to do!</p>
            `, '#059669')}

            <p style="text-align:center; color:#64748b; font-size:0.9em;">The trained network uses 5 frequencies: ${mathInline(`k \\in \\{${FREQS.join(', ')}\\}`)}</p>
        `;
        renderMath();
    }});

    // ── STEP 2: Embedding ──
    steps.push({ title: 'Embedding: Numbers to Circle', render() {
        const k = FREQS[0];
        const wk = 2 * Math.PI * k / P;
        const angA = wk * a, cosA = Math.cos(angA), sinA = Math.sin(angA);
        const angB = wk * b, cosB = Math.cos(angB), sinB = Math.sin(angB);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 2: Embedding</h2>
            <p style="text-align:center; color:#64748b;">Each input number is mapped to a point on the unit circle</p>

            ${card('The Embedding Formula', `
                ${mathBlock(`\\underbrace{n}_{\\substack{\\text{input}\\\\\\text{number}}} \\;\\longmapsto\\; \\left(\\;\\underbrace{\\cos(\\omega_k \\cdot n)}_{\\substack{x\\text{-coordinate}\\\\\\text{on the circle}}},\\;\\; \\underbrace{\\sin(\\omega_k \\cdot n)}_{\\substack{y\\text{-coordinate}\\\\\\text{on the circle}}}\\;\\right)`)}
                <p>This happens for <strong>each</strong> of the 5 frequencies simultaneously. So each number becomes 5 points on 5 different circles.</p>
            `)}

            ${card('Concrete values (k=' + k + ')', `
                ${mathBlock(`\\underbrace{a = ${a}}_{\\text{first input}} \\;\\mapsto\\; (\\cos(${wk.toFixed(4)} \\times ${a}),\\; \\sin(${wk.toFixed(4)} \\times ${a})) = (${cosA.toFixed(4)},\\; ${sinA.toFixed(4)})`)}
                ${mathBlock(`\\underbrace{b = ${b}}_{\\text{second input}} \\;\\mapsto\\; (\\cos(${wk.toFixed(4)} \\times ${b}),\\; \\sin(${wk.toFixed(4)} \\times ${b})) = (${cosB.toFixed(4)},\\; ${sinB.toFixed(4)})`)}
            `, '#ef4444')}

            ${plotDiv('step2-circle', '380px')}

            ${card('What is the embedding matrix?', `
                <p>The Transformer's <strong>embedding matrix</strong> ${mathInline('W_E')} has shape ${mathInline(`(${P}, d_{\\text{model}})`)}. After training, its columns contain these cos/sin values for each frequency ${mathInline('k')}. When token "${a}" is fed in, the network looks up row ${a} of ${mathInline('W_E')}, which gives exactly ${mathInline(`(\\cos(\\omega_k \\cdot ${a}), \\sin(\\omega_k \\cdot ${a}))`)}.
                </p>
            `, '#64748b')}
        `;
        renderMath();

        const theta = Array.from({ length: 100 }, (_, i) => i * 2 * Math.PI / 99);
        Plotly.newPlot('step2-circle', [
            { x: theta.map(Math.cos), y: theta.map(Math.sin), mode: 'lines', line: { color: '#e2e8f0', width: 1.5 }, showlegend: false, hoverinfo: 'skip' },
            { x: [0, cosA], y: [0, sinA], mode: 'lines+markers', line: { color: '#ef4444', width: 3 }, marker: { size: [4, 13], color: '#ef4444' }, name: `a=${a}: (${cosA.toFixed(3)}, ${sinA.toFixed(3)})`, hoverinfo: 'name' },
            { x: [0, cosB], y: [0, sinB], mode: 'lines+markers', line: { color: '#3b82f6', width: 3 }, marker: { size: [4, 13], color: '#3b82f6', symbol: 'square' }, name: `b=${b}: (${cosB.toFixed(3)}, ${sinB.toFixed(3)})`, hoverinfo: 'name' },
        ], {
            xaxis: { range: [-1.5, 1.5], zeroline: true, scaleanchor: 'y', title: 'cos(w*n)' },
            yaxis: { range: [-1.5, 1.5], zeroline: true, title: 'sin(w*n)' },
            margin: { t: 30, b: 50, l: 60, r: 20 },
            title: { text: `Both inputs on the unit circle (frequency k=${k})`, font: { size: 13 } },
            showlegend: true, legend: { x: 0.01, y: 0.99 }
        }, { responsive: true });
    }});

    // ── STEP 3: Addition Theorem ──
    steps.push({ title: 'The Addition Theorem', render() {
        const k = FREQS[0];
        const wk = 2 * Math.PI * k / P;
        const angA = wk * a, angB = wk * b, angS = wk * (a + b);
        const cosA = Math.cos(angA), sinA = Math.sin(angA);
        const cosB = Math.cos(angB), sinB = Math.sin(angB);
        const cosS = Math.cos(angS), sinS = Math.sin(angS);
        const prod_cc = cosA * cosB, prod_ss = sinA * sinB;
        const prod_sc = sinA * cosB, prod_cs = cosA * sinB;

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 3: The Addition Theorem</h2>
            <p style="text-align:center; color:#64748b;">The network computes cos(w*(a+b)) using only the individual embeddings of a and b</p>

            ${card('The Key Identity (Cosine)', `
                ${mathBlock(`\\overbrace{\\cos(\\omega_k(a+b))}^{\\substack{\\text{what we WANT:}\\\\\\text{the angle for the sum}}} = \\underbrace{\\cos(\\omega_k a)}_{\\substack{\\text{from embedding}\\\\\\text{of token }a\\\\= ${cosA.toFixed(4)}}} \\cdot \\underbrace{\\cos(\\omega_k b)}_{\\substack{\\text{from embedding}\\\\\\text{of token }b\\\\= ${cosB.toFixed(4)}}} \\;-\\; \\underbrace{\\sin(\\omega_k a)}_{\\substack{\\text{from embedding}\\\\\\text{of token }a\\\\= ${sinA.toFixed(4)}}} \\cdot \\underbrace{\\sin(\\omega_k b)}_{\\substack{\\text{from embedding}\\\\\\text{of token }b\\\\= ${sinB.toFixed(4)}}}`)}
            `, '#059669')}

            ${card('The Key Identity (Sine)', `
                ${mathBlock(`\\overbrace{\\sin(\\omega_k(a+b))}^{\\substack{\\text{what we WANT}}} = \\underbrace{\\sin(\\omega_k a)}_{= ${sinA.toFixed(4)}} \\cdot \\underbrace{\\cos(\\omega_k b)}_{= ${cosB.toFixed(4)}} \\;+\\; \\underbrace{\\cos(\\omega_k a)}_{= ${cosA.toFixed(4)}} \\cdot \\underbrace{\\sin(\\omega_k b)}_{= ${sinB.toFixed(4)}}`)}
            `, '#3b82f6')}

            ${card('Numerical verification (k=' + k + ')', `
                ${mathBlock(`\\cos(\\omega_{${k}}(a+b)) = \\underbrace{(${cosA.toFixed(4)})(${cosB.toFixed(4)})}_{= ${prod_cc.toFixed(5)}} - \\underbrace{(${sinA.toFixed(4)})(${sinB.toFixed(4)})}_{= ${prod_ss.toFixed(5)}} = ${(prod_cc - prod_ss).toFixed(5)}`)}
                ${mathBlock(`\\text{Check: } \\cos(\\omega_{${k}} \\cdot ${a+b}) = \\cos(${angS.toFixed(4)}) = ${cosS.toFixed(5)} \\quad \\checkmark`)}
                ${mathBlock(`\\sin(\\omega_{${k}}(a+b)) = \\underbrace{(${sinA.toFixed(4)})(${cosB.toFixed(4)})}_{= ${prod_sc.toFixed(5)}} + \\underbrace{(${cosA.toFixed(4)})(${sinB.toFixed(4)})}_{= ${prod_cs.toFixed(5)}} = ${(prod_sc + prod_cs).toFixed(5)}`)}
                ${mathBlock(`\\text{Check: } \\sin(\\omega_{${k}} \\cdot ${a+b}) = \\sin(${angS.toFixed(4)}) = ${sinS.toFixed(5)} \\quad \\checkmark`)}
            `, '#64748b')}

            ${plotDiv('step3-circle', '340px')}

            ${card('How the network layers implement this', `
                ${plotDiv('step3-flow', '220px')}
            `, '#8b5cf6')}
        `;
        renderMath();

        // Circle plot
        const theta = Array.from({ length: 100 }, (_, i) => i * 2 * Math.PI / 99);
        Plotly.newPlot('step3-circle', [
            { x: theta.map(Math.cos), y: theta.map(Math.sin), mode: 'lines', line: { color: '#e2e8f0', width: 1.5 }, showlegend: false, hoverinfo: 'skip' },
            { x: [0, cosA], y: [0, sinA], mode: 'lines+markers', line: { color: '#ef4444', width: 1.5, dash: 'dot' }, marker: { size: [3, 8] }, name: `a=${a}`, opacity: 0.5 },
            { x: [0, cosB], y: [0, sinB], mode: 'lines+markers', line: { color: '#3b82f6', width: 1.5, dash: 'dot' }, marker: { size: [3, 8] }, name: `b=${b}`, opacity: 0.5 },
            { x: [0, cosS], y: [0, sinS], mode: 'lines+markers', line: { color: '#059669', width: 4 }, marker: { size: [4, 15], symbol: ['circle', 'triangle-up'], color: '#059669' }, name: `a+b mod P = ${correctAnswer}` },
        ], {
            xaxis: { range: [-1.5, 1.5], zeroline: true, scaleanchor: 'y', title: 'cos' },
            yaxis: { range: [-1.5, 1.5], zeroline: true, title: 'sin' },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            showlegend: true, legend: { x: 0.01, y: 0.99 }
        }, { responsive: true });

        // Flow diagram showing what each layer does
        const flowAnnotations = [
            { x: 0.5, y: 1.0, text: '<b>Input:</b> tokens a=' + a + ', b=' + b, showarrow: false, font: { size: 11 } },
            { x: 0.5, y: 0.82, text: '<b>Embedding W_E:</b> look up cos(wk*a), sin(wk*a), cos(wk*b), sin(wk*b)', showarrow: false, font: { size: 10, color: '#3b82f6' } },
            { x: 0.5, y: 0.64, text: '<b>Attention (4 heads):</b> move b-info to output position, compute products', showarrow: false, font: { size: 10, color: '#8b5cf6' } },
            { x: 0.5, y: 0.46, text: '<b>MLP (512 ReLU neurons):</b> cos*cos - sin*sin = cos(sum), sin*cos + cos*sin = sin(sum)', showarrow: false, font: { size: 10, color: '#059669' } },
            { x: 0.5, y: 0.28, text: '<b>Output:</b> cos(wk*(a+b)) and sin(wk*(a+b)) for each k', showarrow: false, font: { size: 10, color: '#ef4444' } },
        ];
        Plotly.newPlot('step3-flow', [], {
            xaxis: { visible: false, range: [0, 1] },
            yaxis: { visible: false, range: [0, 1.1] },
            margin: { t: 5, b: 5, l: 5, r: 5 },
            annotations: flowAnnotations,
            shapes: [
                { type: 'line', x0: 0.5, x1: 0.5, y0: 0.95, y1: 0.87, line: { color: '#94a3b8', width: 2 } },
                { type: 'line', x0: 0.5, x1: 0.5, y0: 0.77, y1: 0.69, line: { color: '#94a3b8', width: 2 } },
                { type: 'line', x0: 0.5, x1: 0.5, y0: 0.59, y1: 0.51, line: { color: '#94a3b8', width: 2 } },
                { type: 'line', x0: 0.5, x1: 0.5, y0: 0.41, y1: 0.33, line: { color: '#94a3b8', width: 2 } },
            ],
        }, { responsive: true, staticPlot: true });
    }});

    // ── STEP 4: Unembedding ──
    steps.push({ title: 'Unembedding: Compare with All Tokens', render() {
        const k = FREQS[0];
        const wk = 2 * Math.PI * k / P;
        const signal = allSignals[0];
        const falsePeaks = tokens.filter(c => signal[c] > 0.9 && c !== correctAnswer);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 4: Unembedding</h2>
            <p style="text-align:center; color:#64748b;">For every possible output token c: how well does it match the computed sum?</p>

            ${card('The Formula', `
                <p>The unembedding matrix ${mathInline('W_U')} contains cos/sin values for each token. For each candidate ${mathInline('c')}, we compute a dot product:</p>
                ${mathBlock(`\\underbrace{\\text{Logit}(c)}_{\\substack{\\text{how well does}\\\\\\text{token } c \\text{ match?}}} = \\underbrace{\\cos(\\omega_k \\cdot (a+b))}_{\\substack{\\text{computed by}\\\\\\text{the MLP}}} \\cdot \\underbrace{\\cos(\\omega_k \\cdot c)}_{\\substack{\\text{row } c \\text{ of}\\\\\\text{matrix } W_U}} + \\underbrace{\\sin(\\omega_k \\cdot (a+b))}_{\\substack{\\text{computed by}\\\\\\text{the MLP}}} \\cdot \\underbrace{\\sin(\\omega_k \\cdot c)}_{\\substack{\\text{row } c \\text{ of}\\\\\\text{matrix } W_U}}`)}
                <p>By the cosine subtraction identity, this simplifies to:</p>
                ${mathBlock(`\\text{Logit}(c) = \\cos(\\underbrace{\\omega_k \\cdot (a+b) - \\omega_k \\cdot c}_{= \\omega_k \\cdot (a+b-c)})`)}
            `, '#3b82f6')}

            ${card('How to read the plot below', `
                <p>We evaluate ${mathInline('\\cos(\\omega_k \\cdot (a+b-c))')} for every token ${mathInline('c \\in \\{0, 1, \\ldots, ' + (P-1) + '\\}')}:</p>
                <ul>
                    <li>At ${mathInline('c^* = ' + correctAnswer)}: we get ${mathInline('a+b-c^* = ' + a + '+' + b + '-' + correctAnswer + ' = ' + ((a+b)-correctAnswer))} which is ${mathInline('\\equiv 0 \\pmod{' + P + '}')} so ${mathInline('\\cos(0) = 1')} (maximum!)</li>
                    <li>At other values of ${mathInline('c')}: the angle is nonzero, so the cosine is less than 1</li>
                    <li><strong>Problem:</strong> cosine is periodic with period ${mathInline('P/k = ' + P + '/' + k + ' \\approx ' + (P/k).toFixed(1))}, so there are <strong>${falsePeaks.length} false peaks</strong> above 0.9!</li>
                </ul>
            `, '#f59e0b')}

            ${plotDiv('step4-plot', '320px')}

            ${card('What is ' + mathInline('c') + '?', `
                <p>${mathInline('c')} is a <strong>candidate output token</strong>. The network must choose one of the ${P} possible outputs. The unembedding step computes a score (logit) for each candidate, and the highest-scoring one becomes the prediction.</p>
            `, '#64748b')}
        `;
        renderMath();

        Plotly.newPlot('step4-plot', [
            { x: tokens, y: signal, mode: 'lines', line: { color: '#3b82f6', width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.04)', name: `cos(w_${k} * (a+b-c))` },
            { x: [correctAnswer], y: [signal[correctAnswer]], mode: 'markers', marker: { size: 13, color: '#ef4444', symbol: 'star' }, name: `Correct: c*=${correctAnswer}` },
            { x: falsePeaks, y: falsePeaks.map(c => signal[c]), mode: 'markers', marker: { size: 7, color: '#f59e0b' }, name: `False peaks (${falsePeaks.length})` },
        ], {
            xaxis: { title: 'Candidate output token c', range: [-2, P + 2] },
            yaxis: { title: `cos(w_${k} * (a+b-c))`, range: [-1.3, 1.4] },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            shapes: [{ type: 'line', x0: 0, x1: P, y0: 0, y1: 0, line: { color: '#94a3b8', width: 0.5 } }],
            showlegend: true, legend: { x: 0.55, y: 0.98 }
        }, { responsive: true });
    }});

    // ── STEP 5: Why one frequency fails ──
    steps.push({ title: 'Why One Frequency Fails', render() {
        const k = FREQS[0];
        const signal = allSignals[0];
        const highPeaks = tokens.filter(c => signal[c] > 0.9);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 5: Why One Frequency Fails</h2>
            <p style="text-align:center; color:#64748b;">Cosine is periodic, so there are too many "false" peaks!</p>

            ${card('The Problem', `
                <p>The function ${mathInline('\\cos(\\omega_k \\cdot x)')} has a <strong>period</strong> of ${mathInline('P/k')}:</p>
                ${mathBlock(`\\underbrace{\\cos(\\omega_k \\cdot x)}_{\\text{repeats every } P/k \\text{ tokens}} \\quad \\text{Period} = \\frac{P}{k} = \\frac{${P}}{${k}} \\approx ${(P/k).toFixed(1)}`)}
                <p>This means: every <strong>~${Math.round(P/k)} tokens</strong>, the pattern repeats and there is a new peak!</p>
                <p>Result: <strong>${highPeaks.length} tokens</strong> have activation > 0.9. The network cannot distinguish them with just one frequency!</p>
            `, '#ef4444')}

            ${plotDiv('step5-plot', '300px')}

            ${card('The Solution: Multiple Frequencies!', `
                <p>If we combine <strong>multiple frequencies</strong> with <strong>different periods</strong>:</p>
                <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
                    <tr style="background:#f8fafc;"><th style="padding:6px; border:1px solid #e2e8f0;">Frequency k</th><th style="padding:6px; border:1px solid #e2e8f0;">Period P/k</th><th style="padding:6px; border:1px solid #e2e8f0;">False peaks every...</th></tr>
                    ${FREQS.map(kk => `<tr><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">${kk}</td><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">${(P/kk).toFixed(1)}</td><td style="padding:6px; border:1px solid #e2e8f0;">~${Math.round(P/kk)} tokens</td></tr>`).join('')}
                </table>
                <p style="margin-top:10px;">The false peaks of each frequency are at <strong>different positions</strong>!</p>
                <p style="color:#059669; font-weight:bold;">Only at c* = ${correctAnswer} do ALL frequencies peak simultaneously!</p>
            `, '#059669')}
        `;
        renderMath();

        Plotly.newPlot('step5-plot', [
            { x: tokens, y: signal, mode: 'lines', line: { color: '#3b82f6', width: 1.2 }, showlegend: false },
            { x: highPeaks, y: highPeaks.map(c => signal[c]), mode: 'markers', marker: { size: 7, color: '#f59e0b' }, name: `${highPeaks.length} peaks > 0.9` },
            { x: [correctAnswer], y: [1.0], mode: 'markers', marker: { size: 14, color: '#ef4444', symbol: 'star' }, name: `Correct: c*=${correctAnswer}` },
        ], {
            xaxis: { title: 'Candidate token c' },
            yaxis: { title: `cos(w_${k} * (a+b-c))`, range: [-1.2, 1.4] },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            shapes: [
                { type: 'line', x0: 0, x1: P, y0: 0.9, y1: 0.9, line: { color: '#f59e0b', width: 1, dash: 'dot' } },
                { type: 'line', x0: 0, x1: P, y0: 0, y1: 0, line: { color: '#94a3b8', width: 0.5 } }
            ],
            showlegend: true, legend: { x: 0.6, y: 0.5 }
        }, { responsive: true });
    }});

    // ── STEP 6: All 5 frequencies ──
    steps.push({ title: 'All 5 Frequencies Together', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 6: All 5 Frequencies</h2>
            <p style="text-align:center; color:#64748b;">Each frequency peaks at c*=${correctAnswer}, but their false peaks are at different positions</p>

            ${card('How each row is computed', `
                <p>For each frequency ${mathInline('k')}, we compute the logit for every candidate token ${mathInline('c')}:</p>
                ${mathBlock(`\\underbrace{f_k(c)}_{\\substack{\\text{activation for}\\\\\\text{token } c \\text{ at}\\\\\\text{frequency } k}} = \\cos\\!\\left(\\underbrace{\\frac{2\\pi k}{${P}}}_{\\omega_k} \\cdot \\underbrace{(${a}+${b}-c)}_{\\substack{\\text{difference between}\\\\\\text{the sum and}\\\\\\text{candidate } c}}\\right)`)}
                <p>Each frequency has a different period ${mathInline('P/k')}, so the false peaks land at <strong>different positions</strong>.</p>
            `, '#3b82f6')}

            ${plotDiv('step6-plot', '380px')}

            ${card('Key Observation', `
                <p>The <span style="color:#ef4444;">red dashed line</span> at c*=${correctAnswer} hits <strong>every single peak</strong>. But the other peaks are scattered at different positions for each frequency!</p>
                <p style="font-weight:bold; color:#059669;">Next step: Sum all 5 signals. Only c* survives!</p>
            `, '#059669')}
        `;
        renderMath();

        const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
        const traces = FREQS.map((k, i) => ({
            x: tokens,
            y: allSignals[i].map(v => v + i * 2.5),
            mode: 'lines',
            line: { color: colors[i], width: 1.3 },
            name: `k=${k} (period ${(P/k).toFixed(1)})`,
        }));
        FREQS.forEach((k, i) => {
            traces.push({
                x: [correctAnswer],
                y: [allSignals[i][correctAnswer] + i * 2.5],
                mode: 'markers',
                marker: { size: 8, color: '#ef4444' },
                showlegend: false,
            });
        });

        Plotly.newPlot('step6-plot', traces, {
            xaxis: { title: 'Candidate output token c', range: [-2, P + 2] },
            yaxis: { showticklabels: false },
            margin: { t: 20, b: 50, l: 30, r: 20 },
            shapes: [{ type: 'line', x0: correctAnswer, x1: correctAnswer, y0: -1, y1: 12.5, line: { color: '#ef4444', width: 1.5, dash: 'dash' } }],
            showlegend: true, legend: { x: 0.72, y: 0.98 }
        }, { responsive: true });
    }});

    // ── STEP 7: Constructive Interference ──
    steps.push({ title: 'Constructive Interference', render() {
        const maxVal = totalSignal[correctAnswer];
        const sorted = [...totalSignal].map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v);
        const second = sorted[0].i === correctAnswer ? sorted[1] : sorted[0];

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 7: Constructive Interference</h2>
            <p style="text-align:center; color:#64748b;">The sum of all 5 waves: only the correct answer survives!</p>

            ${card('The Formula', `
                <p>The final logit for each candidate token ${mathInline('c')} is the sum over all 5 frequencies:</p>
                ${mathBlock(`\\underbrace{\\text{Logit}(c)}_{\\substack{\\text{final score}\\\\\\text{for token } c}} = \\sum_{k \\in \\{${FREQS.join(',')}\\}} \\underbrace{\\cos(\\omega_k \\cdot (\\overbrace{a+b}^{\\text{the sum}} - \\overbrace{c}^{\\substack{\\text{candidate}\\\\\\text{token}}}))}_{\\substack{\\text{contribution from}\\\\\\text{frequency } k}}`)}
            `, '#3b82f6')}

            ${plotDiv('step7-plot', '340px')}

            ${card('Why is c* the maximum?', `
                <p>At the correct answer ${mathInline('c^* = ' + correctAnswer)}:</p>
                ${mathBlock(`\\underbrace{a + b - c^*}_{${a}+${b}-${correctAnswer} = ${(a+b)-correctAnswer}} \\equiv 0 \\pmod{${P}}`)}
                ${mathBlock(`\\Rightarrow \\; \\omega_k \\cdot 0 = 0 \\;\\; \\Rightarrow \\;\\; \\underbrace{\\cos(0) = 1}_{\\text{for ALL } k}`)}
                ${mathBlock(`\\Rightarrow \\; \\text{Logit}(c^*) = \\underbrace{1 + 1 + 1 + 1 + 1}_{\\substack{\\text{all 5 frequencies}\\\\\\text{contribute maximum}}} = 5`)}
                <p>At every other ${mathInline('c')}: the cosine values are different for different ${mathInline('k')}, so they partially cancel out (<strong>destructive interference</strong>).</p>
                <p>2nd highest peak: c=${second.i} with logit=${second.v.toFixed(3)} (far below ${maxVal.toFixed(0)}!)</p>
            `, '#059669')}

            ${card('Analogy', `
                <p>Think of a lock with <strong>5 tumblers</strong>. Each frequency is one tumbler. Only the correct key (c*=${correctAnswer}) fits all 5 simultaneously. Every other key fails at least one tumbler.</p>
            `, '#8b5cf6')}
        `;
        renderMath();

        Plotly.newPlot('step7-plot', [
            { x: tokens, y: totalSignal, mode: 'lines', line: { color: '#3b82f6', width: 2.5 }, fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.06)', name: 'Sum of 5 cosines' },
            { x: [correctAnswer], y: [maxVal], mode: 'markers', marker: { size: 16, color: '#ef4444', symbol: 'star' }, name: `c*=${correctAnswer} (logit=${maxVal.toFixed(1)})` },
            { x: [second.i], y: [second.v], mode: 'markers', marker: { size: 10, color: '#f59e0b' }, name: `2nd place: c=${second.i} (${second.v.toFixed(2)})` },
        ], {
            xaxis: { title: 'Candidate output token c', range: [-2, P + 2] },
            yaxis: { title: 'Total logit = sum of cos(wk*(a+b-c))' },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            shapes: [{ type: 'line', x0: 0, x1: P, y0: 0, y1: 0, line: { color: '#94a3b8', width: 0.5 } }],
            showlegend: true, legend: { x: 0.5, y: 0.95 }
        }, { responsive: true });
    }});

    // ── STEP 8: Softmax ──
    steps.push({ title: 'Softmax: Logits to Probabilities', render() {
        const prob = softmaxSignal[correctAnswer];

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 8: Softmax</h2>
            <p style="text-align:center; color:#64748b;">Converting raw logits into a probability distribution</p>

            ${card('The Formula', `
                ${mathBlock(`\\underbrace{P(c)}_{\\substack{\\text{probability that}\\\\\\text{token } c \\text{ is}\\\\\\text{the answer}}} = \\frac{\\overbrace{\\exp(\\text{Logit}(c))}^{\\substack{\\text{exponentiate to}\\\\\\text{make positive}}}}{\\underbrace{\\sum_{j=0}^{${P-1}} \\exp(\\text{Logit}(j))}_{\\substack{\\text{sum over all tokens}\\\\\\text{(normalization)}}}}`)}
                <p>Softmax turns raw logit scores into probabilities: all values between 0 and 1, summing to 1. The token with the highest logit gets the highest probability.</p>
            `, '#3b82f6')}

            ${plotDiv('step8-plot', '300px')}

            ${card('Result', `
                <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
                    <tr style="background:#f8fafc;"><td style="padding:8px; border:1px solid #e2e8f0;">${mathInline('\\text{Logit}(c^* = ' + correctAnswer + ')')}</td><td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold;">${totalSignal[correctAnswer].toFixed(3)}</td></tr>
                    <tr><td style="padding:8px; border:1px solid #e2e8f0;">${mathInline('\\exp(\\text{Logit}(c^*))')}</td><td style="padding:8px; border:1px solid #e2e8f0;">${Math.exp(totalSignal[correctAnswer]).toFixed(2)}</td></tr>
                    <tr style="background:#ecfdf5;"><td style="padding:8px; border:1px solid #e2e8f0; color:#059669; font-weight:bold;">${mathInline('P(c^* = ' + correctAnswer + ')')}</td><td style="padding:8px; border:1px solid #e2e8f0; color:#059669; font-weight:bold;">${(prob * 100).toFixed(2)}%</td></tr>
                </table>
                <p style="margin-top:10px;">In reality (with learned weights ${mathInline('\\alpha_k')}), the peak is <strong>much sharper</strong>: P(c*) > 99%.</p>
                <p style="color:#059669; font-weight:bold; font-size:1.1em;">${mathInline('\\arg\\max_c P(c)')} = ${correctAnswer} = (${a}+${b}) mod ${P}  &#10003;</p>
            `, '#059669')}
        `;
        renderMath();

        Plotly.newPlot('step8-plot', [
            { x: tokens, y: softmaxSignal.map(v => v * 100), mode: 'lines', line: { color: '#10b981', width: 2.5 }, fill: 'tozeroy', fillcolor: 'rgba(16,185,129,0.08)', name: 'P(c) [%]' },
            { x: [correctAnswer], y: [prob * 100], mode: 'markers', marker: { size: 14, color: '#ef4444', symbol: 'star' }, name: `c*=${correctAnswer}: ${(prob*100).toFixed(2)}%` },
        ], {
            xaxis: { title: 'Candidate output token c', range: [-2, P + 2] },
            yaxis: { title: 'Probability [%]', rangemode: 'tozero' },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            showlegend: true, legend: { x: 0.55, y: 0.95 }
        }, { responsive: true });
    }});

    // ── STEP 9: Complete Algorithm ──
    steps.push({ title: 'Complete Algorithm', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 9: The Complete Algorithm</h2>
            <p style="text-align:center; color:#64748b;">All formulas at a glance ${cite('(Nanda et al., 2023)', 'nanda2023grokking')}</p>

            ${card('(1) EMBEDDING: Numbers become circle-points', `
                ${mathBlock(`\\underbrace{n}_{\\text{input token}} \\;\\mapsto\\; \\left(\\underbrace{\\cos(\\omega_k \\cdot n)}_{x},\\; \\underbrace{\\sin(\\omega_k \\cdot n)}_{y}\\right) \\quad \\text{where } \\underbrace{\\omega_k = \\frac{2\\pi k}{P}}_{\\text{angular velocity}},\\; k \\in \\{${FREQS.join(', ')}\\}`)}
            `, '#3b82f6')}

            ${card('(2) ATTENTION: Bringing information together', `
                <p>The 4 attention heads move information from positions a and b to the output position, creating products:</p>
                ${mathBlock(`\\underbrace{\\cos(\\omega_k a) \\cdot \\cos(\\omega_k b)}_{\\text{head 0: cos-cos product}}, \\quad \\underbrace{\\sin(\\omega_k a) \\cdot \\sin(\\omega_k b)}_{\\text{head 1: sin-sin product}}, \\quad \\underbrace{\\sin(\\omega_k a) \\cdot \\cos(\\omega_k b)}_{\\text{head 2: sin-cos product}}`)}
            `, '#8b5cf6')}

            ${card('(3) MLP: Applying addition theorems', `
                <p>512 ReLU neurons combine the products to compute:</p>
                ${mathBlock(`\\overbrace{\\cos(\\omega_k(a+b))}^{\\substack{\\text{the cosine of}\\\\\\text{the sum-angle}}} = \\underbrace{\\cos(\\omega_k a)\\cos(\\omega_k b)}_{\\text{from attention}} - \\underbrace{\\sin(\\omega_k a)\\sin(\\omega_k b)}_{\\text{from attention}}`)}
                ${mathBlock(`\\overbrace{\\sin(\\omega_k(a+b))}^{\\substack{\\text{the sine of}\\\\\\text{the sum-angle}}} = \\underbrace{\\sin(\\omega_k a)\\cos(\\omega_k b)}_{\\text{from attention}} + \\underbrace{\\cos(\\omega_k a)\\sin(\\omega_k b)}_{\\text{from attention}}`)}
            `, '#059669')}

            ${card('(4) UNEMBEDDING: Compare with all tokens', `
                ${mathBlock(`\\underbrace{\\text{Logit}(c)}_{\\substack{\\text{score for}\\\\\\text{candidate } c}} = \\sum_{k} \\alpha_k \\cdot \\underbrace{\\cos(\\omega_k \\cdot (a+b-c))}_{\\substack{= 1 \\text{ when } c = c^* \\\\ < 1 \\text{ otherwise}}}`)}
            `, '#f59e0b')}

            ${card('(5) SOFTMAX + ARGMAX: Final answer', `
                ${mathBlock(`c^* = \\underbrace{\\arg\\max_c}_{\\substack{\\text{pick the token}\\\\\\text{with highest prob.}}} \\frac{\\exp(\\text{Logit}(c))}{\\sum_j \\exp(\\text{Logit}(j))} = ${correctAnswer}`)}
                <div style="text-align:center; padding:12px; background:#ecfdf5; border-radius:8px; margin-top:10px;">
                    <span style="font-size:1.3em; font-weight:bold; color:#059669;">${a} + ${b} mod ${P} = ${correctAnswer} &#10003;</span>
                </div>
            `, '#ef4444')}
        `;
        renderMath();
    }});

    // ── STEP 10: Interactive Playground ──
    steps.push({ title: 'Interactive Playground', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 10: Interactive Playground</h2>
            <p style="text-align:center; color:#64748b;">Change a, b and toggle frequencies to see how the algorithm works (or breaks!)</p>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px; margin:15px 0;">
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <div>
                        <label style="font-weight:600; font-size:0.9em;">Number a:</label><br>
                        <input type="range" id="play-a" min="0" max="${P-1}" value="${a}" style="width:100%;">
                        <span id="play-a-val" style="font-weight:bold;">${a}</span>
                    </div>
                    <div>
                        <label style="font-weight:600; font-size:0.9em;">Number b:</label><br>
                        <input type="range" id="play-b" min="0" max="${P-1}" value="${b}" style="width:100%;">
                        <span id="play-b-val" style="font-weight:bold;">${b}</span>
                    </div>
                    <div>
                        <label style="font-weight:600; font-size:0.9em;">Correct answer:</label><br>
                        <span id="play-result" style="font-size:1.5em; font-weight:bold; color:#059669;">${correctAnswer}</span>
                    </div>
                </div>
                <div style="margin-bottom:10px;">
                    <label style="font-weight:600; font-size:0.9em;">Active frequencies (try disabling some!):</label><br>
                    ${FREQS.map(k => `<label style="margin-right:12px; cursor:pointer;"><input type="checkbox" class="play-freq" value="${k}" checked> k=${k} (period ${(P/k).toFixed(1)})</label>`).join('')}
                </div>
            </div>

            ${plotDiv('play-plot', '320px')}

            <div id="play-info" style="text-align:center; padding:12px; background:#f0f9ff; border-radius:8px; margin-top:10px; font-size:0.95em;"></div>
        `;
        renderMath();

        function updatePlayground() {
            const playA = parseInt(document.getElementById('play-a').value);
            const playB = parseInt(document.getElementById('play-b').value);
            const playResult = (playA + playB) % P;
            const activeFreqs = Array.from(document.querySelectorAll('.play-freq:checked')).map(el => parseInt(el.value));

            document.getElementById('play-a-val').textContent = playA;
            document.getElementById('play-b-val').textContent = playB;
            document.getElementById('play-result').textContent = playResult;

            const playSignal = tokens.map(c => {
                return activeFreqs.reduce((sum, k) => {
                    const wk = 2 * Math.PI * k / P;
                    return sum + Math.cos(wk * (playA + playB) - wk * c);
                }, 0);
            });

            const maxIdx = playSignal.indexOf(Math.max(...playSignal));
            const isCorrect = maxIdx === playResult;

            Plotly.react('play-plot', [
                { x: tokens, y: playSignal, mode: 'lines', line: { color: '#3b82f6', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.04)', name: 'Logit(c)' },
                { x: [playResult], y: [playSignal[playResult]], mode: 'markers', marker: { size: 14, color: '#ef4444', symbol: 'star' }, name: `Correct: ${playResult}` },
                { x: [maxIdx], y: [playSignal[maxIdx]], mode: 'markers', marker: { size: 10, color: isCorrect ? '#10b981' : '#f59e0b', symbol: 'diamond' }, name: `argmax: ${maxIdx}` },
            ], {
                xaxis: { title: 'Candidate token c', range: [-2, P + 2] },
                yaxis: { title: 'Logit' },
                margin: { t: 20, b: 50,                 l: 50, r: 20 },
                showlegend: true, legend: { x: 0.55, y: 0.95 }
            });

            const infoEl = document.getElementById('play-info');
            if (isCorrect) {
                infoEl.innerHTML = `<span style="color:#059669; font-weight:bold;">&#10003; Correct! argmax = ${maxIdx} = (${playA}+${playB}) mod ${P}</span><br><span style="font-size:0.85em;">${activeFreqs.length} frequency(ies) active. Peak height: ${playSignal[playResult].toFixed(2)} / ${activeFreqs.length}.0</span>`;
            } else {
                infoEl.innerHTML = `<span style="color:#ef4444; font-weight:bold;">&#10007; Wrong! argmax = ${maxIdx}, but correct would be ${playResult}</span><br><span style="font-size:0.85em;">Too few frequencies! Try enabling more.</span>`;
            }
        }

        document.getElementById('play-a').addEventListener('input', updatePlayground);
        document.getElementById('play-b').addEventListener('input', updatePlayground);
        document.querySelectorAll('.play-freq').forEach(el => el.addEventListener('change', updatePlayground));
        updatePlayground();
    }});

    // ── STEP 11: Summary & Grokking ──
    steps.push({ title: 'Summary and Grokking', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 11: Summary</h2>
            <p style="text-align:center; color:#64748b;">Why this is remarkable, and how it connects to "Grokking"</p>

            ${card('1. REPRESENTATION: Numbers as Angles', `
                <p>Modular arithmetic <strong>is</strong> circular: after P you wrap around to 0. The network independently discovered this natural representation ${cite('(Nanda et al., 2023, Section 4.1)', 'nanda2023grokking')}!</p>
                ${mathBlock(`\\underbrace{n}_{\\text{number}} \\;\\mapsto\\; \\underbrace{e^{i\\omega_k n}}_{\\text{point on circle}} = (\\underbrace{\\cos(\\omega_k n)}_{x},\\; \\underbrace{\\sin(\\omega_k n)}_{y})`)}
            `, '#3b82f6')}

            ${card('2. COMPUTATION: Trigonometric Identities', `
                ${mathBlock(`\\underbrace{\\cos(\\alpha + \\beta)}_{\\substack{\\text{what we need:}\\\\\\text{cosine of the sum}}} = \\underbrace{\\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta}_{\\substack{\\text{products that ReLU neurons}\\\\\\text{can compute}}}`)}
                <p>Only multiplication and addition needed. ReLU neurons can approximate quadratic terms (products) because ${mathInline('\\text{ReLU}(x)^2 \\approx x \\cdot y')} patterns emerge in pairs of neurons.</p>
            `, '#059669')}

            ${card('3. SELECTION: Constructive Interference', `
                <p>Each frequency alone has many false peaks. But the false peaks are at <strong>different positions</strong>.</p>
                <p>When summed: only c* has cos=1 everywhere. Everything else cancels out.</p>
                ${mathBlock(`\\underbrace{\\text{Logit}(c^*)}_{\\text{correct answer}} = \\underbrace{1 + 1 + 1 + 1 + 1}_{\\substack{\\text{all 5 frequencies}\\\\\\text{agree: cos}=1}} = 5 \\;\\gg\\; \\underbrace{\\text{Logit}(c \\neq c^*)}_{\\substack{\\text{wrong answers:}\\\\\\text{partial cancellation}}}`)}
            `, '#f59e0b')}

            ${card('4. GROKKING: Sudden Understanding', `
                <p><strong>Phase 1 (Memorization):</strong> The network memorizes training data. Test accuracy stays at ~0%.</p>
                <p><strong>Phase 2 (Generalization):</strong> Weight decay penalizes large weights. The network is forced to find a <strong>compact solution</strong>.</p>
                <p><strong>The Moment:</strong> Suddenly it "discovers" the Fourier algorithm. Test accuracy jumps from ~0% to ~100% in a few hundred steps ${cite('(Power et al., 2022)', 'grokking')}!</p>
                <p>This phenomenon is called <strong>"Grokking"</strong>: sudden understanding after prolonged memorization.</p>
            `, '#8b5cf6')}

            <div style="text-align:center; padding:20px; background:#ecfdf5; border-radius:12px; margin-top:20px;">
                <p style="font-size:1.3em; font-weight:bold; color:#059669; margin:0;">${a} + ${b} mod ${P} = ${correctAnswer}</p>
                <p style="color:#64748b; margin:5px 0 0 0;">Computed by 5 cosine waves and constructive interference &#10003;</p>
            </div>
        `;
        renderMath();
    }});

    // ─── Navigation Logic ────────────────────────────────────────────────────

    let currentStep = 0;

    function updateDots() {
        dotsEl.innerHTML = '';
        steps.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.style.cssText = `width:10px; height:10px; border-radius:50%; cursor:pointer; transition:all 0.2s; display:inline-block; ${i === currentStep ? 'background:#3b82f6; transform:scale(1.3);' : 'background:#cbd5e1;'}`;
            dot.addEventListener('click', () => goToStep(i));
            dotsEl.appendChild(dot);
        });
    }

    function goToStep(idx) {
        if (idx < 0 || idx >= steps.length) return;
        currentStep = idx;
        stepLabel.textContent = `Step ${currentStep + 1} / ${steps.length}: ${steps[currentStep].title}`;
        btnPrev.style.opacity = currentStep === 0 ? '0.4' : '1';
        btnPrev.style.pointerEvents = currentStep === 0 ? 'none' : 'auto';
        btnNext.style.opacity = currentStep === steps.length - 1 ? '0.4' : '1';
        btnNext.style.pointerEvents = currentStep === steps.length - 1 ? 'none' : 'auto';
        btnNext.textContent = currentStep === steps.length - 1 ? 'Done!' : 'Next \u2192';
        btnNext.style.background = currentStep === steps.length - 1 ? '#64748b' : '#22c55e';
        updateDots();
        content.scrollTop = 0;
        steps[currentStep].render();
    }

    btnNext.addEventListener('click', () => goToStep(currentStep + 1));
    btnPrev.addEventListener('click', () => goToStep(currentStep - 1));

    document.addEventListener('keydown', (e) => {
        const rect = root.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goToStep(currentStep + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); goToStep(currentStep - 1); }
    });

    // ─── Initialize ──────────────────────────────────────────────────────────
    goToStep(0);
}

document.addEventListener('DOMContentLoaded', function() {
	if (typeof renderFourierAlgorithm === 'function') {
		renderFourierAlgorithm('fourier-algorithm-container', { a: 42, b: 80, P: 113 });
	}
});
