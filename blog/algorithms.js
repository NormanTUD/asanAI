/**
 * Fourier Multiplication Algorithm — Interactive Step-by-Step Visualization
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

    const a = options.a ?? 42;
    const b = options.b ?? 80;
    const P = options.P ?? 113;
    const correctAnswer = (a + b) % P;
    const KEY_FREQS = [14, 35, 41, 42, 52];

    // ─── Precompute ──────────────────────────────────────────────────────────
    const tokens = Array.from({ length: P }, (_, i) => i);

    function computeSignals(aa, bb, freqs) {
        const sigs = freqs.map(k => {
            const wk = 2 * Math.PI * k / P;
            return tokens.map(c => Math.cos(wk * (aa + bb) - wk * c));
        });
        const total = tokens.map((_, i) => sigs.reduce((s, sig) => s + sig[i], 0));
        return { sigs, total };
    }

    let { sigs: allSignals, total: totalSignal } = computeSignals(a, b, KEY_FREQS);
    const expT = totalSignal.map(v => Math.exp(v));
    const expSum = expT.reduce((s, v) => s + v, 0);
    const softmaxSignal = expT.map(v => v / expSum);

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
                try { temml.render(el.getAttribute('data-tex'), el, { displayMode: true }); } catch (e) { el.textContent = el.getAttribute('data-tex'); }
            });
            root.querySelectorAll('.math-inline').forEach(el => {
                try { temml.render(el.getAttribute('data-tex'), el, { displayMode: false }); } catch (e) { el.textContent = el.getAttribute('data-tex'); }
            });
        } else if (typeof render_temml === 'function') {
            render_temml();
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
    root.style.maxWidth = '880px';
    root.style.margin = '0 auto';

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

    const dots = document.createElement('div');
    dots.style.cssText = 'display:flex; justify-content:center; gap:7px; margin-top:16px; padding:12px;';
    root.appendChild(dots);

    // ─── Steps ───────────────────────────────────────────────────────────────
    const steps = [];

    // ── STEP 0 ──
    steps.push({ title: 'The Problem', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 0: The Problem</h2>
            <p style="text-align:center; color:#64748b;">What does the network need to compute?</p>
            ${card('The Task', `
                <div style="text-align:center; font-size:1.4em; padding:14px; background:#f0f9ff; border-radius:8px;">
                    <strong>${a} + ${b} mod ${P} = ?</strong>
                </div>
                <p>A tiny Transformer (1 attention layer, 1 MLP layer) receives two number-tokens and must output the correct answer from ${P} possible tokens.</p>
                <p>Correct answer: <span style="color:#16a34a; font-weight:bold; font-size:1.2em;">${correctAnswer}</span></p>
            `)}
            ${card('The Architecture', `
                <ul style="margin:0; padding-left:20px;">
                    <li>1 Attention layer (4 heads)</li>
                    <li>1 MLP layer (512 neurons, ReLU)</li>
                    <li>Vocabulary: ${P} tokens (numbers 0–${P - 1})</li>
                </ul>
                <p>Despite its tiny size, this network achieves <strong>100% accuracy</strong> after "grokking" ${cite('(Power et al., 2022)', 'grokking')}.</p>
            `, '#8b5cf6')}
            ${card('The Discovered Algorithm', `
                <p>The network independently discovers a Fourier-based algorithm ${cite('(Nanda et al., 2023)', 'nanda2023grokking')}:</p>
                <ol style="padding-left:20px;">
                    <li><strong>Numbers → Angles:</strong> Each number becomes a point on a circle</li>
                    <li><strong>Addition → Rotation:</strong> Adding numbers = adding angles</li>
                    <li><strong>Interference → Selection:</strong> Multiple waves combine so only the correct answer survives</li>
                </ol>
            `, '#059669')}
        `;
        renderMath();
    }});

    // ── STEP 1 ──
    steps.push({ title: 'What is a Frequency k?', render() {
        const k = 14;
        const wk = 2 * Math.PI * k / P;
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 1: What is a Frequency ${mathInline('k')}?</h2>
            <p style="text-align:center; color:#64748b;">The fundamental idea: represent numbers as angles on a circle</p>
            ${card('The Core Formula', `
                ${mathBlock(`\\omega_k = \\frac{2\\pi \\cdot k}{P}`)}
                <p style="text-align:center;">For ${mathInline('k=14')}, ${mathInline('P=113')}:</p>
                ${mathBlock(`\\omega_{14} = \\frac{2\\pi \\cdot 14}{113} = ${wk.toFixed(5)} \\text{ rad}`)}
            `)}
            ${card('What does this mean?', `
                <p>${mathInline('\\omega_k')} is the <strong>angular velocity</strong>. It determines how fast a point rotates around the unit circle as we count from 0 to 112.</p>
                <ul>
                    <li>${mathInline('k=1')}: Each number advances the point by ${mathInline('\\frac{2\\pi}{113}')} radians</li>
                    <li>${mathInline('k=14')}: Each number advances by ${mathInline('\\frac{2\\pi \\cdot 14}{113}')} → <strong>14 full rotations</strong> from 0 to 112</li>
                </ul>
            `, '#8b5cf6')}
            ${card('Why is this useful?', `
                <p>Because addition of numbers becomes addition of angles:</p>
                ${mathBlock(`\\underbrace{\\cos(\\omega_k \\cdot (a+b))}_{\\text{angle for the sum}} = \\cos(\\underbrace{\\omega_k \\cdot a}_{\\text{angle for }a} + \\underbrace{\\omega_k \\cdot b}_{\\text{angle for }b})`)}
                <p>And angle-addition can be computed with simple multiplications (the addition theorem)!</p>
            `, '#059669')}
            <p style="text-align:center; color:#64748b; font-size:0.9em;">The trained network uses 5 frequencies: ${mathInline('k \\in \\{14, 35, 41, 42, 52\\}')}</p>
        `;
        renderMath();
    }});

    // ── STEP 2 ──
    steps.push({ title: 'Embedding: Number → Circle', render() {
        const k = 14, wk = 2 * Math.PI * k / P;
        const angA = wk * a, cosA = Math.cos(angA), sinA = Math.sin(angA);
        const angB = wk * b, cosB = Math.cos(angB), sinB = Math.sin(angB);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 2: Embedding</h2>
            <p style="text-align:center; color:#64748b;">Each number is mapped to a point on the unit circle</p>
            ${card('The Formula', `
                ${mathBlock(`\\underbrace{a}_{\\text{input token}} \\;\\mapsto\\; \\left(\\underbrace{\\cos(\\omega_k \\cdot a)}_{x\\text{-coordinate}},\\; \\underbrace{\\sin(\\omega_k \\cdot a)}_{y\\text{-coordinate}}\\right)`)}
                <p>Concretely for ${mathInline('k=14')}:</p>
                <table style="width:100%; border-collapse:collapse; font-size:0.9em; margin-top:8px;">
                    <tr style="background:#fef2f2;"><td style="padding:6px 10px; border:1px solid #e2e8f0;"><strong>a = ${a}</strong></td><td style="padding:6px 10px; border:1px solid #e2e8f0;">(${cosA.toFixed(4)}, ${sinA.toFixed(4)})</td></tr>
                    <tr style="background:#eff6ff;"><td style="padding:6px 10px; border:1px solid #e2e8f0;"><strong>b = ${b}</strong></td><td style="padding:6px 10px; border:1px solid #e2e8f0;">(${cosB.toFixed(4)}, ${sinB.toFixed(4)})</td></tr>
                </table>
            `)}
            ${plotDiv('step2-circle', '380px')}
            ${card('What is happening here?', `
                <p>The <strong>embedding matrix</strong> ${mathInline('W_E')} of the Transformer contains exactly these cos/sin values. When token "${a}" is fed in, it gets mapped to this vector. The same happens for all 5 frequencies simultaneously — so each number becomes 5 points on 5 different circles.</p>
            `, '#64748b')}
        `;
        renderMath();

        const theta = Array.from({ length: 100 }, (_, i) => i * 2 * Math.PI / 99);
        Plotly.newPlot('step2-circle', [
            { x: theta.map(Math.cos), y: theta.map(Math.sin), mode: 'lines', line: { color: '#e2e8f0', width: 1 }, showlegend: false, hoverinfo: 'skip' },
            { x: [0, cosA], y: [0, sinA], mode: 'lines+markers', line: { color: '#ef4444', width: 3 }, marker: { size: [4, 12], color: '#ef4444' }, name: `a=${a}` },
            { x: [0, cosB], y: [0, sinB], mode: 'lines+markers', line: { color: '#3b82f6', width: 3 }, marker: { size: [4, 12], color: '#3b82f6', symbol: 'square' }, name: `b=${b}` },
        ], {
            xaxis: { range: [-1.4, 1.4], zeroline: true, scaleanchor: 'y', title: 'cos' },
            yaxis: { range: [-1.4, 1.4], zeroline: true, title: 'sin' },
            margin: { t: 30, b: 50, l: 55, r: 20 },
            title: { text: `Both numbers on the unit circle (k=${k})`, font: { size: 13 } },
            showlegend: true, legend: { x: 0.01, y: 0.99 }
        }, { responsive: true });
    }});

    // ── STEP 3 ──
    steps.push({ title: 'The Addition Theorem', render() {
        const k = 14, wk = 2 * Math.PI * k / P;
        const angA = wk * a, angB = wk * b, angS = wk * (a + b);
        const cosA = Math.cos(angA), sinA = Math.sin(angA);
        const cosB = Math.cos(angB), sinB = Math.sin(angB);
        const cosS = Math.cos(angS), sinS = Math.sin(angS);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 3: The Addition Theorem</h2>
            <p style="text-align:center; color:#64748b;">The Attention + MLP layers compute the angle-sum using trigonometric identities</p>
            ${card('The Key Identity', `
                <p>This is the mathematical heart of the algorithm:</p>
                ${mathBlock(`\\overbrace{\\cos(\\omega_k(a+b))}^{\\text{what we want}} = \\underbrace{\\cos(\\omega_k a)}_{\\text{known from }W_E} \\cdot \\underbrace{\\cos(\\omega_k b)}_{\\text{known from }W_E} - \\underbrace{\\sin(\\omega_k a)}_{\\text{known from }W_E} \\cdot \\underbrace{\\sin(\\omega_k b)}_{\\text{known from }W_E}`)}
                ${mathBlock(`\\overbrace{\\sin(\\omega_k(a+b))}^{\\text{what we want}} = \\sin(\\omega_k a)\\cos(\\omega_k b) + \\cos(\\omega_k a)\\sin(\\omega_k b)`)}
            `, '#059669')}
            ${card('Concrete Calculation (k=14)', `
                <table style="width:100%; border-collapse:collapse; font-size:0.88em;">
                    <tr style="background:#f8fafc;"><td style="padding:6px; border:1px solid #e2e8f0;">cos(w·a) · cos(w·b)</td><td style="padding:6px; border:1px solid #e2e8f0;">${cosA.toFixed(4)} × ${cosB.toFixed(4)} = ${(cosA * cosB).toFixed(5)}</td></tr>
                    <tr><td style="padding:6px; border:1px solid #e2e8f0;">sin(w·a) · sin(w·b)</td><td style="padding:6px; border:1px solid #e2e8f0;">${sinA.toFixed(4)} × ${sinB.toFixed(4)} = ${(sinA * sinB).toFixed(5)}</td></tr>
                    <tr style="background:#ecfdf5;"><td style="padding:6px; border:1px solid #e2e8f0; font-weight:bold; color:#059669;">cos(w·(a+b))</td><td style="padding:6px; border:1px solid #e2e8f0; font-weight:bold; color:#059669;">${(cosA * cosB - sinA * sinB).toFixed(5)} (check: ${cosS.toFixed(5)}) ✓</td></tr>
                </table>
            `, '#3b82f6')}
            ${plotDiv('step3-circle', '360px')}
            ${card('Who does what in the network?', `
                <ul>
                    <li><strong>Attention (4 heads):</strong> Moves information from position a and position b to the output position. Creates the products cos·cos, sin·sin, etc.</li>
                    <li><strong>MLP (512 ReLU neurons):</strong> Each neuron approximates one quadratic term. Together they compute the addition theorem ${cite('(Nanda et al., 2023, §4.2)', 'nanda2023grokking')}.</li>
                </ul>
            `, '#8b5cf6')}
        `;
        renderMath();

        const theta = Array.from({ length: 100 }, (_, i) => i * 2 * Math.PI / 99);
        Plotly.newPlot('step3-circle', [
            { x: theta.map(Math.cos), y: theta.map(Math.sin), mode: 'lines', line: { color: '#e2e8f0', width: 1 }, showlegend: false, hoverinfo: 'skip' },
            { x: [0, cosA], y: [0, sinA], mode: 'lines+markers', line: { color: '#ef4444', width: 1.5, dash: 'dot' }, marker: { size: [3, 7] }, name: `a=${a}`, opacity: 0.5 },
            { x: [0, cosB], y: [0, sinB], mode: 'lines+markers', line: { color: '#3b82f6', width: 1.5, dash: 'dot' }, marker: { size: [3, 7] }, name: `b=${b}`, opacity: 0.5 },
            { x: [0, cosS], y: [0, sinS], mode: 'lines+markers', line: { color: '#059669', width: 4 }, marker: { size: [4, 14], symbol: ['circle', 'triangle-up'] }, name: `a+b mod P = ${correctAnswer}` },
        ], {
            xaxis: { range: [-1.4, 1.4], zeroline: true, scaleanchor: 'y', title: 'cos' },
            yaxis: { range: [-1.4, 1.4], zeroline: true, title: 'sin' },
            margin: { t: 25, b: 50, l: 55, r: 20 },
            showlegend: true, legend: { x: 0.01, y: 0.99 }
        }, { responsive: true });
    }});

    // ── STEP 4 ──
    steps.push({ title: 'Unembedding: Compare with All Tokens', render() {
        const k = 14;
        const signal = allSignals[0];
        const falseCount = signal.filter((v, i) => v > 0.9 && i !== correctAnswer).length;
        const falsePeaks = tokens.filter(c => signal[c] > 0.9 && c !== correctAnswer);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 4: Unembedding</h2>
            <p style="text-align:center; color:#64748b;">For every possible output token c, compute: how well does it match?</p>
            ${card('The Formula', `
                <p>For <strong>each</strong> candidate token ${mathInline('c \\in \\{0, 1, \\ldots, 112\\}')}:</p>
                ${mathBlock(`\\text{Logit}(c) = \\underbrace{\\cos(\\omega_k \\cdot (a+b))}_{\\text{computed by MLP}} \\cdot \\underbrace{\\cos(\\omega_k \\cdot c)}_{\\text{from }W_U} + \\underbrace{\\sin(\\omega_k \\cdot (a+b))}_{\\text{computed by MLP}} \\cdot \\underbrace{\\sin(\\omega_k \\cdot c)}_{\\text{from }W_U}`)}
                ${mathBlock(`= \\cos(\\omega_k \\cdot (a+b-c))`)}
                <p>This is a <strong>dot product</strong> between the MLP output and row $c$ of the unembedding matrix ${mathInline('W_U')}.</p>
            `, '#3b82f6')}
            ${card('How to read the plot below', `
                <p>We evaluate ${mathInline('\\cos(\\omega_k(a+b-c))')} for all 113 tokens:</p>
                <ul>
                    <li>At ${mathInline(`c^* = ${correctAnswer}`)}: ${mathInline(`a+b-c^* = 0`)} mod ${P} → ${mathInline('\\cos(0) = 1')} ✓ (maximum!)</li>
                    <li>At other values of c: the cosine is less than 1</li>
                    <li><strong>Problem:</strong> cosine is periodic with period ${mathInline(`P/k \\approx ${(P / k).toFixed(1)}`)} → there are <strong>${falseCount} false peaks</strong> above 0.9!</li>
                </ul>
            `, '#f59e0b')}
            ${plotDiv('step4-plot', '320px')}
        `;
        renderMath();

        Plotly.newPlot('step4-plot', [
            { x: tokens, y: signal, mode: 'lines', line: { color: '#3b82f6', width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.04)', name: `cos(w_${k}·(a+b-c))` },
            { x: [correctAnswer], y: [signal[correctAnswer]], mode: 'markers', marker: { size: 13, color: '#ef4444', symbol: 'star' }, name: `Correct: c*=${correctAnswer}` },
            { x: falsePeaks, y: falsePeaks.map(c => signal[c]), mode: 'markers', marker: { size: 7, color: '#f59e0b' }, name: `False peaks (${falsePeaks.length})` },
        ], {
            xaxis: { title: 'Output token c', range: [-2, P + 2] },
            yaxis: { title: `cos(w_${k}·(a+b-c))`, range: [-1.3, 1.4] },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            shapes: [{ type: 'line', x0: 0, x1: P, y0: 0, y1: 0, line: { color: '#94a3b8', width: 0.5 } }],
            showlegend: true, legend: { x: 0.55, y: 0.98 }
        }, { responsive: true });
    }});

    // ── STEP 5 ──
    steps.push({ title: 'Why One Frequency Fails', render() {
        const k = 14;
        const signal = allSignals[0];
        const highPeaks = tokens.filter(c => signal[c] > 0.9);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">
Step 5: Why One Frequency Fails</h2>
                <p style="text-align:center; color:#64748b;">Cosine is periodic — there are too many "false" peaks!</p>

                ${card('The Problem', `
                    <p>The function ${mathInline('\\cos(\\omega_k \\cdot x)')} has a <strong>period</strong> of ${mathInline('P/k')}:</p>
                    ${mathBlock(`\\overbrace{\\cos(\\omega_k \\cdot x)}^{\\text{repeats every } P/k \\text{ tokens}} \\quad \\text{Period} = \\frac{P}{k} = \\frac{${P}}{${k}} \\approx ${(P/k).toFixed(1)}`)}
                    <p>This means: every <strong>~${Math.round(P/k)} tokens</strong>, the pattern repeats and there is a new peak!</p>
                    <p>Result: <strong>${highPeaks.length} tokens</strong> have activation > 0.9. The network cannot distinguish them!</p>
                `, '#ef4444')}

                ${plotDiv('step5-plot', '300px')}

                ${card('The Solution: Multiple Frequencies!', `
                    <p>If we combine <strong>multiple frequencies</strong> with <strong>different periods</strong>:</p>
                    <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
                        <tr style="background:#f8fafc;"><th style="padding:6px; border:1px solid #e2e8f0;">k</th><th style="padding:6px; border:1px solid #e2e8f0;">Period P/k</th><th style="padding:6px; border:1px solid #e2e8f0;">Meaning</th></tr>
                        ${keyFrequencies.map(kk => `<tr><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">${kk}</td><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">≈${(P/kk).toFixed(1)}</td><td style="padding:6px; border:1px solid #e2e8f0;">False peaks every ~${Math.round(P/kk)} tokens</td></tr>`).join('')}
                    </table>
                    <p style="margin-top:10px;">The false peaks of each frequency are at <strong>different positions</strong>!</p>
                    <p style="color:#059669; font-weight:bold;">→ Only at c* = ${correctAnswer} do ALL frequencies agree simultaneously!</p>
                `, '#059669')}
            `;
            renderMath();

            Plotly.newPlot('step5-plot', [
                { x: tokens, y: signal, mode: 'lines', line: { color: '#3b82f6', width: 1.2 }, showlegend: false },
                { x: highPeaks, y: highPeaks.map(c => signal[c]), mode: 'markers', marker: { size: 7, color: '#f59e0b' }, name: `${highPeaks.length} peaks > 0.9` },
                { x: [correctAnswer], y: [1.0], mode: 'markers', marker: { size: 14, color: '#ef4444', symbol: 'star' }, name: `Correct: c*=${correctAnswer}` },
            ], {
                xaxis: { title: 'Token c' },
                yaxis: { title: `cos(ω_${k}·(a+b-c))`, range: [-1.2, 1.4] },
                margin: { t: 20, b: 50, l: 55, r: 20 },
                shapes: [
                    { type: 'line', x0: 0, x1: P, y0: 0.9, y1: 0.9, line: { color: '#f59e0b', width: 1, dash: 'dot' } },
                    { type: 'line', x0: 0, x1: P, y0: 0, y1: 0, line: { color: '#94a3b8', width: 0.5 } }
                ],
                showlegend: true, legend: { x: 0.6, y: 0.5 }
            }, { responsive: true });
        }
    });

    // ── STEP 6 ──
    steps.push({ title: 'All 5 Frequencies Together', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 6: All 5 Frequencies</h2>
            <p style="text-align:center; color:#64748b;">Each frequency peaks at c*=${correctAnswer}, but their false peaks are at different positions</p>

            ${card('How each row is computed', `
                <p>For each frequency ${mathInline('k')}, we compute:</p>
                ${mathBlock(`f_k(c) = \\cos\\left(\\underbrace{\\frac{2\\pi k}{${P}}}_{\\omega_k} \\cdot \\overbrace{(${a}+${b}-c)}^{\\text{difference to sum}}\\right)`)}
                <p>Each frequency has a different period ${mathInline('P/k')}, so the false peaks land at <strong>different positions</strong>.</p>
            `, '#3b82f6')}

            ${plotDiv('step6-plot', '380px')}

            ${card('Key Observation', `
                <p>The <span style="color:#ef4444;">red dashed line</span> at c*=${correctAnswer} hits <strong>every single peak</strong>. But the other peaks are scattered everywhere else!</p>
                <p style="font-weight:bold; color:#059669;">→ Next step: Sum all 5 signals. Only c* survives!</p>
            `, '#059669')}
        `;
        renderMath();

        const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
        const traces = keyFrequencies.map((k, i) => ({
            x: tokens,
            y: allSignals[i].map(v => v + i * 2.5),
            mode: 'lines',
            line: { color: colors[i], width: 1.3 },
            name: `k=${k} (P/k≈${(P/k).toFixed(1)})`,
        }));
        keyFrequencies.forEach((k, i) => {
            traces.push({
                x: [correctAnswer],
                y: [allSignals[i][correctAnswer] + i * 2.5],
                mode: 'markers',
                marker: { size: 8, color: '#ef4444' },
                showlegend: false,
            });
        });

        Plotly.newPlot('step6-plot', traces, {
            xaxis: { title: 'Output token c', range: [-2, P + 2] },
            yaxis: { showticklabels: false },
            margin: { t: 20, b: 50, l: 30, r: 20 },
            shapes: [{ type: 'line', x0: correctAnswer, x1: correctAnswer, y0: -1, y1: 12.5, line: { color: '#ef4444', width: 1.5, dash: 'dash' } }],
            showlegend: true, legend: { x: 0.72, y: 0.98 }
        }, { responsive: true });
    }});

    // ── STEP 7 ──
    steps.push({ title: 'Constructive Interference', render() {
        const maxVal = totalSignal[correctAnswer];
        const sorted = [...totalSignal].map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
        const second = sorted[0].i === correctAnswer ? sorted[1] : sorted[0];

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 7: Constructive Interference</h2>
            <p style="text-align:center; color:#64748b;">The sum of all 5 waves — only the correct answer survives!</p>

            ${card('The Formula', `
                ${mathBlock(`\\text{Logit}(c) = \\underbrace{\\sum_{k \\in \\{14,35,41,42,52\\}} \\cos(\\omega_k \\cdot (a+b-c))}_{\\text{sum of 5 cosine waves}}`)}
            `, '#3b82f6')}

            ${plotDiv('step7-plot', '340px')}

            ${card('Why is c* the maximum?', `
                <p>At ${mathInline(`c^* = ${correctAnswer}`)}:</p>
                ${mathBlock(`\\underbrace{a + b - c^*}_{${a}+${b}-${correctAnswer}} = ${(a+b)-correctAnswer} \\equiv 0 \\pmod{${P}}`)}
                ${mathBlock(`\\Rightarrow \\omega_k \\cdot 0 = 0 \\quad \\Rightarrow \\quad \\underbrace{\\cos(0)}_{=1} \\text{ for ALL } k`)}
                ${mathBlock(`\\Rightarrow \\text{Sum} = \\underbrace{1 + 1 + 1 + 1 + 1}_{\\text{5 frequencies}} = 5 = \\text{Maximum!}`)}
                <p>At every other c: the cosine values are different for different k → they partially cancel out (<strong>destructive interference</strong>).</p>
                <p>2nd highest peak: c=${second.i} with logit=${second.v.toFixed(3)} (far below ${maxVal.toFixed(0)}!)</p>
            `, '#059669')}

            ${card('Analogy', `
                <p>Think of a lock with <strong>5 tumblers</strong>. Each frequency is one tumbler. Only the correct key (c*=${correctAnswer}) fits all 5 simultaneously. Every other key fails at least one tumbler.</p>
            `, '#8b5cf6')}
        `;
        renderMath();

        Plotly.newPlot('step7-plot', [
            { x: tokens, y: totalSignal, mode: 'lines', line: { color: '#3b82f6', width: 2.5 }, fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.06)', name: 'Sum' },
            { x: [correctAnswer], y: [maxVal], mode: 'markers', marker: { size: 16, color: '#ef4444', symbol: 'star' }, name: `c*=${correctAnswer} (logit=${maxVal.toFixed(0)})` },
            { x: [second.i], y: [second.v], mode: 'markers', marker: { size: 10, color: '#f59e0b' }, name: `2nd: c=${second.i} (${second.v.toFixed(2)})` },
        ], {
            xaxis: { title: 'Output token c', range: [-2, P + 2] },
            yaxis: { title: 'Total logit = Σ cos(ω_k·(a+b-c))' },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            shapes: [{ type: 'line', x0: 0, x1: P, y0: 0, y1: 0, line: { color: '#94a3b8', width: 0.5 } }],
            showlegend: true, legend: { x: 0.5, y: 0.95 }
        }, { responsive: true });
    }});

    // ── STEP 8 ──
    steps.push({ title: 'Softmax: Logits → Probabilities', render() {
        const prob = softmaxSignal[correctAnswer];

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 8: Softmax</h2>
            <p style="text-align:center; color:#64748b;">Converting raw logits into a probability distribution</p>

            ${card('The Formula', `
                ${mathBlock(`P(c) = \\frac{\\overbrace{\\exp(\\text{Logit}(c))}^{\\text{exponentiate to make positive}}}{\\underbrace{\\sum_{j=0}^{${P-1}} \\exp(\\text{Logit}(j))}_{\\text{normalize so all sum to 1}}}`)}
                <p>Softmax turns raw logit scores into probabilities (all values between 0 and 1, summing to 1).</p>
            `, '#3b82f6')}

            ${plotDiv('step8-plot', '300px')}

            ${card('Result', `
                <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
                    <tr style="background:#f8fafc;"><td style="padding:8px; border:1px solid #e2e8f0;">Logit(c*=${correctAnswer})</td><td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold;">${totalSignal[correctAnswer].toFixed(3)}</td></tr>
                    <tr><td style="padding:8px; border:1px solid #e2e8f0;">exp(Logit(c*))</td><td style="padding:8px; border:1px solid #e2e8f0;">${Math.exp(totalSignal[correctAnswer]).toFixed(2)}</td></tr>
                    <tr style="background:#ecfdf5;"><td style="padding:8px; border:1px solid #e2e8f0; color:#059669; font-weight:bold;">P(c*=${correctAnswer})</td><td style="padding:8px; border:1px solid #e2e8f0; color:#059669; font-weight:bold;">${(prob * 100).toFixed(2)}%</td></tr>
                </table>
                <p style="margin-top:10px;">In reality (with learned weights ${mathInline('\\alpha_k')}), the peak is <strong>much sharper</strong>: P(c*) > 99%.</p>
                <p style="color:#059669; font-weight:bold; font-size:1.1em;">argmax P(c) = ${correctAnswer} = (${a}+${b}) mod ${P} ✓</p>
            `, '#059669')}
        `;
        renderMath();

        Plotly.newPlot('step8-plot', [
            { x: tokens, y: softmaxSignal.map(v => v * 100), mode: 'lines', line: { color: '#10b981', width: 2.5 }, fill: 'tozeroy', fillcolor: 'rgba(16,185,129,0.08)', name: 'P(c) [%]' },
            { x: [correctAnswer], y: [prob * 100], mode: 'markers', marker: { size: 14, color: '#ef4444', symbol: 'star' }, name: `c*=${correctAnswer}: ${(prob*100).toFixed(2)}%` },
        ], {
            xaxis: { title: 'Output token c', range: [-2, P + 2] },
            yaxis: { title: 'Probability [%]', rangemode: 'tozero' },
            margin: { t: 20, b: 50, l: 55, r: 20 },
            showlegend: true, legend: { x: 0.55, y: 0.95 }
        }, { responsive: true });
    }});

    // ── STEP 9 ──
    steps.push({ title: 'Complete Algorithm', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 9: The Complete Algorithm</h2>
            <p style="text-align:center; color:#64748b;">All formulas at a glance — this is how the Transformer computes modular addition ${cite('(Nanda et al., 2023)', 'nanda2023grokking')}</p>

            ${card('(1) EMBEDDING — Numbers become circle-points', `
                ${mathBlock(`\\underbrace{a}_{\\text{input token}} \\;\\mapsto\\; \\left(\\cos(\\omega_k \\cdot a),\\; \\sin(\\omega_k \\cdot a)\\right) \\quad \\text{where } \\omega_k = \\frac{2\\pi k}{P},\\; k \\in \\{14, 35, 41, 42, 52\\}`)}
                <p style="color:#64748b; font-size:0.85em;">The embedding matrix ${mathInline('W_E')} maps each number to 5 points on 5 different circles.</p>
            `, '#3b82f6')}

            ${card('(2) ATTENTION — Bringing information together', `
                <p>The 4 attention heads compute products of Fourier components:</p>
                ${mathBlock(`\\underbrace{\\cos(\\omega_k a) \\cdot \\cos(\\omega_k b)}_{\\text{head 0}}, \\quad \\underbrace{\\sin(\\omega_k a) \\cdot \\sin(\\omega_k b)}_{\\text{head 1}}, \\quad \\underbrace{\\sin(\\omega_k a) \\cdot \\cos(\\omega_k b)}_{\\text{head 2}}, \\quad \\ldots`)}
            `, '#8b5cf6')}

            ${card('(3) MLP — Applying addition theorems', `
                <p>512 ReLU neurons compute the trigonometric identities:</p>
                ${mathBlock(`\\overbrace{\\cos(\\omega_k(a+b))}^{\\text{output}} = \\underbrace{\\cos(\\omega_k a)\\cos(\\omega_k b) - \\sin(\\omega_k a)\\sin(\\omega_k b)}_{\\text{addition theorem}}`)}
            `, '#059669')}

            ${card('(4) UNEMBEDDING — Compare with all tokens', `
                ${mathBlock(`\\text{Logit}(c) = \\sum_{k} \\alpha_k \\cdot \\underbrace{\\cos(\\omega_k \\cdot (a+b-c))}_{\\substack{= 1 \\text{ when } c = c^* \\\\ < 1 \\text{ otherwise}}}`)}
            `, '#f59e0b')}

            ${card('(5) SOFTMAX + ARGMAX — Final answer', `
                ${mathBlock(`c^* = \\arg\\max_c \\frac{\\exp(\\text{Logit}(c))}{\\sum_j \\exp(\\text{Logit}(j))} = ${correctAnswer}`)}
                <div style="text-align:center; padding:12px; background:#ecfdf5; border-radius:8px; margin-top:10px;">
                    <span style="font-size:1.3em; font-weight:bold; color:#059669;">${a} + ${b} mod ${P} = ${correctAnswer} ✓</span>
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
                    ${keyFrequencies.map(k => `<label style="margin-right:12px; cursor:pointer;"><input type="checkbox" class="play-freq" value="${k}" checked> k=${k} (P/k≈${(P/k).toFixed(1)})</label>`).join('')}
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
                xaxis: { title: 'Token c', range: [-2, P + 2] },
                yaxis: { title: 'Logit' },
                margin: { t: 20, b: 50, l: 50, r: 20 },
                showlegend: true, legend: { x: 0.55, y: 0.95 }
            });

            const infoEl = document.getElementById('play-info');
            if (isCorrect) {
                infoEl.innerHTML = `<span style="color:#059669; font-weight:bold;">✓ Correct! argmax = ${maxIdx} = (${playA}+${playB}) mod ${P}</span><br><span style="font-size:0.85em;">${activeFreqs.length} frequency(ies) active. Peak height: ${playSignal[playResult].toFixed(2)} / ${activeFreqs.length}.0</span>`;
            } else {
                infoEl.innerHTML = `<span style="color:#ef4444; font-weight:bold;">✗ Wrong! argmax = ${maxIdx}, but correct would be ${playResult}</span><br><span style="font-size:0.85em;">Too few frequencies! Try enabling more.</span>`;
            }
        }

        document.getElementById('play-a').addEventListener('input', updatePlayground);
        document.getElementById('play-b').addEventListener('input', updatePlayground);
        document.querySelectorAll('.play-freq').forEach(el => el.addEventListener('change', updatePlayground));
        updatePlayground();
    }});

    // ── STEP 11: Summary & Grokking ──
    steps.push({ title: 'Summary & Grokking', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Step 11: Summary</h2>
            <p style="text-align:center; color:#64748b;">Why this is remarkable, and how it connects to "Grokking"</p>

            ${card('1. REPRESENTATION: Numbers as Angles', `
                <p>Modular arithmetic <strong>is</strong> circular — after P you wrap around to 0. The network independently discovered this natural representation ${cite('(Nanda et al., 2023, §4.1)', 'nanda2023grokking')}!</p>
                ${mathBlock(`n \\mapsto e^{i\\omega_k n} = (\\cos(\\omega_k n),\\; \\sin(\\omega_k n))`)}
            `, '#3b82f6')}

            ${card('2. COMPUTATION: Trigonometric Identities', `
                ${mathBlock(`\\underbrace{\\cos(\\alpha + \\beta)}_{\\text{what we need}} = \\underbrace{\\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta}_{\\text{products the MLP can compute}}`)}
                <p>Only multiplication and addition needed — perfect for neurons! ReLU neurons can approximate quadratic terms (products).</p>
            `, '#059669')}

            ${card('3. SELECTION: Constructive Interference', `
                <p>Each frequency alone has many false peaks. But the false peaks are at <strong>different positions</strong>.</p>
                <p>When summed: only c* has cos=1 everywhere → <strong>constructive interference</strong>. Everything else cancels out.</p>
                ${mathBlock(`\\text{Logit}(c^*) = \\underbrace{1 + 1 + 1 + 1 + 1}_{\\text{all cos}=1} = 5 \\gg \\text{Logit}(c \\neq c^*)`)}
            `, '#f59e0b')}

            ${card('4. GROKKING: Sudden Understanding', `
                <p><strong>Phase 1 (Memorization):</strong> The network memorizes training data. Test accuracy stays at ~0%.</p>
                <p><strong>Phase 2 (Generalization):</strong> Weight decay penalizes large weights. The network is forced to find a <strong>compact solution</strong>.</p>
                <p><strong>The Moment:</strong> Suddenly it "discovers" the Fourier algorithm. Test accuracy jumps from ~0% to ~100% in a few hundred steps ${cite('(Power et al., 2022)', 'grokking')}!</p>
                <p>This phenomenon is called <strong>"Grokking"</strong> — sudden understanding after prolonged memorization.</p>
            `, '#8b5cf6')}

            <div style="text-align:center; padding:20px; background:#ecfdf5; border-radius:12px; margin-top:20px;">
                <p style="font-size:1.3em; font-weight:bold; color:#059669; margin:0;">${a} + ${b} mod ${P} = ${correctAnswer}</p>
                <p style="color:#64748b; margin:5px 0 0 0;">Computed by 5 cosine waves and constructive interference ✓</p>
            </div>
        `;
        renderMath();
    }});

    // ─── Navigation Logic ────────────────────────────────────────────────────

    let currentStep = 0;

    function updateDots() {
        dots.innerHTML = '';
        steps.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.style.cssText = `width:10px; height:10px; border-radius:50%; cursor:pointer; transition:all 0.2s; display:inline-block; ${i === currentStep ? 'background:#3b82f6; transform:scale(1.3);' : 'background:#cbd5e1;'}`;
            dot.addEventListener('click', () => goToStep(i));
            dots.appendChild(dot);
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

    // ─── Initialize ──────────────────────────────────────
    goToStep(0);
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof renderFourierAlgorithm === 'function') {
        renderFourierAlgorithm('fourier-algorithm-container', { a: 42, b: 80, P: 113 });
    }
});

