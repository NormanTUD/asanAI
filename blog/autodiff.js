// ============================================================
// AUTODIFF.JS — Interactive Demos for Automatic Differentiation
// Tape visualization, computational graph, gradient descent,
// and vanishing gradient explorer.
// ============================================================

// --- Utility: Debounce ---
function debounceAD(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

// ============================================================
// 1. TAPE-BASED REVERSE-MODE AD DEMO
// ============================================================

const ADTape = {
    state: 'idle', // 'idle' | 'forward' | 'backward' | 'done'
    forwardStep: 0,
    backwardStep: 0,
    tape: [],
    adjoints: {},

    getInputs() {
        const x = parseFloat(document.getElementById('slider-ad-x').value);
        const y = parseFloat(document.getElementById('slider-ad-y').value);
        return { x, y };
    },

    buildTape(x, y) {
        const v0 = x;
        const v1 = y;
        const v2 = v0 + v1;
        const v3 = Math.sin(v0);
        const v4 = v2 * v3;

        return [
            { id: 'v₀', op: 'input x', val: v0, deps: [], localDerivs: {} },
            { id: 'v₁', op: 'input y', val: v1, deps: [], localDerivs: {} },
            { id: 'v₂', op: 'v₀ + v₁', val: v2, deps: ['v₀', 'v₁'], localDerivs: { 'v₀': 1, 'v₁': 1 } },
            { id: 'v₃', op: 'sin(v₀)', val: v3, deps: ['v₀'], localDerivs: { 'v₀': Math.cos(v0) } },
            { id: 'v₄', op: 'v₂ · v₃', val: v4, deps: ['v₂', 'v₃'], localDerivs: { 'v₂': v3, 'v₃': v2 } },
        ];
    },

    reset() {
        this.state = 'idle';
        this.forwardStep = 0;
        this.backwardStep = 0;
        this.tape = [];
        this.adjoints = {};
        document.getElementById('ad-tape-display').innerHTML =
            '<span style="color:#94a3b8;">Press "Forward Pass" to begin.</span>';
        document.getElementById('ad-result-display').innerHTML = '';
    },

    runForward() {
        const { x, y } = this.getInputs();
        this.tape = this.buildTape(x, y);
        this.state = 'forward';
        this.forwardStep = this.tape.length; // show all at once
        this.adjoints = {};
        this.renderTape();
    },

    runBackward() {
        if (this.tape.length === 0) {
            this.runForward();
        }
        this.state = 'backward';

        // Initialize all adjoints to 0
        this.adjoints = {};
        this.tape.forEach(n => { this.adjoints[n.id] = 0; });

        // Seed: df/df = 1
        this.adjoints['v₄'] = 1;

        // Reverse traversal
        for (let i = this.tape.length - 1; i >= 0; i--) {
            const node = this.tape[i];
            const adjoint = this.adjoints[node.id];
            for (const dep of node.deps) {
                this.adjoints[dep] += adjoint * node.localDerivs[dep];
            }
        }

        this.backwardStep = this.tape.length;
        this.renderTape();
        this.renderResult();
    },

    renderTape() {
        const display = document.getElementById('ad-tape-display');
        let html = '';

        if (this.state === 'forward' || this.state === 'backward' || this.state === 'done') {
            html += '<div style="margin-bottom:8px; font-weight:700; color:#2563eb;">▶ Forward Pass (Tape Recording)</div>';
            html += '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">';
            html += '<tr style="background:#e2e8f0;"><th style="padding:4px 8px; text-align:left;">Node</th><th style="padding:4px 8px;">Operation</th><th style="padding:4px 8px;">Value</th><th style="padding:4px 8px;">Local ∂</th></tr>';

            for (let i = 0; i < Math.min(this.forwardStep, this.tape.length); i++) {
                const n = this.tape[i];
                const derivStr = Object.entries(n.localDerivs)
                    .map(([k, v]) => `∂/∂${k} = ${v.toFixed(4)}`)
                    .join(', ') || '—';
                const bg = i % 2 === 0 ? '#f8fafc' : '#fff';
                html += `<tr style="background:${bg};">
                    <td style="padding:4px 8px; font-weight:600; color:#1e293b;">${n.id}</td>
                    <td style="padding:4px 8px; color:#475569;">${n.op}</td>
                    <td style="padding:4px 8px; font-weight:600; color:#059669;">${n.val.toFixed(4)}</td>
                    <td style="padding:4px 8px; color:#6366f1; font-size:0.8rem;">${derivStr}</td>
                </tr>`;
            }
            html += '</table>';
        }

        if (this.state === 'backward' || this.state === 'done') {
            html += '<div style="margin-top:12px; margin-bottom:8px; font-weight:700; color:#ef4444;">◀ Backward Pass (Gradient Propagation)</div>';
            html += '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">';
            html += '<tr style="background:#fef2f2;"><th style="padding:4px 8px; text-align:left;">Node</th><th style="padding:4px 8px;">Adjoint (∂f/∂node)</th></tr>';

            // Show in reverse order
            const order = [...this.tape].reverse();
            for (const n of order) {
                const adj = this.adjoints[n.id];
                const isInput = n.id === 'v₀' || n.id === 'v₁';
                const color = isInput ? '#dc2626' : '#475569';
                const weight = isInput ? '700' : '400';
                const bg = isInput ? '#fef2f2' : '#fff';
                html += `<tr style="background:${bg};">
                    <td style="padding:4px 8px; font-weight:600;">${n.id}</td>
                    <td style="padding:4px 8px; color:${color}; font-weight:${weight};">${adj.toFixed(4)}</td>
                </tr>`;
            }
            html += '</table>';
        }

        display.innerHTML = html;
    },

    renderResult() {
        const display = document.getElementById('ad-result-display');
        const { x, y } = this.getInputs();
        const dfdx = this.adjoints['v₀'];
        const dfdy = this.adjoints['v₁'];

        // Analytic verification
        const analyticDfdx = Math.sin(x) + (x + y) * Math.cos(x);
        const analyticDfdy = Math.sin(x);

        display.innerHTML = `
            <div style="display:flex; gap:30px; justify-content:center; flex-wrap:wrap;">
                <div>
                    <span style="font-weight:700; color:#2563eb;">∂f/∂x = ${dfdx.toFixed(4)}</span>
                    <span style="color:#94a3b8; font-size:0.85em;"> (analytic: ${analyticDfdx.toFixed(4)} ✓)</span>
                </div>
                <div>
                    <span style="font-weight:700; color:#db2777;">∂f/∂y = ${dfdy.toFixed(4)}</span>
                    <span style="color:#94a3b8; font-size:0.85em;"> (analytic: ${analyticDfdy.toFixed(4)} ✓)</span>
                </div>
            </div>
        `;
    },

    init() {
        document.getElementById('slider-ad-x').addEventListener('input', () => {
            document.getElementById('disp-ad-x').textContent =
                parseFloat(document.getElementById('slider-ad-x').value).toFixed(2);
            this.reset();
        });
        document.getElementById('slider-ad-y').addEventListener('input', () => {
            document.getElementById('disp-ad-y').textContent =
                parseFloat(document.getElementById('slider-ad-y').value).toFixed(2);
            this.reset();
        });
        document.getElementById('ad-btn-forward').addEventListener('click', () => this.runForward());
        document.getElementById('ad-btn-backward').addEventListener('click', () => this.runBackward());
        document.getElementById('ad-btn-reset').addEventListener('click', () => this.reset());
        this.reset();
    }
};

// ============================================================
// 2. COMPUTATIONAL GRAPH VISUALIZATION (SVG)
// ============================================================

const ADGraph = {
    getInputs() {
        const x = parseFloat(document.getElementById('slider-graph-x').value);
        const y = parseFloat(document.getElementById('slider-graph-y').value);
        return { x, y };
    },

    compute(x, y) {
        const v0 = x;
        const v1 = y;
        const v2 = v0 + v1;
        const v3 = Math.sin(v0);
        const v4 = v2 * v3;

        // Adjoints (backward)
        const adj = { v4: 1 };
        adj.v2 = adj.v4 * v3;
        adj.v3 = adj.v4 * v2;
        adj.v0 = adj.v2 * 1 + adj.v3 * Math.cos(v0);
        adj.v1 = adj.v2 * 1;

        return {
            nodes: [
                { id: 'v0', label: 'x', val: v0, adj: adj.v0, cx: 80, cy: 100 },
                { id: 'v1', label: 'y', val: v1, adj: adj.v1, cx: 80, cy: 220 },
                { id: 'v2', label: '+', val: v2, adj: adj.v2, cx: 300, cy: 100 },
                { id: 'v3', label: 'sin', val: v3, adj: adj.v3, cx: 300, cy: 220 },
                { id: 'v4', label: '×', val: v4, adj: adj.v4, cx: 550, cy: 160 },
            ],
            edges: [
                { from: 'v0', to: 'v2', label: '∂=1' },
                { from: 'v1', to: 'v2', label: '∂=1' },
                { from: 'v0', to: 'v3', label: `∂=cos(x)=${Math.cos(v0).toFixed(3)}` },
                { from: 'v2', to: 'v4', label: `∂=v₃=${v3.toFixed(3)}` },
                { from: 'v3', to: 'v4', label: `∂=v₂=${v2.toFixed(3)}` },
            ]
        };
    },

    render() {
        const { x, y } = this.getInputs();
        const graph = this.compute(x, y);
        const svg = document.getElementById('ad-graph-svg');
        const info = document.getElementById('ad-graph-info');

        const nodeMap = {};
        graph.nodes.forEach(n => { nodeMap[n.id] = n; });

        let html = '';

        // Defs for arrowhead
        html += `<defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8"/>
            </marker>
        </defs>`;

        // Draw edges
        graph.edges.forEach(e => {
            const from = nodeMap[e.from];
            const to = nodeMap[e.to];
            const mx = (from.cx + to.cx) / 2;
            const my = (from.cy + to.cy) / 2;
            html += `<line x1="${from.cx}" y1="${from.cy}" x2="${to.cx}" y2="${to.cy}"
                stroke="#cbd5e1" stroke-width="2" marker-end="url(#arrowhead)"/>`;
            html += `<text x="${mx}" y="${my - 8}" text-anchor="middle" font-size="10"
                fill="#64748b" font-family="monospace">${e.label}</text>`;
        });

        // Draw output label
        html += `<text x="660" y="165" text-anchor="middle" font-size="14" fill="#1e293b" font-weight="700">f = ${graph.nodes[4].val.toFixed(4)}</text>`;

        // Draw nodes
        const colors = {
            'v0': '#2563eb', 'v1': '#db2777',
            'v2': '#059669', 'v3': '#d97706', 'v4': '#7c3aed'
        };

        graph.nodes.forEach(n => {
            const r = 32;
            const col = colors[n.id] || '#64748b';
            html += `<circle class="ad-graph-node" data-id="${n.id}" cx="${n.cx}" cy="${n.cy}" r="${r}"
                fill="white" stroke="${col}" stroke-width="3" style="cursor:pointer;"/>`;
            html += `<text x="${n.cx}" y="${n.cy - 6}" text-anchor="middle" font-size="13"
                font-weight="700" fill="${col}" style="pointer-events:none;">${n.label}</text>`;
            html += `<text x="${n.cx}" y="${n.cy + 12}" text-anchor="middle" font-size="10"
                font-family="monospace" fill="#1e293b" style="pointer-events:none;">${n.val.toFixed(3)}</text>`;

            // Adjoint label below
            html += `<text x="${n.cx}" y="${n.cy + r + 16}" text-anchor="middle" font-size="10"
                fill="#ef4444" font-weight="600" style="pointer-events:none;">∂f/∂${n.label} = ${n.adj.toFixed(4)}</text>`;
        });

        svg.innerHTML = html;

        // Hover interaction
        svg.querySelectorAll('.ad-graph-node').forEach(el => {
            el.addEventListener('mouseenter', () => {
                const id = el.dataset.id;
                const n = nodeMap[id];
                info.innerHTML = `<strong style="color:${colors[id]}">${n.label}</strong> &nbsp;|&nbsp;
                    Forward value: <strong>${n.val.toFixed(6)}</strong> &nbsp;|&nbsp;
                    Adjoint ∂f/∂${n.label}: <strong style="color:#ef4444">${n.adj.toFixed(6)}</strong>`;
            });
            el.addEventListener('mouseleave', () => {
                info.innerHTML = 'Hover over a node to see its details.';
            });
        });
    },

    init() {
        const update = () => {
            const x = parseFloat(document.getElementById('slider-graph-x').value);
            const y = parseFloat(document.getElementById('slider-graph-y').value);
            document.getElementById('disp-graph-x').textContent = x.toFixed(2);
            document.getElementById('disp-graph-y').textContent = y.toFixed(2);
            this.render();
        };
        document.getElementById('slider-graph-x').addEventListener('input', update);
        document.getElementById('slider-graph-y').addEventListener('input', update);
        update();
    }
};

// ============================================================
// 3. GRADIENT DESCENT ON LOSS LANDSCAPE
// ============================================================

const GDDemo = {
    path: [],
    animating: false,
    animationId: null,

    getParams() {
        return {
            lr: parseFloat(document.getElementById('slider-gd-lr').value),
            w1: parseFloat(document.getElementById('slider-gd-w1').value),
            w2: parseFloat(document.getElementById('slider-gd-w2').value),
        };
    },

    reset() {
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
        this.animating = false;
        this.path = [];
        const { w1, w2 } = this.getParams();
        this.path.push({ w1, w2, loss: w1 * w1 + w2 * w2 });
        this.renderPlot();
        this.updateReadout();
    },

    step() {
        if (this.path.length === 0) this.reset();
        const last = this.path[this.path.length - 1];
        const lr = parseFloat(document.getElementById('slider-gd-lr').value);

        // Gradient of L = w1^2 + w2^2
        const gw1 = 2 * last.w1;
        const gw2 = 2 * last.w2;

        const newW1 = last.w1 - lr * gw1;
        const newW2 = last.w2 - lr * gw2;
        const newLoss = newW1 * newW1 + newW2 * newW2;

        this.path.push({ w1: newW1, w2: newW2, loss: newLoss });
        this.renderPlot();
        this.updateReadout();
        this.updateEquation(last, lr, gw1, gw2, newW1, newW2);
    },

    run50() {
        if (this.animating) return;
        this.animating = true;
        let count = 0;
        const doStep = () => {
            if (count >= 50 || !this.animating) {
                this.animating = false;
                return;
            }
            this.step();
            count++;
            this.animationId = setTimeout(doStep, 60);
        };
        doStep();
    },

    updateReadout() {
        const last = this.path[this.path.length - 1];
        const el = document.getElementById('gd-loss-readout');
        el.textContent = `Step ${this.path.length - 1} | w₁ = ${last.w1.toFixed(4)}, w₂ = ${last.w2.toFixed(4)} | Loss = ${last.loss.toFixed(6)}`;
    },

    updateEquation(prev, lr, gw1, gw2, newW1, newW2) {
        const el = document.getElementById('gd-equation');
        el.innerHTML = `$$w_1^{\\text{new}} = ${prev.w1.toFixed(3)} - ${lr.toFixed(2)} \\cdot ${gw1.toFixed(3)} = ${newW1.toFixed(4)}, \\quad w_2^{\\text{new}} = ${prev.w2.toFixed(3)} - ${lr.toFixed(2)} \\cdot ${gw2.toFixed(3)} = ${newW2.toFixed(4)}$$`;
        try { render_temml(); } catch (e) {}
    },

    renderPlot() {
        const plotDiv = document.getElementById('plot-gd-landscape');
        if (!plotDiv) return;

        // Contour data
        const range = [];
        for (let i = -5; i <= 5; i += 0.2) range.push(i);
        const z = range.map(w1 => range.map(w2 => w1 * w1 + w2 * w2));

        const contour = {
            x: range, y: range, z: z,
            type: 'contour',
            colorscale: 'YlOrRd',
            reversescale: true,
            contours: { start: 0, end: 50, size: 2 },
            showscale: false,
            hoverinfo: 'skip',
            name: 'Loss landscape'
        };

        // Path trace
        const pathW1 = this.path.map(p => p.w1);
        const pathW2 = this.path.map(p => p.w2);

        const pathTrace = {
            x: pathW1, y: pathW2,
            mode: 'lines+markers',
            line: { color: '#1e293b', width: 2 },
            marker: { size: 4, color: '#1e293b' },
            name: 'GD path',
            hoverinfo: 'text',
            text: this.path.map((p, i) => `Step ${i}: (${p.w1.toFixed(3)}, ${p.w2.toFixed(3)}), L=${p.loss.toFixed(4)}`)
        };

        // Start and end markers
        const startMarker = {
            x: [pathW1[0]], y: [pathW2[0]],
            mode: 'markers',
            marker: { size: 14, color: '#ef4444', symbol: 'diamond', line: { color: '#fff', width: 2 } },
            name: 'Start',
            showlegend: true
        };

        const endMarker = {
            x: [pathW1[pathW1.length - 1]], y: [pathW2[pathW2.length - 1]],
            mode: 'markers',
            marker: { size: 14, color: '#10b981', symbol: 'star', line: { color: '#fff', width: 2 } },
            name: 'Current',
            showlegend: true
        };

        // Minimum marker
        const minMarker = {
            x: [0], y: [0],
            mode: 'markers',
            marker: { size: 10, color: '#2563eb', symbol: 'x', line: { width: 3 } },
            name: 'Minimum (0,0)',
            showlegend: true
        };

        const layout = {
            margin: { t: 30, b: 50, l: 50, r: 20 },
            xaxis: { title: 'w₁', range: [-5.5, 5.5] },
            yaxis: { title: 'w₂', range: [-5.5, 5.5] },
            legend: { orientation: 'h', y: -0.15 },
            title: { text: 'Gradient Descent Path on L(w₁, w₂) = w₁² + w₂²', font: { size: 14 } },
            plot_bgcolor: '#f8fafc',
            paper_bgcolor: '#fff',
        };

        const config = { displayModeBar: false, responsive: true };

        Plotly.react(plotDiv, [contour, pathTrace, startMarker, endMarker, minMarker], layout, config);
    },

    updateEquation(prev, lr, gw1, gw2, newW1, newW2) {
        const el = document.getElementById('gd-equation');
        if (!el) return;
        el.innerHTML = `<span style="font-family:monospace; font-size:0.95em;">
            w₁<sup>new</sup> = ${prev.w1.toFixed(3)} − ${lr.toFixed(2)} × ${gw1.toFixed(3)} = <strong>${newW1.toFixed(4)}</strong> &nbsp;|&nbsp;
            w₂<sup>new</sup> = ${prev.w2.toFixed(3)} − ${lr.toFixed(2)} × ${gw2.toFixed(3)} = <strong>${newW2.toFixed(4)}</strong>
        </span>`;
    },

    init() {
        document.getElementById('slider-gd-lr').addEventListener('input', () => {
            document.getElementById('disp-gd-lr').textContent =
                parseFloat(document.getElementById('slider-gd-lr').value).toFixed(2);
        });
        document.getElementById('slider-gd-w1').addEventListener('input', () => {
            document.getElementById('disp-gd-w1').textContent =
                parseFloat(document.getElementById('slider-gd-w1').value).toFixed(2);
            this.reset();
        });
        document.getElementById('slider-gd-w2').addEventListener('input', () => {
            document.getElementById('disp-gd-w2').textContent =
                parseFloat(document.getElementById('slider-gd-w2').value).toFixed(2);
            this.reset();
        });
        document.getElementById('gd-btn-step').addEventListener('click', () => this.step());
        document.getElementById('gd-btn-run').addEventListener('click', () => this.run50());
        document.getElementById('gd-btn-reset').addEventListener('click', () => this.reset());
        this.reset();
    }
};

// ============================================================
// 4. VANISHING / EXPLODING GRADIENT DEMO
// ============================================================

const VGDemo = {
    activationDerivs: {
        sigmoid: { maxDeriv: 0.25, label: 'Sigmoid', color: '#ef4444' },
        tanh: { maxDeriv: 1.0, label: 'Tanh', color: '#f59e0b' },
        relu: { maxDeriv: 1.0, label: 'ReLU', color: '#10b981' },
        explode: { maxDeriv: 1.5, label: 'Unstable (1.5)', color: '#7c3aed' },
    },

    render() {
        const nLayers = parseInt(document.getElementById('slider-vg-layers').value);
        const actType = document.getElementById('select-vg-activation').value;
        const act = this.activationDerivs[actType];

        document.getElementById('disp-vg-layers').textContent = nLayers;

        // Compute gradient magnitude at each layer (backward from output)
        const layers = [];
        const magnitudes = [];
        let grad = 1.0;
        for (let i = nLayers; i >= 1; i--) {
            layers.push(`Layer ${i}`);
            magnitudes.push(grad);
            grad *= act.maxDeriv;
        }
        // Reverse so layer 1 is on the left
        layers.reverse();
        magnitudes.reverse();

        const finalGrad = magnitudes[0];

        // Formula display
        const formulaEl = document.getElementById('vg-formula');
        formulaEl.innerHTML = `<span style="font-family:monospace;">
            Gradient at layer 1 = (${act.maxDeriv})<sup>${nLayers}</sup> = <strong>${finalGrad.toExponential(3)}</strong>
        </span>`;

        // Verdict
        const verdictEl = document.getElementById('vg-verdict');
        let verdict, verdictColor, verdictBg;
        if (finalGrad < 1e-6) {
            verdict = '💀 Gradient has VANISHED — early layers cannot learn.';
            verdictColor = '#dc2626';
            verdictBg = '#fef2f2';
        } else if (finalGrad > 1e6) {
            verdict = '💥 Gradient has EXPLODED — training will diverge to NaN.';
            verdictColor = '#7c3aed';
            verdictBg = '#f5f3ff';
        } else if (Math.abs(finalGrad - 1.0) < 0.01) {
            verdict = '✅ Gradient is STABLE — all layers learn equally.';
            verdictColor = '#059669';
            verdictBg = '#ecfdf5';
        } else {
            verdict = `⚠️ Gradient magnitude: ${finalGrad.toExponential(3)}`;
            verdictColor = '#d97706';
            verdictBg = '#fffbeb';
        }
        verdictEl.style.background = verdictBg;
        verdictEl.style.color = verdictColor;
        verdictEl.style.fontWeight = '600';
        verdictEl.textContent = verdict;

        // Plot
        const plotDiv = document.getElementById('plot-vg-gradient');
        if (!plotDiv) return;

        // Use log scale if range is extreme
        const useLog = (Math.max(...magnitudes) / Math.min(...magnitudes.filter(m => m > 0))) > 1000;

        const barTrace = {
            x: layers,
            y: magnitudes,
            type: 'bar',
            marker: {
                color: magnitudes.map(m => {
                    if (m < 1e-4) return '#fee2e2';
                    if (m < 0.01) return '#fecaca';
                    if (m < 0.1) return '#fca5a5';
                    if (m < 0.5) return '#f87171';
                    if (m <= 2) return '#10b981';
                    if (m <= 100) return '#a78bfa';
                    return '#7c3aed';
                }),
                line: { color: '#1e293b', width: 1 }
            },
            hovertemplate: '%{x}<br>Gradient: %{y:.4e}<extra></extra>'
        };

        // Reference line at 1.0
        const refLine = {
            x: layers,
            y: layers.map(() => 1.0),
            type: 'scatter',
            mode: 'lines',
            line: { color: '#94a3b8', width: 2, dash: 'dash' },
            name: 'Ideal (1.0)',
            hoverinfo: 'skip'
        };

        const layout = {
            margin: { t: 30, b: 60, l: 70, r: 20 },
            xaxis: { title: 'Layer (backward from output)', tickangle: -45 },
            yaxis: {
                title: 'Gradient Magnitude',
                type: useLog ? 'log' : 'linear',
            },
            title: { text: `Gradient Flow: ${act.label} (max σ′ = ${act.maxDeriv})`, font: { size: 14 } },
            showlegend: false,
            plot_bgcolor: '#f8fafc',
        };

        const config = { displayModeBar: false, responsive: true };

        Plotly.react(plotDiv, [barTrace, refLine], layout, config);
    },

    init() {
        document.getElementById('slider-vg-layers').addEventListener('input', () => this.render());
        document.getElementById('select-vg-activation').addEventListener('change', () => this.render());
        this.render();
    }
};

// ============================================================
// MODULE LOADER
// ============================================================

// ============================================================
// LAZY LOADING FOR AUTODIFF MODULE
// ============================================================

const _adLazyRegistry = [];
let _adLazyObserver = null;

function _adLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _adLazyRegistry.push({ el, initFn, initialized: false });
}

function _adLazyCreateObserver() {
    if (_adLazyObserver) return;

    _adLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _adLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _adLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin // uses the already-defined global const
    });

    _adLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _adLazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// REPLACEMENT: loadAutodiffModule (drop-in replacement)
// ============================================================

async function loadAutodiffModule() {
    // 1. Tape-Based Reverse-Mode AD Demo
    _adLazyRegister('ad-tape-display', () => {
        ADTape.init();
    });

    // 2. Computational Graph Visualization
    _adLazyRegister('ad-graph-svg', () => {
        ADGraph.init();
    });

    // 3. Gradient Descent on Loss Landscape
    _adLazyRegister('plot-gd-landscape', () => {
        GDDemo.init();
    });

    // 4. Vanishing / Exploding Gradient Demo
    _adLazyRegister('plot-vg-gradient', () => {
        VGDemo.init();
    });

    // Start observing
    _adLazyCreateObserver();

    return Promise.resolve();
}
