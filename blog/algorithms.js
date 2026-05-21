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
            <h2 style="text-align:center; color:#1e293b;">The Problem</h2>
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
        const baseAngle = 2 * Math.PI / P;

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">What is a Frequency ${mathInline('k')}?</h2>
            <p style="text-align:center; color:#64748b;">The fundamental idea: represent numbers as angles on a circle</p>

            ${card('The Core Formula', `
                ${mathBlock(`\\omega_k = \\underbrace{\\frac{2\\pi}{P}}_{\\text{base angle} = \\frac{2\\pi}{${P}} = ${baseAngle.toFixed(6)}} \\cdot \\underbrace{k}_{\\text{frequency index}}`)}
                <p style="text-align:center;">For ${mathInline(`k = ${k}`)}, ${mathInline(`P = ${P}`)}:</p>
                ${mathBlock(`\\omega_{${k}} = \\frac{2\\pi}{${P}} \\cdot ${k} = ${baseAngle.toFixed(6)} \\cdot ${k} = ${wk.toFixed(6)} \\text{ rad}`)}
            `)}

            ${card('From 0.055603... to radians: step by step', `
                <p>The value ${mathInline(`${baseAngle.toFixed(6)}`)} <strong>is already in radians</strong>. Here's why:</p>
                <ol style="padding-left:20px;">
                    <li><strong>Start:</strong> ${mathInline(`2\\pi = 6.283185\\ldots`)} radians (one full circle)</li>
                    <li><strong>Divide by P:</strong> ${mathInline(`\\frac{6.283185\\ldots}{${P}} = ${baseAngle.toFixed(6)}`)} rad — this is the <em>angular step per number</em></li>
                    <li><strong>Multiply by k:</strong> ${mathInline(`${baseAngle.toFixed(6)} \\times ${k} = ${wk.toFixed(6)}`)} rad — this is the <em>angular velocity</em> at frequency ${k}</li>
                </ol>
                <p>The unit is <strong>radians throughout</strong>. The multiplication by ${mathInline('k')} simply scales how far around the circle each number advances.</p>
                <div style="background:#f0f9ff; border-radius:8px; padding:12px; margin-top:10px;">
                    ${mathBlock(`\\underbrace{\\frac{2\\pi}{${P}}}_{\\substack{= ${baseAngle.toFixed(6)} \\text{ rad}\\\\\\text{(base step size)}}} \\;\\times\\; \\underbrace{${k}}_{\\text{frequency index}} \\;=\\; \\underbrace{${wk.toFixed(6)} \\text{ rad}}_{\\substack{\\text{angular velocity } \\omega_{${k}}\\\\\\text{(rad per number)}}}`)}
                </div>
            `, '#f59e0b')}

            ${card('What does this mean?', `
                <p>${mathInline('\\omega_k')} is the <strong>angular velocity</strong>. It determines how fast a point rotates around the unit circle as we count from 0 to ${P-1}.</p>
                <ul>
                    <li>${mathInline('k=1')}: Each number advances the point by ${mathInline(`\\frac{2\\pi}{${P}} = ${baseAngle.toFixed(5)}`)} rad (1 full rotation total)</li>
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
            <h2 style="text-align:center; color:#1e293b;">Embedding</h2>
            <p style="text-align:center; color:#64748b;">Each input number is mapped to a point on the unit circle</p>

            ${card('The Embedding Formula', `
                ${mathBlock(`\\underbrace{n}_{\\substack{\\text{input}\\\\\\text{number}}} \\;\\longmapsto\\; \\left(\\;\\underbrace{\\cos(\\omega_k \\cdot n)}_{\\substack{x\\text{-coordinate}\\\\\\text{on the circle}}},\\;\\; \\underbrace{\\sin(\\omega_k \\cdot n)}_{\\substack{y\\text{-coordinate}\\\\\\text{on the circle}}}\\;\\right)`)}
                <p>This happens for <strong>each</strong> of the 5 frequencies simultaneously. So each number becomes 5 points on 5 different circles.</p>
            `)}

            ${card('Concrete values (k=' + k + ')', `
                <p>First, recall what ${mathInline('\\omega_k')} is for this frequency:</p>
                ${mathBlock(`\\underbrace{\\omega_{${k}}}_{\\substack{\\text{angular velocity}\\\\\\text{for frequency }k=${k}}} = \\frac{2\\pi}{\\underbrace{${P}}_{\\text{modulus}}} \\cdot \\underbrace{${k}}_{\\text{freq. index}} = ${wk.toFixed(6)}`)}
                <p>Now apply it to input ${mathInline('a')}:</p>
                ${mathBlock(`\\underbrace{a = ${a}}_{\\text{first input}} \\;\\mapsto\\; \\left(\\;\\cos\\!\\left(\\underbrace{${wk.toFixed(4)}}_{\\omega_{${k}}} \\cdot \\underbrace{${a}}_{a}\\right),\\;\\; \\sin\\!\\left(\\underbrace{${wk.toFixed(4)}}_{\\omega_{${k}}} \\cdot \\underbrace{${a}}_{a}\\right)\\;\\right)`)}
                ${mathBlock(`= \\left(\\;\\cos(\\underbrace{${angA.toFixed(4)}}_{${wk.toFixed(4)} \\times ${a}}),\\;\\; \\sin(\\underbrace{${angA.toFixed(4)}}_{${wk.toFixed(4)} \\times ${a}})\\;\\right) = (${cosA.toFixed(4)},\\; ${sinA.toFixed(4)})`)}
                <p>And input ${mathInline('b')}:</p>
                ${mathBlock(`\\underbrace{b = ${b}}_{\\text{second input}} \\;\\mapsto\\; \\left(\\;\\cos\\!\\left(\\underbrace{${wk.toFixed(4)}}_{\\omega_{${k}}} \\cdot \\underbrace{${b}}_{b}\\right),\\;\\; \\sin\\!\\left(\\underbrace{${wk.toFixed(4)}}_{\\omega_{${k}}} \\cdot \\underbrace{${b}}_{b}\\right)\\;\\right)`)}
                ${mathBlock(`= \\left(\\;\\cos(\\underbrace{${angB.toFixed(4)}}_{${wk.toFixed(4)} \\times ${b}}),\\;\\; \\sin(\\underbrace{${angB.toFixed(4)}}_{${wk.toFixed(4)} \\times ${b}})\\;\\right) = (${cosB.toFixed(4)},\\; ${sinB.toFixed(4)})`)}
            `, '#ef4444')}

            ${plotDiv('step2-circle', '380px')}

            ${card('What is the embedding matrix?', `
                <p>The Transformer has an <strong>embedding matrix</strong> ${mathInline('W_E')} of shape ${mathInline(`(${P}, d_{\\text{model}})`)}. After training, its columns contain these cos/sin values for each frequency ${mathInline('k')}. When token "${a}" is fed in, the network looks up row ${a} of ${mathInline('W_E')}, which gives exactly ${mathInline(`(\\cos(\\omega_k \\cdot ${a}), \\sin(\\omega_k \\cdot ${a}))`)}.
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

// ── NEW STEP: Embedding Space Geometry ──
	steps.push({ title: 'The Embedding Space', render() {
		content.innerHTML = `
	<h2 style="text-align:center; color:#1e293b;">The Embedding Space</h2>
	<p style="text-align:center; color:#64748b;">How all ${P} tokens are arranged in the learned embedding</p>

	${card('The Full Picture', `
	    <p>The embedding matrix ${mathInline('W_E')} is ${mathInline(`${P} \\times 128`)} — each token gets a 128-dimensional vector.</p>
	    <p>But only <strong>10 dimensions matter</strong> (5 frequencies × 2 for sin/cos). The rest is noise that gets cleaned up during training.</p>
	    ${mathBlock(`W_E[n] = \\left(\\underbrace{\\cos(\\omega_{14} n), \\sin(\\omega_{14} n)}_{\\text{2D subspace for }k=14},\\; \\underbrace{\\cos(\\omega_{35} n), \\sin(\\omega_{35} n)}_{\\text{2D subspace for }k=35},\\; \\ldots,\\; \\underbrace{\\cos(\\omega_{52} n), \\sin(\\omega_{52} n)}_{\\text{2D subspace for }k=52},\\; \\underbrace{0, 0, \\ldots, 0}_{\\text{118 unused dims}}\\right)`)}
	`, '#3b82f6')}

	<div style="display:flex; gap:10px; margin:10px 0;">
	    <label style="font-size:0.85em; font-weight:600;">Frequency:
		<select id="embed-freq-select" style="padding:4px 8px; border:1px solid #cbd5e1; border-radius:4px;">
		    ${FREQS.map(k => `<option value="${k}">k=${k} (period ${(P/k).toFixed(1)})</option>`).join('')}
		</select>
	    </label>
	    <label style="font-size:0.85em; font-weight:600;">
		<input type="checkbox" id="embed-highlight-inputs" checked> Highlight a=${a}, b=${b}
	    </label>
	</div>

	${plotDiv('embed-circle-plot', '450px')}

	${card('What you see above', `
	    <p>Each dot is one of the ${P} tokens, plotted at its position ${mathInline('(\\cos(\\omega_k \\cdot n),\\; \\sin(\\omega_k \\cdot n))')} for the selected frequency.</p>
	    <p>All tokens lie <strong>exactly on the unit circle</strong> — evenly spaced, making ${mathInline('k')} full rotations as ${mathInline('n')} goes from 0 to ${P-1}.</p>
	    <p>The <span style="color:#ef4444; font-weight:bold;">red</span> and <span style="color:#3b82f6; font-weight:bold;">blue</span> dots show inputs a and b. The <span style="color:#059669; font-weight:bold;">green</span> triangle shows where the sum (a+b) mod P lands.</p>
	`, '#8b5cf6')}

	${card('Why circles?', `
	    <p>Modular arithmetic wraps around: after ${P-1} comes 0 again. A circle is the natural geometry for this!</p>
	    <p>The embedding matrix ${mathInline('W_E')} is <strong>sparse in the Fourier basis</strong> — it only has significant norm at 5-6 frequencies out of 56 possible.</p>
	    ${mathBlock(`\\|W_E\\|_{\\text{Fourier component } k} \\approx \\begin{cases} \\text{large} & k \\in \\{14, 35, 41, 42, 52\\} \\\\ \\approx 0 & \\text{otherwise} \\end{cases}`)}
	`, '#f59e0b')}
    `;
		renderMath();

		function renderEmbedCircle() {
			const k = parseInt(document.getElementById('embed-freq-select').value);
			const highlight = document.getElementById('embed-highlight-inputs').checked;
			const wk = 2 * Math.PI * k / P;

			// All tokens on the circle
			const allX = tokens.map(n => Math.cos(wk * n));
			const allY = tokens.map(n => Math.sin(wk * n));

			const traces = [
				// Unit circle outline
				{ x: Array.from({length:100}, (_,i) => Math.cos(i*2*Math.PI/99)),
					y: Array.from({length:100}, (_,i) => Math.sin(i*2*Math.PI/99)),
					mode: 'lines', line: { color: '#e2e8f0', width: 1 }, showlegend: false, hoverinfo: 'skip' },
				// All tokens
				{ x: allX, y: allY, mode: 'markers',
					marker: { size: 4, color: '#94a3b8', opacity: 0.6 },
					text: tokens.map(n => `Token ${n}`),
					hoverinfo: 'text', name: `All ${P} tokens` },
			];

			if (highlight) {
				// Input a
				traces.push({ x: [Math.cos(wk*a)], y: [Math.sin(wk*a)], mode: 'markers',
					marker: { size: 16, color: '#ef4444', symbol: 'circle', line: { width: 2, color: '#fff' } },
					name: `a=${a}`, hoverinfo: 'name' });
				// Input b
				traces.push({ x: [Math.cos(wk*b)], y: [Math.sin(wk*b)], mode: 'markers',
					marker: { size: 16, color: '#3b82f6', symbol: 'square', line: { width: 2, color: '#fff' } },
					name: `b=${b}`, hoverinfo: 'name' });
				// Sum
				traces.push({ x: [Math.cos(wk*correctAnswer)], y: [Math.sin(wk*correctAnswer)], mode: 'markers',
					marker: { size: 18, color: '#059669', symbol: 'triangle-up', line: { width: 2, color: '#fff' } },
					name: `(a+b)%P=${correctAnswer}`, hoverinfo: 'name' });

				// Draw arcs showing the angles
				const arcA = Array.from({length:30}, (_,i) => i * wk * a / 29);
				traces.push({ x: arcA.map(t => 0.3*Math.cos(t)), y: arcA.map(t => 0.3*Math.sin(t)),
					mode: 'lines', line: { color: '#ef4444', width: 2, dash: 'dot' },
					showlegend: false, hoverinfo: 'skip' });
			}

			Plotly.newPlot('embed-circle-plot', traces, {
				xaxis: { range: [-1.6, 1.6], zeroline: true, scaleanchor: 'y', title: `cos(ω_${k} · n)` },
				yaxis: { range: [-1.6, 1.6], zeroline: true, title: `sin(ω_${k} · n)` },
				margin: { t: 30, b: 50, l: 60, r: 20 },
				title: { text: `Embedding space projection: frequency k=${k}`, font: { size: 13 } },
				showlegend: true, legend: { x: 1.02, y: 0.98, xanchor: 'left' }
			}, { responsive: true });
		}

		document.getElementById('embed-freq-select').addEventListener('change', renderEmbedCircle);
		document.getElementById('embed-highlight-inputs').addEventListener('change', renderEmbedCircle);
		renderEmbedCircle();
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
            <h2 style="text-align:center; color:#1e293b;">The Addition Theorem</h2>
            <p style="text-align:center; color:#64748b;">The network computes cos(w*(a+b)) using only the individual embeddings of a and b</p>

            ${card('Recall: what is ' + mathInline('\\omega_k') + ' here?', `
                ${mathBlock(`\\underbrace{\\omega_{${k}}}_{\\substack{\\text{angular velocity}\\\\\\text{for freq. }k=${k}}} = \\frac{2\\pi}{\\underbrace{${P}}_{P}} \\cdot \\underbrace{${k}}_{k} = ${wk.toFixed(6)} \\text{ rad per number}`)}
                <p>This value stays the same throughout this step. Every ${mathInline('\\omega_k')} below equals ${wk.toFixed(4)}.</p>
            `, '#64748b')}

            ${card('The Key Identity (Cosine)', `
                ${mathBlock(`\\overbrace{\\cos(\\underbrace{\\omega_k}_{=${wk.toFixed(4)}} \\cdot \\underbrace{(a+b)}_{${a}+${b}=${a+b}})}^{\\substack{\\text{what we WANT:}\\\\\\text{cosine of the sum-angle}}} = \\underbrace{\\cos(\\omega_k \\cdot a)}_{\\substack{\\text{from embedding of }a\\\\= \\cos(${wk.toFixed(4)} \\cdot ${a})\\\\= ${cosA.toFixed(4)}}} \\cdot \\underbrace{\\cos(\\omega_k \\cdot b)}_{\\substack{\\text{from embedding of }b\\\\= \\cos(${wk.toFixed(4)} \\cdot ${b})\\\\= ${cosB.toFixed(4)}}} - \\underbrace{\\sin(\\omega_k \\cdot a)}_{\\substack{\\text{from embedding of }a\\\\= \\sin(${wk.toFixed(4)} \\cdot ${a})\\\\= ${sinA.toFixed(4)}}} \\cdot \\underbrace{\\sin(\\omega_k \\cdot b)}_{\\substack{\\text{from embedding of }b\\\\= \\sin(${wk.toFixed(4)} \\cdot ${b})\\\\= ${sinB.toFixed(4)}}}`)}
            `, '#059669')}

            ${card('The Key Identity (Sine)', `
                ${mathBlock(`\\overbrace{\\sin(\\underbrace{\\omega_k}_{=${wk.toFixed(4)}} \\cdot \\underbrace{(a+b)}_{=${a+b}})}^{\\text{what we WANT}} = \\underbrace{\\sin(\\omega_k a)}_{\\substack{\\text{embed. of }a\\\\=${sinA.toFixed(4)}}} \\cdot \\underbrace{\\cos(\\omega_k b)}_{\\substack{\\text{embed. of }b\\\\=${cosB.toFixed(4)}}} + \\underbrace{\\cos(\\omega_k a)}_{\\substack{\\text{embed. of }a\\\\=${cosA.toFixed(4)}}} \\cdot \\underbrace{\\sin(\\omega_k b)}_{\\substack{\\text{embed. of }b\\\\=${sinB.toFixed(4)}}}`)}
            `, '#3b82f6')}

            ${card('Numerical verification (k=' + k + ')', `
                ${mathBlock(`\\cos(\\omega_{${k}}(a+b)) = \\underbrace{\\underbrace{${cosA.toFixed(4)}}_{\\cos(\\omega \\cdot ${a})} \\cdot \\underbrace{${cosB.toFixed(4)}}_{\\cos(\\omega \\cdot ${b})}}_{= ${prod_cc.toFixed(5)}} \\;-\\; \\underbrace{\\underbrace{${sinA.toFixed(4)}}_{\\sin(\\omega \\cdot ${a})} \\cdot \\underbrace{${sinB.toFixed(4)}}_{\\sin(\\omega \\cdot ${b})}}_{= ${prod_ss.toFixed(5)}} = ${(prod_cc - prod_ss).toFixed(5)}`)}
                ${mathBlock(`\\text{Check: } \\cos(\\underbrace{\\omega_{${k}}}_{${wk.toFixed(4)}} \\cdot \\underbrace{(a+b)}_{${a+b}}) = \\cos(\\underbrace{${angS.toFixed(4)}}_{${wk.toFixed(4)} \\times ${a+b}}) = ${cosS.toFixed(5)} \\quad \\checkmark`)}
                ${mathBlock(`\\sin(\\omega_{${k}}(a+b)) = \\underbrace{\\underbrace{${sinA.toFixed(4)}}_{\\sin(\\omega \\cdot ${a})} \\cdot \\underbrace{${cosB.toFixed(4)}}_{\\cos(\\omega \\cdot ${b})}}_{= ${prod_sc.toFixed(5)}} \\;+\\; \\underbrace{\\underbrace{${cosA.toFixed(4)}}_{\\cos(\\omega \\cdot ${a})} \\cdot \\underbrace{${sinB.toFixed(4)}}_{\\sin(\\omega \\cdot ${b})}}_{= ${prod_cs.toFixed(5)}} = ${(prod_sc + prod_cs).toFixed(5)}`)}
                ${mathBlock(`\\text{Check: } \\sin(\\underbrace{${angS.toFixed(4)}}_{${wk.toFixed(4)} \\times ${a+b}}) = ${sinS.toFixed(5)} \\quad \\checkmark`)}
            `, '#f59e0b')}

            ${card('How the Attention Heads Compute Pairwise Products', `
                <p>The 4 attention heads each produce a <strong>degree-2 product</strong> of Fourier embeddings. Here's the mechanism:</p>

                <p><strong>Step A: Attention Pattern (scalar weight)</strong></p>
                <p>For head ${mathInline('j')}, the attention from "=" to position 0 (token ${mathInline('a')}) is:</p>
                ${mathBlock(`A^j_0 = \\sigma\\!\\left(\\underbrace{C^j[a] - C^j[b]}_{\\text{difference of lookup scores}}\\right) \\approx 0.5 + \\underbrace{\\alpha_j}_{\\text{learned}} \\cdot (\\cos(\\omega_{k_j} a) - \\cos(\\omega_{k_j} b)) + \\underbrace{\\beta_j}_{\\text{learned}} \\cdot (\\sin(\\omega_{k_j} a) - \\sin(\\omega_{k_j} b))`)}
                <p style="font-size:0.88em; color:#64748b;">The softmax over 2 positions reduces to a sigmoid ${mathInline('\\sigma')}, which operates in a near-linear regime (97.5% FVE with linear fit).</p>

                <p><strong>Step B: OV Circuit (value output)</strong></p>
                <p>The OV circuit ${mathInline('W^j_O W^j_V x^{(0)}')} outputs a vector concentrated on a single frequency's sin/cos:</p>
                ${mathBlock(`\\text{OV}^j(\\text{pos } i) \\approx \\gamma_j \\cdot \\cos(\\omega_{k_j} \\cdot t_i) + \\delta_j \\cdot \\sin(\\omega_{k_j} \\cdot t_i)`)}

                <p><strong>Step C: The Product (attention × value)</strong></p>
                <p>The head output is attention weight × OV output. Since both are functions of a single frequency:</p>
                ${mathBlock(`\\text{Head}^j = \\underbrace{A^j_0}_{\\substack{\\text{attention weight}\\\\\\propto \\cos(\\omega_k a) \\text{ or } \\sin(\\omega_k a)}} \\times \\underbrace{\\text{OV}^j(\\text{pos } 1)}_{\\substack{\\text{value output}\\\\\\propto \\cos(\\omega_k b) \\text{ or } \\sin(\\omega_k b)}} \\;\\Rightarrow\\; \\text{degree-2 product}`)}

                <p><strong>Result: Each head computes one pairwise product:</strong></p>
                <table style="width:100%; border-collapse:collapse; font-size:0.88em; margin:8px 0;">
                    <tr style="background:#f8fafc;"><th style="padding:6px; border:1px solid #e2e8f0;">Head</th><th style="padding:6px; border:1px solid #e2e8f0;">Attention pattern ∝</th><th style="padding:6px; border:1px solid #e2e8f0;">OV output ∝</th><th style="padding:6px; border:1px solid #e2e8f0;">Product</th></tr>
                    <tr><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">0</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\cos(\\omega_k a)')}</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\cos(\\omega_k b)')}</td><td style="padding:6px; border:1px solid #e2e8f0; font-weight:bold;">${mathInline('\\cos(\\omega_k a)\\cos(\\omega_k b)')}</td></tr>
                    <tr><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">1</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\sin(\\omega_k a)')}</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\sin(\\omega_k b)')}</td><td style="padding:6px; border:1px solid #e2e8f0; font-weight:bold;">${mathInline('\\sin(\\omega_k a)\\sin(\\omega_k b)')}</td></tr>
                    <tr><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">2</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\sin(\\omega_k a)')}</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\cos(\\omega_k b)')}</td><td style="padding:6px; border:1px solid #e2e8f0; font-weight:bold;">${mathInline('\\sin(\\omega_k a)\\cos(\\omega_k b)')}</td></tr>
                    <tr><td style="padding:6px; border:1px solid #e2e8f0; text-align:center;">3</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\cos(\\omega_k a)')}</td><td style="padding:6px; border:1px solid #e2e8f0;">${mathInline('\\sin(\\omega_k b)')}</td><td style="padding:6px; border:1px solid #e2e8f0; font-weight:bold;">${mathInline('\\cos(\\omega_k a)\\sin(\\omega_k b)')}</td></tr>
                </table>
                <p style="font-size:0.85em; color:#64748b;">Note: In practice, heads 0 and 2 compute degree-2 products while heads 1 and 3 amplify key frequencies in the residual stream (their attention patterns nearly sum to 1).</p>
            `, '#8b5cf6')}

            ${plotDiv('step3-circle', '340px')}

            ${card('How the network layers implement this', `
                <p>The computation is split across two layers:</p>
                <table style="width:100%; border-collapse:collapse; font-size:0.9em; margin:10px 0;">
                    <tr style="background:#ede9fe;"><td style="padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#7c3aed;">Attention<br>(4 heads)</td><td style="padding:10px; border:1px solid #e2e8f0;">
                        <p style="margin:0 0 5px 0;">Each head attends from the output position back to positions a and b, creating <strong>pairwise products</strong>:</p>
                        ${mathBlock(`\\underbrace{\\text{Head 0}}_{\\text{computes}} \\to \\cos(\\omega_k a) \\cdot \\cos(\\omega_k b)`)}
                        ${mathBlock(`\\underbrace{\\text{Head 1}}_{\\text{computes}} \\to \\sin(\\omega_k a) \\cdot \\sin(\\omega_k b)`)}
                        ${mathBlock(`\\underbrace{\\text{Head 2}}_{\\text{computes}} \\to \\sin(\\omega_k a) \\cdot \\cos(\\omega_k b)`)}
                        ${mathBlock(`\\underbrace{\\text{Head 3}}_{\\text{computes}} \\to \\cos(\\omega_k a) \\cdot \\sin(\\omega_k b)`)}
                    </td></tr>
                    <tr style="background:#ecfdf5;"><td style="padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#059669;">MLP<br>(512 ReLU neurons)</td><td style="padding:10px; border:1px solid #e2e8f0;">
                        <p style="margin:0 0 5px 0;">Combines the products using the addition theorem:</p>
                        ${mathBlock(`\\underbrace{\\text{cos}\\cdot\\text{cos}}_{\\text{from Head 0}} - \\underbrace{\\text{sin}\\cdot\\text{sin}}_{\\text{from Head 1}} = \\cos(\\omega_k(a+b))`)}
                        ${mathBlock(`\\underbrace{\\text{sin}\\cdot\\text{cos}}_{\\text{from Head 2}} + \\underbrace{\\text{cos}\\cdot\\text{sin}}_{\\text{from Head 3}} = \\sin(\\omega_k(a+b))`)}
                        <p style="margin:5px 0 0 0; font-size:0.9em; color:#64748b;">ReLU neurons approximate the subtraction/addition by learning appropriate weights. Pairs of neurons can approximate products via ${mathInline('\\text{ReLU}(x+y)^2 - \\text{ReLU}(x-y)^2 \\propto xy')}.</p>
                    </td></tr>
                </table>
            `, '#059669')}
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
    }});

    // ── STEP 4: Unembedding ──
    steps.push({ title: 'Unembedding: Compare with All Tokens', render() {
        const k = FREQS[0];
        const wk = 2 * Math.PI * k / P;
        const signal = allSignals[0];
        const falsePeaks = tokens.filter(c => signal[c] > 0.9 && c !== correctAnswer);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Unembedding</h2>
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
		    margin: { t: 40, b: 50, l: 55, r: 20 },
		    shapes: [{ type: 'line', x0: 0, x1: P, y0: 0, y1: 0, line: { color: '#94a3b8', width: 0.5 } }],
		    showlegend: true, legend: { x: 0.5, y: 1.15, orientation: 'h', xanchor: 'center', yanchor: 'bottom' }
	    }, { responsive: true });
    }});

	// ── NEW STEP: Multi-Frequency View ──
	steps.push({ title: 'Five Circles: One Token, Five Positions', render() {
		content.innerHTML = `
	<h2 style="text-align:center; color:#1e293b;">Five Circles, Five Positions</h2>
	<p style="text-align:center; color:#64748b;">Each token exists simultaneously on 5 different circles</p>

	${card('The key insight', `
	    <p>Token ${mathInline(`n = ${a}`)} doesn't have just one position in the embedding space. It has <strong>5 positions</strong>, one per frequency:</p>
	    ${mathBlock(`\\text{Token } ${a} \\;\\mapsto\\; \\begin{cases} \\text{Circle 1 (k=14):} & (\\cos(\\omega_{14} \\cdot ${a}),\\; \\sin(\\omega_{14} \\cdot ${a})) \\\\ \\text{Circle 2 (k=35):} & (\\cos(\\omega_{35} \\cdot ${a}),\\; \\sin(\\omega_{35} \\cdot ${a})) \\\\ \\text{Circle 3 (k=41):} & (\\cos(\\omega_{41} \\cdot ${a}),\\; \\sin(\\omega_{41} \\cdot ${a})) \\\\ \\text{Circle 4 (k=42):} & (\\cos(\\omega_{42} \\cdot ${a}),\\; \\sin(\\omega_{42} \\cdot ${a})) \\\\ \\text{Circle 5 (k=52):} & (\\cos(\\omega_{52} \\cdot ${a}),\\; \\sin(\\omega_{52} \\cdot ${a})) \\end{cases}`)}
	    <p>These 5 circles live in <strong>orthogonal 2D subspaces</strong> of the 128-dimensional embedding space.</p>
	`, '#3b82f6')}

	${plotDiv('multi-freq-plot', '350px')}

	${card('Why orthogonal subspaces matter', `
	    <p>Because the 5 frequency channels are (approximately) orthogonal in the 128-dimensional space, they <strong>don't interfere with each other</strong> during computation. Each frequency's computation is independent until the final summation in the unembedding step.</p>
	    <p>This is like having 5 independent radio channels — each carries its own signal without cross-talk.</p>
	`, '#8b5cf6')}
    `;
		renderMath();

		const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
		const traces = [];
		const circleTheta = Array.from({length:80}, (_,i) => i*2*Math.PI/79);

		FREQS.forEach((k, idx) => {
			const wk = 2 * Math.PI * k / P;
			const offsetX = (idx - 2) * 3; // Spread circles horizontally

			// Circle outline
			traces.push({
				x: circleTheta.map(t => Math.cos(t) + offsetX),
				y: circleTheta.map(t => Math.sin(t)),
				mode: 'lines', line: { color: '#e2e8f0', width: 1 },
				showlegend: false, hoverinfo: 'skip'
			});

			// Token a
			traces.push({
				x: [Math.cos(wk * a) + offsetX],
				y: [Math.sin(wk * a)],
				mode: 'markers',
				marker: { size: 12, color: '#ef4444', symbol: 'circle' },
				name: idx === 0 ? `a=${a}` : undefined,
				showlegend: idx === 0,
				hovertext: `a=${a} on k=${k}: (${Math.cos(wk*a).toFixed(3)}, ${Math.sin(wk*a).toFixed(3)})`,
				hoverinfo: 'text'
			});

			// Token b
			traces.push({
				x: [Math.cos(wk * b) + offsetX],
				y: [Math.sin(wk * b)],
				mode: 'markers',
				marker: { size: 12, color: '#3b82f6', symbol: 'square' },
				name: idx === 0 ? `b=${b}` : undefined,
				showlegend: idx === 0,
				hovertext: `b=${b} on k=${k}: (${Math.cos(wk*b).toFixed(3)}, ${Math.sin(wk*b).toFixed(3)})`,
				hoverinfo: 'text'
			});

			// Correct answer
			traces.push({
				x: [Math.cos(wk * correctAnswer) + offsetX],
				y: [Math.sin(wk * correctAnswer)],
				mode: 'markers',
				marker: { size: 14, color: '#059669', symbol: 'triangle-up' },
				name: idx === 0 ? `c*=${correctAnswer}` : undefined,
				showlegend: idx === 0,
				hovertext: `c*=${correctAnswer} on k=${k}`,
				hoverinfo: 'text'
			});

			// Label
			traces.push({
				x: [offsetX], y: [-1.5],
				mode: 'text', text: [`k=${k}`],
				textfont: { size: 11, color: colors[idx] },
				showlegend: false, hoverinfo: 'skip'
			});
		});

		Plotly.newPlot('multi-freq-plot', traces, {
			xaxis: { range: [-8, 8], showgrid: false, zeroline: false, showticklabels: false },
			yaxis: { range: [-2, 1.8], showgrid: false, zeroline: false, showticklabels: false, scaleanchor: 'x' },
			margin: { t: 20, b: 30, l: 20, r: 20 },
			showlegend: true, legend: { x: 0.5, y: 1.1, orientation: 'h', xanchor: 'center' }
		}, { responsive: true });
	}});

    // ── STEP 5: Why one frequency fails ──
    steps.push({ title: 'Why One Frequency Fails', render() {
        const k = FREQS[0];
        const signal = allSignals[0];
        const highPeaks = tokens.filter(c => signal[c] > 0.9);

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Why One Frequency Fails</h2>
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
            { x: tokens, y: signal, mode: 'lines', line: { color: '#3b82f6', width: 1.2 }, name: `cos(w_${k}*(a+b-c))` },
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
            showlegend: true, legend: { x: 0.5, y: 1.15, orientation: 'h', xanchor: 'center', yanchor: 'bottom' }
        }, { responsive: true });
    }});

    // ── STEP 6: All 5 frequencies ──
    steps.push({ title: 'All 5 Frequencies Together', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">All 5 Frequencies</h2>
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
            showlegend: true, legend: { x: 1.02, y: 0.98, xanchor: 'left' }
        }, { responsive: true });
    }});

    // ── STEP 7: Constructive Interference ──
    steps.push({ title: 'Constructive Interference', render() {
        const maxVal = totalSignal[correctAnswer];
        const sorted = [...totalSignal].map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v);
        const second = sorted[0].i === correctAnswer ? sorted[1] : sorted[0];

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Constructive Interference</h2>
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
            showlegend: true, legend: { x: 0.5, y: 1.15, orientation: 'h', xanchor: 'center', yanchor: 'bottom' }
        }, { responsive: true });
    }});

    // ── STEP 8: Softmax ──
    steps.push({ title: 'Softmax: Logits to Probabilities', render() {
        const prob = softmaxSignal[correctAnswer];

        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">Softmax</h2>
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
            showlegend: true, legend: { x: 0.5, y: 1.15, orientation: 'h', xanchor: 'center', yanchor: 'bottom' }
        }, { responsive: true });
    }});

    // ── STEP 9: Complete Algorithm ──
    steps.push({ title: 'Complete Algorithm', render() {
        content.innerHTML = `
            <h2 style="text-align:center; color:#1e293b;">The Complete Algorithm</h2>
            <p style="text-align:center; color:#64748b;">All formulas at a glance ${cite('(Nanda et al., 2023)', 'nanda2023grokking')}</p>

            ${card('(1) EMBEDDING: Numbers become circle-points', `
                ${mathBlock(`\\underbrace{n}_{\\text{input token}} \\;\\mapsto\\; \\left(\\underbrace{\\cos(\\omega_k \\cdot n)}_{x},\\; \\underbrace{\\sin(\\omega_k \\cdot n)}_{y}\\right) \\quad \\text{where } \\underbrace{\\omega_k = \\frac{2\\pi k}{P}}_{\\text{angular velocity}},\\; k \\in \\{${FREQS.join(', ')}\\}`)}
            `, '#3b82f6')}

            ${card('(2) ATTENTION: Bringing information together', `
                <p>The 4 attention heads move information from positions a and b to the output position, creating products:</p>
                ${mathBlock(`\\underbrace{\\cos(\\omega_k a) \\cdot \\cos(\\omega_k b)}_{\\text{head 0: cos-cos product}}, \\quad \\underbrace{\\sin(\\omega_k a) \\cdot \\sin(\\omega_k b)}_{\\text{head 1: sin-sin product}}, \\quad \\underbrace{\\sin(\\omega_k a) \\cdot \\cos(\\omega_k b)}_{\\text{head 2: sin-cos product}}`)}

                <p><strong>How each head produces its product:</strong></p>
                ${mathBlock(`\\text{Head}^j \\;=\\; \\underbrace{A^j_0}_{\\substack{\\text{attention weight}\\\\= \\sigma(C^j[a] - C^j[b])\\\\\\approx 0.5 + \\alpha_j(\\cos(\\omega_{k_j} a) - \\cos(\\omega_{k_j} b))}} \\;\\times\\; \\underbrace{W^j_O W^j_V x^{(0)}}_{\\substack{\\text{OV circuit output}\\\\\\propto \\cos(\\omega_{k_j} b) \\text{ or } \\sin(\\omega_{k_j} b)}}`)}
                <p style="font-size:0.88em; color:#64748b;">The softmax over 2 positions reduces to a sigmoid σ, which operates in a near-linear regime (97.5% FVE with linear fit). The product of the linear attention weight × OV output gives a degree-2 polynomial.</p>
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
	<h2 style="text-align:center; color:#1e293b;">Interactive Playground</h2>
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

			// Handle zero frequencies selected
			if (activeFreqs.length === 0) {
				const flatSignal = tokens.map(() => 0);
				Plotly.react('play-plot', [
					{ x: tokens, y: flatSignal, mode: 'lines', line: { color: '#94a3b8', width: 2 }, name: 'Logit(c) [no frequencies]' },
				], {
					xaxis: { title: 'Candidate token c', range: [-2, P + 2] },
					yaxis: { title: 'Logit', range: [-1, 1] },
					margin: { t: 20, b: 50, l: 50, r: 20 },
					showlegend: true, legend: { x: 0.5, y: 1.15, orientation: 'h', xanchor: 'center', yanchor: 'bottom' }
				});
				document.getElementById('play-info').innerHTML = `<span style="color:#ef4444; font-weight:bold;">&#10007; No frequencies active! All logits are 0. The network cannot distinguish any token.</span>`;
				return;
			}

			const playSignal = tokens.map(c => {
				return activeFreqs.reduce((sum, k) => {
					const wk = 2 * Math.PI * k / P;
					return sum + Math.cos(wk * (playA + playB) - wk * c);
				}, 0);
			});

			const maxVal = Math.max(...playSignal);
			const numFreqs = activeFreqs.length;

			// Sort signal values descending to find the margin
			const sorted = [...playSignal].sort((a, b) => b - a);
			const secondMax = sorted[1];
			const margin = maxVal - secondMax;

			// The margin with all 5 frequencies is ~5 - (~1.5) = ~3.5
			// With 1 frequency the margin is ~1.0 - 0.997 = ~0.003
			// We consider the prediction "unreliable" if margin < 0.5 per active frequency
			// This threshold means: the 2nd-best token gets more than (max - 0.5*numFreqs)
			const reliableThreshold = 0.5; // margin must be at least this to be "reliable"
			const isReliable = margin > reliableThreshold;

			// Find near-peak tokens (within 10% of the max value relative to the range)
			const range = maxVal - Math.min(...playSignal);
			const nearPeakThreshold = maxVal - 0.1 * range; // within top 10% of range
			const nearPeakTokens = tokens.filter(c => playSignal[c] >= nearPeakThreshold);

			// The argmax (first occurrence)
			const maxIdx = playSignal.indexOf(maxVal);
			const isCorrect = maxIdx === playResult;

			// Build plot traces
			const traces = [
				{ x: tokens, y: playSignal, mode: 'lines', line: { color: '#3b82f6', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.04)', name: 'Logit(c)' },
				{ x: [playResult], y: [playSignal[playResult]], mode: 'markers', marker: { size: 14, color: '#ef4444', symbol: 'star' }, name: `Correct: ${playResult}` },
			];

			if (isReliable) {
				traces.push({
					x: [maxIdx], y: [playSignal[maxIdx]], mode: 'markers',
					marker: { size: 10, color: isCorrect ? '#10b981' : '#f59e0b', symbol: 'diamond' },
					name: `argmax: ${maxIdx}`
				});
			} else {
				// Show all near-peak tokens to illustrate the ambiguity
				traces.push({
					x: nearPeakTokens, y: nearPeakTokens.map(c => playSignal[c]), mode: 'markers',
					marker: { size: 8, color: '#f59e0b', symbol: 'diamond' },
					name: `${nearPeakTokens.length} near-peak tokens (margin=${margin.toFixed(4)})`
				});
			}

			// Add a horizontal line at the near-peak threshold when unreliable
			const layout = {
				xaxis: { title: 'Candidate token c', range: [-2, P + 2] },
				yaxis: { title: 'Logit' },
				margin: { t: 20, b: 50, l: 50, r: 20 },
				showlegend: true,
				legend: { x: 0.5, y: 1.15, orientation: 'h', xanchor: 'center', yanchor: 'bottom' },
				shapes: []
			};

			if (!isReliable) {
				layout.shapes.push({
					type: 'line', x0: -2, x1: P + 2,
					y0: nearPeakThreshold, y1: nearPeakThreshold,
					line: { color: '#f59e0b', width: 1.5, dash: 'dash' }
				});
			}

			Plotly.react('play-plot', traces, layout);

			// Update info display
			const infoEl = document.getElementById('play-info');
			if (isCorrect && isReliable) {
				infoEl.innerHTML = `<span style="color:#059669; font-weight:bold;">&#10003; Correct! argmax = ${maxIdx} = (${playA}+${playB}) mod ${P}</span><br><span style="font-size:0.85em;">${numFreqs} frequency(ies) active. Peak: ${maxVal.toFixed(2)} / ${numFreqs}.0 | Margin over 2nd place: <strong>${margin.toFixed(4)}</strong></span>`;
			} else if (isCorrect && !isReliable) {
				infoEl.innerHTML = `<span style="color:#f59e0b; font-weight:bold;">&#9888; Technically correct, but unreliable! Margin is only ${margin.toFixed(4)}</span><br><span style="font-size:0.85em;">With only ${numFreqs} frequency(ies), <strong>${nearPeakTokens.length} tokens</strong> have nearly identical scores (within top 10% of range). The correct answer c*=${playResult} wins by a hair, but noise or finite precision would break this.</span><br><span style="font-size:0.82em; color:#64748b;">Near-peak tokens: [${nearPeakTokens.slice(0, 12).join(', ')}${nearPeakTokens.length > 12 ? ', ...' : ''}] — spaced ~P/k ≈ ${(P / activeFreqs[0]).toFixed(1)} apart.</span>`;
			} else if (!isCorrect) {
				infoEl.innerHTML = `<span style="color:#ef4444; font-weight:bold;">&#10007; Wrong! argmax = ${maxIdx}, but correct = ${playResult}</span><br><span style="font-size:0.85em;">${numFreqs} frequency(ies) active. Margin: ${margin.toFixed(4)}. ${!isReliable ? 'Prediction is unreliable.' : ''}</span>`;
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
            <h2 style="text-align:center; color:#1e293b;">Summary</h2>
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
                <p><strong>Phase 2 (Circuit Formation):</strong> Weight decay penalizes large weights. The Fourier multiplication circuit forms gradually while train/test loss stay flat.</p>
                <p><strong>Phase 3 (Cleanup):</strong> The memorization components are shed. Test accuracy jumps from ~0% to ~100% in a few hundred steps ${cite('(Power et al., 2022)', 'grokking')}!</p>
                <p>This phenomenon is called <strong>"Grokking"</strong>: sudden understanding after prolonged memorization. The key insight from Nanda et al. is that grokking is <em>not</em> sudden — the generalizing circuit forms continuously during Phase 2, well before the test accuracy jump.</p>
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
