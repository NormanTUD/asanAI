// ── Derivatives Interactive Module ──────────────────────────────────────────

function initDerivatives() {
    initSecantTangent();
    initDerivRulesExplorer();
    initTangentLineExplorer();
    initChainRuleDemo();
    initGradientSurface();
}

// ── 1. Secant → Tangent Interactive ─────────────────────────────────────────

function initSecantTangent() {
    const slider = document.getElementById('slider-deriv-h');
    if (!slider) return;

    const f = x => x * x;
    const fPrime = x => 2 * x;
    const x0 = 1;

    function update() {
        const h = parseFloat(slider.value);
        document.getElementById('disp-deriv-h').textContent = h.toFixed(2);

        const y0 = f(x0);
        const x1 = x0 + h;
        const y1 = f(x1);
        const secantSlope = (y1 - y0) / h;
        const tangentSlope = fPrime(x0);

        // Formula display
        document.getElementById('deriv-secant-formula').innerHTML =
            `$$\\text{Secant slope} = \\frac{f(${x0} + ${h.toFixed(2)}) - f(${x0})}{${h.toFixed(2)}} = \\frac{${y1.toFixed(4)} - ${y0.toFixed(4)}}{${h.toFixed(2)}} = ${secantSlope.toFixed(4)} \\qquad \\text{True derivative} = ${tangentSlope.toFixed(4)}$$`;
        render_temml();

        // Curve
        const xVals = [], yVals = [];
        for (let t = -1; t <= 4; t += 0.05) {
            xVals.push(t);
            yVals.push(f(t));
        }

        // Secant line
        const secX = [-1, 4];
        const secY = secX.map(x => y0 + secantSlope * (x - x0));

        // Tangent line
        const tanY = secX.map(x => y0 + tangentSlope * (x - x0));

        const data = [
            { x: xVals, y: yVals, mode: 'lines', name: 'f(x) = x²', line: { color: '#2563eb', width: 3 } },
            { x: secX, y: secY, mode: 'lines', name: `Secant (slope=${secantSlope.toFixed(3)})`, line: { color: '#ef4444', width: 2, dash: 'dash' } },
            { x: secX, y: tanY, mode: 'lines', name: `Tangent (slope=${tangentSlope})`, line: { color: '#22c55e', width: 2, dash: 'dot' } },
            { x: [x0], y: [y0], mode: 'markers', name: 'Point (x₀)', marker: { size: 10, color: themeColor('#1e293b') }, showlegend: false },
            { x: [x1], y: [y1], mode: 'markers', name: 'Point (x₀+h)', marker: { size: 10, color: '#ef4444', symbol: 'diamond' }, showlegend: false },
        ];

        const layout = {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { title: 'x', range: [-1, 4], zeroline: true },
            yaxis: { title: 'f(x)', range: [-1, 10], zeroline: true },
            legend: { orientation: 'h', y: -0.2 },
            paper_bgcolor: themeColor('#fff'),
            plot_bgcolor: themeColor('#fff'),
        };

        Plotly.react('plot-secant-tangent', data, layout);
    }

    slider.addEventListener('input', update);
    update();
}

// ── 3. Tangent Line Explorer ────────────────────────────────────────────────

function initTangentLineExplorer() {
    const slider = document.getElementById('slider-tangent-x');
    if (!slider) return;

    const f = x => x * x * x - 3 * x;
    const fp = x => 3 * x * x - 3;

    function update() {
        const a = parseFloat(slider.value);
        document.getElementById('disp-tangent-x').textContent = a.toFixed(2);

        const fa = f(a);
        const slope = fp(a);

        // Info display
        document.getElementById('tangent-info').innerHTML =
            `$$f(${a.toFixed(2)}) = ${fa.toFixed(4)}, \\quad f'(${a.toFixed(2)}) = ${slope.toFixed(4)} \\quad \\text{Tangent: } y = ${fa.toFixed(4)} + ${slope.toFixed(4)}(x - ${a.toFixed(2)})$$`;
        render_temml();

        // Curve
        const xVals = [], yVals = [];
        for (let t = -2.8; t <= 2.8; t += 0.03) {
            xVals.push(t);
            yVals.push(f(t));
        }

        // Tangent line
        const tanX = [-3, 3];
        const tanY = tanX.map(x => fa + slope * (x - a));

        // Critical points where f'(x) = 0: x = ±1
        const critX = [-1, 1];
        const critY = critX.map(x => f(x));

        const data = [
            { x: xVals, y: yVals, mode: 'lines', name: 'f(x) = x³ - 3x', line: { color: '#2563eb', width: 3 } },
            { x: tanX, y: tanY, mode: 'lines', name: `Tangent (slope=${slope.toFixed(3)})`, line: { color: '#f59e0b', width: 2.5 } },
            { x: [a], y: [fa], mode: 'markers', name: 'Current point', marker: { size: 12, color: themeColor('#1e293b'), line: { color: themeColor('#fff'), width: 2 } }, showlegend: false },
            { x: critX, y: critY, mode: 'markers', name: "f'(x) = 0 (extrema)", marker: { size: 8, color: '#ef4444', symbol: 'star' } },
        ];

        const layout = {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { title: 'x', range: [-3, 3], zeroline: true },
            yaxis: { title: 'f(x)', range: [-5, 5], zeroline: true },
            legend: { orientation: 'h', y: -0.2 },
            paper_bgcolor: themeColor('#fff'),
            plot_bgcolor: themeColor('#fff'),
        };

        Plotly.react('plot-tangent-line', data, layout);
    }

    slider.addEventListener('input', update);
    update();
}

// ── 4. Chain Rule Demo ──────────────────────────────────────────────────────

function initChainRuleDemo() {
    const slider = document.getElementById('slider-chain-a');
    if (!slider) return;

    function update() {
        const a = parseFloat(slider.value);
        document.getElementById('disp-chain-a').textContent = a.toFixed(1);

        // f(x) = sin(ax), f'(x) = a*cos(ax)
        document.getElementById('chain-rule-formula').innerHTML =
            `$$f(x) = \\sin(\\underbrace{${a.toFixed(1)}}_{a} \\cdot x) \\qquad f'(x) = \\underbrace{${a.toFixed(1)}}_{\\text{inner derivative}} \\cdot \\cos(${a.toFixed(1)} \\cdot x)$$
            <br><span style="color:#64748b; font-size:0.85em;">Outer: $\\frac{d}{du}\\sin(u) = \\cos(u)$ &nbsp;×&nbsp; Inner: $\\frac{d}{dx}(${a.toFixed(1)}x) = ${a.toFixed(1)}$</span>`;
        render_temml();

        const xVals = [], yF = [], yFP = [];
        for (let x = -2 * Math.PI; x <= 2 * Math.PI; x += 0.03) {
            xVals.push(x);
            yF.push(Math.sin(a * x));
            yFP.push(a * Math.cos(a * x));
        }

        const data = [
            { x: xVals, y: yF, mode: 'lines', name: `f(x) = sin(${a.toFixed(1)}x)`, line: { color: '#2563eb', width: 3 } },
            { x: xVals, y: yFP, mode: 'lines', name: `f'(x) = ${a.toFixed(1)}·cos(${a.toFixed(1)}x)`, line: { color: '#ef4444', width: 2, dash: 'dash' } },
        ];

        const yMax = Math.max(a + 0.5, 1.5);
        const layout = {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { title: 'x', range: [-2 * Math.PI, 2 * Math.PI], zeroline: true },
            yaxis: { title: 'y', range: [-yMax, yMax], zeroline: true },
            legend: { orientation: 'h', y: -0.2 },
            paper_bgcolor: themeColor('#fff'),
            plot_bgcolor: themeColor('#fff'),
        };

        Plotly.react('plot-chain-rule', data, layout);
    }

    slider.addEventListener('input', update);
    update();
}

// ── 5. Gradient on a Surface ────────────────────────────────────────────────

function initGradientSurface() {
    const sliderX = document.getElementById('slider-grad-x');
    const sliderY = document.getElementById('slider-grad-y');
    if (!sliderX || !sliderY) return;

    // f(x,y) = x^2 + y^2
    // ∂f/∂x = 2x, ∂f/∂y = 2y
    // ∇f = (2x, 2y)

    function update() {
        const px = parseFloat(sliderX.value);
        const py = parseFloat(sliderY.value);
        document.getElementById('disp-grad-x').textContent = px.toFixed(1);
        document.getElementById('disp-grad-y').textContent = py.toFixed(1);

        const fVal = px * px + py * py;
        const gradX = 2 * px;
        const gradY = 2 * py;
        const gradMag = Math.sqrt(gradX * gradX + gradY * gradY);

        document.getElementById('gradient-info').innerHTML =
            `$$f(${px.toFixed(1)}, ${py.toFixed(1)}) = ${fVal.toFixed(2)} \\qquad \\nabla f = \\begin{pmatrix} 2 \\cdot ${px.toFixed(1)} \\\\ 2 \\cdot ${py.toFixed(1)} \\end{pmatrix} = \\begin{pmatrix} ${gradX.toFixed(2)} \\\\ ${gradY.toFixed(2)} \\end{pmatrix} \\qquad |\\nabla f| = ${gradMag.toFixed(3)}$$`;
        render_temml();

        // Contour plot of f(x,y) = x^2 + y^2
        const gridSize = 60;
        const xGrid = [], yGrid = [], zGrid = [];
        for (let i = 0; i <= gridSize; i++) {
            const y = -3.5 + 7 * i / gridSize;
            yGrid.push(y);
            const row = [];
            for (let j = 0; j <= gridSize; j++) {
                const x = -3.5 + 7 * j / gridSize;
                if (i === 0) xGrid.push(x);
                row.push(x * x + y * y);
            }
            zGrid.push(row);
        }

        // Negative gradient arrow (direction of descent)
        const arrowScale = 0.3;
        const negGradX = -gradX * arrowScale;
        const negGradY = -gradY * arrowScale;

        const data = [
            {
                x: xGrid, y: yGrid, z: zGrid,
                type: 'contour',
                colorscale: 'Blues',
                showscale: false,
                contours: { coloring: 'heatmap' },
                ncontours: 20,
                hoverinfo: 'skip',
            },
            // Current point
            {
                x: [px], y: [py],
                mode: 'markers',
                name: `(${px.toFixed(1)}, ${py.toFixed(1)})`,
                marker: { size: 14, color: '#ef4444', line: { color: themeColor('#fff'), width: 2 } },
            },
        ];

        const layout = {
            margin: { t: 10, b: 40, l: 40, r: 10 },
            xaxis: { title: 'x', range: [-3.5, 3.5], zeroline: true },
            yaxis: { title: 'y', range: [-3.5, 3.5], zeroline: true, scaleanchor: 'x', scaleratio: 1 },
            legend: { orientation: 'h', y: -0.15 },
            paper_bgcolor: themeColor('#fff'),
            plot_bgcolor: themeColor('#fff'),
            annotations: [
                {
                    x: px + negGradX,
                    y: py + negGradY,
                    ax: px,
                    ay: py,
                    xref: 'x', yref: 'y',
                    axref: 'x', ayref: 'y',
                    showarrow: true,
                    arrowhead: 3,
                    arrowsize: 1.5,
                    arrowwidth: 3,
                    arrowcolor: '#ef4444',
                    text: '',
                },
                {
                    x: px + negGradX * 1.15,
                    y: py + negGradY * 1.15,
                    xref: 'x', yref: 'y',
                    text: '-∇f',
                    showarrow: false,
                    font: { size: 14, color: '#ef4444', family: 'serif' },
                },
            ],
        };

        Plotly.react('plot-gradient-surface', data, layout);
    }

    sliderX.addEventListener('input', update);
    sliderY.addEventListener('input', update);
    update();
}

// ── Module loader ───────────────────────────────────────────────────────────

// ============================================================
// LAZY LOADING FOR DIFFERENTIATION MODULE
// ============================================================

const _diffLazyRegistry = [];
let _diffLazyObserver = null;

function _diffLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _diffLazyRegistry.push({ el, initFn, initialized: false });
}

function _diffLazyCreateObserver() {
    if (_diffLazyObserver) return;

    _diffLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _diffLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _diffLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin // uses the already-defined global const
    });

    _diffLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _diffLazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// REPLACEMENT: loadDerivativesModule (drop-in replacement)
// ============================================================

async function loadDerivativesModule() {
    updateLoadingStatus('Loading section about Derivatives...');

    // 1. Secant → Tangent
    _diffLazyRegister('plot-secant-tangent', () => {
        initSecantTangent();
    });

    // 2. Tangent Line Explorer
    _diffLazyRegister('plot-tangent-line', () => {
        initTangentLineExplorer();
    });

    // 4. Chain Rule Demo
    _diffLazyRegister('plot-chain-rule', () => {
        initChainRuleDemo();
    });

    // 5. Gradient Surface
    _diffLazyRegister('plot-gradient-surface', () => {
        initGradientSurface();
    });

    // Start observing
    _diffLazyCreateObserver();

    // Re-render plots when the user toggles dark/light mode so themeColor()
    // picks up the new palette on the next call.
    if (window.__MN_DARK) {
        window.__MN_DARK.onChange(() => {
            _diffLazyRegistry.forEach(r => { if (r.initialized) { try { r.initFn(); } catch (e) { /* ignore */ } } });
        });
    }

    return Promise.resolve();
}
