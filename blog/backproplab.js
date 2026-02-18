// ============================================================
// BACKPROPLAB.JS — Interactive Backpropagation Visualizer
// Hover-based LaTeX annotations, larger diagram, extensive \underbrace
// ============================================================

function initBackpropLab() {
    // --- State ---
    let net = {};
    let gradients = {};
    let lossHistory = [];
    let epoch = 0;
    let phase = 'idle';

    // --- DOM References ---
    const els = {
        x1: document.getElementById('bp-x1'),
        x2: document.getElementById('bp-x2'),
        t1: document.getElementById('bp-t1'),
        t2: document.getElementById('bp-t2'),
        lr: document.getElementById('bp-lr'),
        w1: document.getElementById('bp-w1'),
        w2: document.getElementById('bp-w2'),
        w3: document.getElementById('bp-w3'),
        w4: document.getElementById('bp-w4'),
        w5: document.getElementById('bp-w5'),
        w6: document.getElementById('bp-w6'),
        w7: document.getElementById('bp-w7'),
        w8: document.getElementById('bp-w8'),
        b1: document.getElementById('bp-b1'),
        b2: document.getElementById('bp-b2'),
        b3: document.getElementById('bp-b3'),
        b4: document.getElementById('bp-b4'),
        btnForward: document.getElementById('bp-btn-forward'),
        btnBackward: document.getElementById('bp-btn-backward'),
        btnUpdate: document.getElementById('bp-btn-update'),
        btnAuto: document.getElementById('bp-btn-auto'),
        btnReset: document.getElementById('bp-btn-reset'),
        mathDisplay: document.getElementById('bp-math-display'),
        svg: document.getElementById('bp-network-svg'),
        epochCount: document.getElementById('bp-epoch-count'),
        lossChart: document.getElementById('bp-loss-chart')
    };

    const gradEls = {
        w1: document.getElementById('bp-gw1'),
        w2: document.getElementById('bp-gw2'),
        w3: document.getElementById('bp-gw3'),
        w4: document.getElementById('bp-gw4'),
        w5: document.getElementById('bp-gw5'),
        w6: document.getElementById('bp-gw6'),
        w7: document.getElementById('bp-gw7'),
        w8: document.getElementById('bp-gw8'),
        b1: document.getElementById('bp-gb1'),
        b2: document.getElementById('bp-gb2'),
        b3: document.getElementById('bp-gb3'),
        b4: document.getElementById('bp-gb4'),
    };

    // ============================================================
    // TOOLTIP SYSTEM — HTML overlay positioned over SVG
    // ============================================================
    let tooltipEl = document.getElementById('bp-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'bp-tooltip';
        tooltipEl.style.cssText = `
            position: absolute;
            display: none;
            pointer-events: none;
            z-index: 1000;
            background: #fffef5;
            border: 2px solid #f59e0b;
            border-radius: 10px;
            padding: 14px 18px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.18);
            max-width: 420px;
            font-size: 15px;
            line-height: 1.9;
        `;
        tooltipEl.classList.add('md');
        // Insert right after the SVG's parent so positioning works
        els.svg.parentElement.style.position = 'relative';
        els.svg.parentElement.appendChild(tooltipEl);
    }

    function showTooltip(svgNode, latexHTML, borderColor) {
        tooltipEl.innerHTML = latexHTML;
        tooltipEl.style.borderColor = borderColor || '#f59e0b';
        tooltipEl.style.display = 'block';

        // Render LaTeX inside tooltip
        if (typeof render_temml === 'function') render_temml();

        // Position relative to SVG container
        const svgRect = els.svg.getBoundingClientRect();
        const containerRect = els.svg.parentElement.getBoundingClientRect();

        // Get the SVG element's position in SVG coordinates
        const bbox = svgNode.getBoundingClientRect();
        const left = bbox.left - containerRect.left + bbox.width / 2;
        const top = bbox.bottom - containerRect.top + 10;

        // Clamp to stay within container
        const tipW = tooltipEl.offsetWidth;
        const clampedLeft = Math.max(10, Math.min(left - tipW / 2, containerRect.width - tipW - 10));

        tooltipEl.style.left = clampedLeft + 'px';
        tooltipEl.style.top = top + 'px';
    }

    function hideTooltip() {
        tooltipEl.style.display = 'none';
    }

    // --- Helpers ---
    function sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }

    function val(id) {
        return parseFloat(els[id].value);
    }

    function fmt(v, d = 6) {
        return v.toFixed(d);
    }

    function fmtShort(v) {
        return v.toFixed(4);
    }

    function readWeights() {
        return {
            w1: val('w1'), w2: val('w2'), w3: val('w3'), w4: val('w4'),
            w5: val('w5'), w6: val('w6'), w7: val('w7'), w8: val('w8'),
            b1: val('b1'), b2: val('b2'), b3: val('b3'), b4: val('b4')
        };
    }

    function writeWeights(w) {
        els.w1.value = fmtShort(w.w1);
        els.w2.value = fmtShort(w.w2);
        els.w3.value = fmtShort(w.w3);
        els.w4.value = fmtShort(w.w4);
        els.w5.value = fmtShort(w.w5);
        els.w6.value = fmtShort(w.w6);
        els.w7.value = fmtShort(w.w7);
        els.w8.value = fmtShort(w.w8);
        els.b1.value = fmtShort(w.b1);
        els.b2.value = fmtShort(w.b2);
        els.b3.value = fmtShort(w.b3);
        els.b4.value = fmtShort(w.b4);
    }

    // --- Forward Pass ---
    function forwardPass() {
        const x1 = val('x1'), x2 = val('x2');
        const t1 = val('t1'), t2 = val('t2');
        const w = readWeights();

        const z_h1 = w.w1 * x1 + w.w2 * x2 + w.b1;
        const h1 = sigmoid(z_h1);
        const z_h2 = w.w3 * x1 + w.w4 * x2 + w.b2;
        const h2 = sigmoid(z_h2);

        const z_o1 = w.w5 * h1 + w.w6 * h2 + w.b3;
        const o1 = sigmoid(z_o1);
        const z_o2 = w.w7 * h1 + w.w8 * h2 + w.b4;
        const o2 = sigmoid(z_o2);

        const E1 = 0.5 * Math.pow(t1 - o1, 2);
        const E2 = 0.5 * Math.pow(t2 - o2, 2);
        const E_total = E1 + E2;

        net = { x1, x2, t1, t2, w, z_h1, h1, z_h2, h2, z_o1, o1, z_o2, o2, E1, E2, E_total };
        return net;
    }

    // --- Backward Pass ---
    function backwardPass() {
        const { x1, x2, t1, t2, w, h1, h2, o1, o2 } = net;

        const delta_o1 = -(t1 - o1) * o1 * (1 - o1);
        const delta_o2 = -(t2 - o2) * o2 * (1 - o2);

        const dE_dw5 = delta_o1 * h1;
        const dE_dw6 = delta_o1 * h2;
        const dE_dw7 = delta_o2 * h1;
        const dE_dw8 = delta_o2 * h2;
        const dE_db3 = delta_o1;
        const dE_db4 = delta_o2;

        const dE_dh1 = delta_o1 * w.w5 + delta_o2 * w.w7;
        const delta_h1 = dE_dh1 * h1 * (1 - h1);

        const dE_dh2 = delta_o1 * w.w6 + delta_o2 * w.w8;
        const delta_h2 = dE_dh2 * h2 * (1 - h2);

        const dE_dw1 = delta_h1 * x1;
        const dE_dw2 = delta_h1 * x2;
        const dE_dw3 = delta_h2 * x1;
        const dE_dw4 = delta_h2 * x2;
        const dE_db1 = delta_h1;
        const dE_db2 = delta_h2;

        gradients = {
            w1: dE_dw1, w2: dE_dw2, w3: dE_dw3, w4: dE_dw4,
            w5: dE_dw5, w6: dE_dw6, w7: dE_dw7, w8: dE_dw8,
            b1: dE_db1, b2: dE_db2, b3: dE_db3, b4: dE_db4,
            delta_o1, delta_o2, delta_h1, delta_h2,
            dE_dh1, dE_dh2
        };
        return gradients;
    }

    // --- Update Weights ---
    function updateWeights() {
        const lr = val('lr');
        const w = readWeights();
        const keys = ['w1','w2','w3','w4','w5','w6','w7','w8','b1','b2','b3','b4'];
        const newW = {};
        keys.forEach(k => {
            newW[k] = w[k] - lr * gradients[k];
        });
        writeWeights(newW);
    }

    // --- Display Gradient Table ---
    function displayGradients() {
        const keys = ['w1','w2','w3','w4','w5','w6','w7','w8','b1','b2','b3','b4'];
        keys.forEach(k => {
            if (gradEls[k]) {
                const v = gradients[k];
                gradEls[k].textContent = fmt(v, 6);
                gradEls[k].style.color = v > 0 ? '#ef4444' : (v < 0 ? '#3b82f6' : '#64748b');
            }
        });
    }

    function clearGradients() {
        const keys = ['w1','w2','w3','w4','w5','w6','w7','w8','b1','b2','b3','b4'];
        keys.forEach(k => {
            if (gradEls[k]) {
                gradEls[k].textContent = '—';
                gradEls[k].style.color = '#64748b';
            }
        });
    }

    // ============================================================
    // SVG NETWORK DRAWING — Clean diagram, hover for details
    // ============================================================
    function drawNetwork(highlightPhase) {
        const svg = els.svg;
        svg.innerHTML = '';
        hideTooltip();

        // --- SVG Helpers ---
        function makeSVG(tag, attrs) {
            const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (const [k, v] of Object.entries(attrs)) {
                el.setAttribute(k, v);
            }
            return el;
        }

        function addEl(tag, attrs) {
            const el = makeSVG(tag, attrs);
            svg.appendChild(el);
            return el;
        }

        function addText(x, y, text, opts = {}) {
            const t = makeSVG('text', {
                x, y,
                'font-size': opts.size || '14',
                'font-family': opts.mono ? 'monospace' : 'system-ui, sans-serif',
                'text-anchor': opts.anchor || 'middle',
                'dominant-baseline': opts.baseline || 'central',
                fill: opts.color || '#1e293b',
                'font-weight': opts.bold ? 'bold' : 'normal',
                'opacity': opts.opacity || '1'
            });
            t.textContent = text;
            svg.appendChild(t);
            return t;
        }

        function addLine(x1, y1, x2, y2, color, width, dashed) {
            const attrs = { x1, y1, x2, y2, stroke: color, 'stroke-width': width || 1.5 };
            if (dashed) attrs['stroke-dasharray'] = '6,4';
            addEl('line', attrs);
        }

        function addCircle(cx, cy, r, fill, strokeColor, strokeWidth) {
            return addEl('circle', {
                cx, cy, r,
                fill: fill || '#fff',
                stroke: strokeColor || '#1e293b',
                'stroke-width': strokeWidth || 2
            });
        }

        function addRect(x, y, w, h, fill, stroke, rx) {
            return addEl('rect', {
                x, y, width: w, height: h,
                fill: fill || '#f1f5f9',
                rx: rx || 6,
                stroke: stroke || '#cbd5e1',
                'stroke-width': 1
            });
        }

        function addArrowHead(x, y, direction, color) {
            const size = 8;
            let points;
            if (direction === 'right') {
                points = `${x},${y - size / 2} ${x + size},${y} ${x},${y + size / 2}`;
            } else {
                points = `${x},${y - size / 2} ${x - size},${y} ${x},${y + size / 2}`;
            }
            addEl('polygon', { points, fill: color, stroke: 'none' });
        }

        // ============================================================
        // Create a hoverable node group
        // ============================================================
        function makeHoverableNode(cx, cy, r, fill, strokeColor, strokeWidth, tooltipHTML, borderColor) {
            const circle = addCircle(cx, cy, r, fill, strokeColor, strokeWidth);
            // Invisible larger hit area
            const hitArea = addCircle(cx, cy, r + 8, 'transparent', 'transparent', 0);
            hitArea.style.cursor = 'pointer';

            if (tooltipHTML) {
                hitArea.addEventListener('mouseenter', function () {
                    showTooltip(circle, tooltipHTML, borderColor || strokeColor);
                });
                hitArea.addEventListener('mouseleave', function () {
                    hideTooltip();
                });
            }
            return circle;
        }

        // ============================================================
        // LAYOUT
        // ============================================================
        const nodeR = 34;
        const colInput = 110;
        const colHidden = 370;
        const colOutput = 630;
        const colTarget = 810;
        const row1 = 180;
        const row2 = 400;

        const nodes = {
            x1: { x: colInput, y: row1, label: 'x₁' },
            x2: { x: colInput, y: row2, label: 'x₂' },
            h1: { x: colHidden, y: row1, label: 'h₁' },
            h2: { x: colHidden, y: row2, label: 'h₂' },
            o1: { x: colOutput, y: row1, label: 'o₁' },
            o2: { x: colOutput, y: row2, label: 'o₂' },
            t1: { x: colTarget, y: row1, label: 't₁' },
            t2: { x: colTarget, y: row2, label: 't₂' }
        };

        // ============================================================
        // BACKGROUND LAYER BANDS
        // ============================================================
        addEl('rect', { x: colInput - 60, y: 50, width: 120, height: 440, fill: '#eff6ff', rx: 12, opacity: 0.5 });
        addEl('rect', { x: colHidden - 70, y: 50, width: 140, height: 440, fill: '#f5f3ff', rx: 12, opacity: 0.5 });
        addEl('rect', { x: colOutput - 70, y: 50, width: 140, height: 440, fill: '#fff7ed', rx: 12, opacity: 0.5 });

        addText(colInput, 72, 'INPUT LAYER', { size: '13', bold: true, color: '#3b82f6' });
        addText(colHidden, 72, 'HIDDEN LAYER', { size: '13', bold: true, color: '#7c3aed' });
        addText(colOutput, 72, 'OUTPUT LAYER', { size: '13', bold: true, color: '#ea580c' });
        addText(colTarget, 72, 'TARGETS', { size: '13', bold: true, color: '#16a34a' });

        // ============================================================
        // CONNECTIONS
        // ============================================================
        const connections = [
            [nodes.x1, nodes.h1, 'w1'],
            [nodes.x2, nodes.h1, 'w2'],
            [nodes.x1, nodes.h2, 'w3'],
            [nodes.x2, nodes.h2, 'w4'],
            [nodes.h1, nodes.o1, 'w5'],
            [nodes.h2, nodes.o1, 'w6'],
            [nodes.h1, nodes.o2, 'w7'],
            [nodes.h2, nodes.o2, 'w8'],
        ];

        const getLineColor = (key) => {
            if (highlightPhase === 'backward' && gradients[key] !== undefined) {
                return Math.abs(gradients[key]) > 0.005 ? '#ef4444' : '#fca5a5';
            }
            if (highlightPhase === 'forward') return '#3b82f6';
            if (highlightPhase === 'updated') return '#10b981';
            return '#cbd5e1';
        };

        const getLineWidth = (key) => {
            if (highlightPhase === 'backward' && gradients[key] !== undefined) {
                return Math.min(6, 2 + Math.abs(gradients[key]) * 25);
            }
            if (highlightPhase === 'forward') return 2.5;
            return 1.5;
        };

        connections.forEach(([from, to, key]) => {
            const x1 = from.x + nodeR;
            const y1 = from.y;
            const x2 = to.x - nodeR;
            const y2 = to.y;
            addLine(x1, y1, x2, y2, getLineColor(key), getLineWidth(key));

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const w = readWeights();
            const dy = (y2 - y1);
            const labelOffY = dy > 50 ? -12 : (dy < -50 ? 12 : -12);

            addText(mx, my + labelOffY, `${key}=${fmtShort(w[key])}`, {
                size: '11', mono: true, color: '#64748b'
            });

            if (highlightPhase === 'backward' && gradients[key] !== undefined) {
                addText(mx, my + labelOffY + 14, `∂E/∂${key}=${fmtShort(gradients[key])}`, {
                    size: '10', mono: true, color: '#dc2626', bold: true
                });
            }
        });

        // ============================================================
        // INPUT NODES
        // ============================================================
        [['x1', net.x1], ['x2', net.x2]].forEach(([key, value]) => {
            const n = nodes[key];
            addCircle(n.x, n.y, nodeR, '#dbeafe', '#3b82f6', 2.5);
            addText(n.x, n.y - 9, n.label, { size: '16', bold: true, color: '#1e40af' });
            if (value !== undefined) {
                addText(n.x, n.y + 11, fmt(value, 2), { size: '13', mono: true, color: '#3b82f6' });
            }
        });

        // ============================================================
        // HIDDEN NODES — with hover tooltips
        // ============================================================
        const hiddenData = [
            { key: 'h1', z: net.z_h1, h: net.h1, delta: gradients.delta_h1, dE_dh: gradients.dE_dh1, wFrom: ['w1', 'w2'], wTo: ['w5', 'w7'], inputs: [net.x1, net.x2], biasKey: 'b1' },
            { key: 'h2', z: net.z_h2, h: net.h2, delta: gradients.delta_h2, dE_dh: gradients.dE_dh2, wFrom: ['w3', 'w4'], wTo: ['w6', 'w8'], inputs: [net.x1, net.x2], biasKey: 'b2' }
        ];

        hiddenData.forEach(({ key, z, h, delta, dE_dh, wFrom, wTo, inputs, biasKey }) => {
            const n = nodes[key];
            const fillColor = highlightPhase === 'backward' ? '#fef2f2' : (highlightPhase === 'forward' ? '#ede9fe' : '#f5f3ff');

            // Build tooltip HTML based on phase
            let tipHTML = '';
            let tipBorder = '#7c3aed';

            if (highlightPhase === 'forward' && z !== undefined) {
                const w = readWeights();
                const bVal = w[biasKey];
                tipBorder = '#3b82f6';
                tipHTML = `
                    <div style="color:#1e40af;">
                    <b style="font-size:13px;">Forward: ${n.label}</b><br>
                    $\\underbrace{z_{${key}}}_{\\text{pre-activation}} = ${wFrom[0]} \\cdot x_1 + ${wFrom[1]} \\cdot x_2 + ${biasKey}$<br>
                    $= ${fmtShort(w[wFrom[0]])} \\!\\times\\! ${fmt(inputs[0],2)} + ${fmtShort(w[wFrom[1]])} \\!\\times\\! ${fmt(inputs[1],2)} + ${fmtShort(bVal)} = ${fmtShort(z)}$<br>
                    $\\underbrace{${key}}_{\\text{output}} = \\sigma(${fmtShort(z)}) = ${fmtShort(h)}$
                    </div>`;
            } else if (highlightPhase === 'backward' && delta !== undefined) {
                const w = readWeights();
                tipBorder = '#ef4444';
                tipHTML = `
                    <div style="color:#991b1b;">
                    <b style="font-size:13px;">Backward: ${n.label}</b><br>
                    $\\underbrace{\\frac{\\partial E}{\\partial ${key}}}_{\\text{error at }${key}} = \\underbrace{\\delta_{o_1} \\!\\cdot\\! ${wTo[0]}}_{\\text{from } o_1} + \\underbrace{\\delta_{o_2} \\!\\cdot\\! ${wTo[1]}}_{\\text{from } o_2}$<br>
                    $= ${fmtShort(gradients.delta_o1)} \\!\\times\\! ${fmtShort(w[wTo[0]])} + ${fmtShort(gradients.delta_o2)} \\!\\times\\! ${fmtShort(w[wTo[1]])} = ${fmtShort(dE_dh)}$<br>
                    $\\underbrace{\\delta_{${key}}}_{\\text{local error signal}} = \\frac{\\partial E}{\\partial ${key}} \\cdot \\underbrace{${key}(1\\!-\\!${key})}_{\\sigma'\\text{ (sigmoid derivative)}}$<br>
                    $= ${fmtShort(dE_dh)} \\!\\times\\! ${fmtShort(h)} \\!\\times\\! ${fmtShort(1 - h)} = ${fmtShort(delta)}$
                    </div>`;
            }

            makeHoverableNode(n.x, n.y, nodeR, fillColor, '#7c3aed', 2.5, tipHTML, tipBorder);
            addText(n.x, n.y - 9, n.label, { size: '16', bold: true, color: '#5b21b6' });
            if (h !== undefined) {
                addText(n.x, n.y + 11, fmtShort(h), { size: '13', mono: true, color: '#7c3aed' });
            }
            addText(n.x + nodeR + 10, n.y - nodeR + 4, 'σ', { size: '14', color: '#a78bfa', bold: true });

            // Small hover hint
            if (highlightPhase === 'forward' || highlightPhase === 'backward') {
                addText(n.x, n.y + nodeR + 14, '🔍 hover for math', { size: '9', color: '#94a3b8' });
            }
        });

        // ============================================================
        // OUTPUT NODES — with hover tooltips
        // ============================================================
        const outputData = [
            { key: 'o1', z: net.z_o1, o: net.o1, t: net.t1, E: net.E1, delta: gradients.delta_o1, hInputs: [net.h1, net.h2], wKeys: ['w5', 'w6'], biasKey: 'b3', tKey: 't1' },
            { key: 'o2', z: net.z_o2, o: net.o2, t: net.t2, E: net.E2, delta: gradients.delta_o2, hInputs: [net.h1, net.h2], wKeys: ['w7', 'w8'], biasKey: 'b4', tKey: 't2' }
        ];

        outputData.forEach(({ key, z, o, t, E, delta, hInputs, wKeys, biasKey, tKey }) => {
            const n = nodes[key];
            const fillColor = highlightPhase === 'backward' ? '#fef2f2' : (highlightPhase === 'forward' ? '#fff7ed' : '#fff7ed');

            let tipHTML = '';
            let tipBorder = '#ea580c';

            if (highlightPhase === 'forward' && z !== undefined) {
                const w = readWeights();
                tipBorder = '#f59e0b';
                tipHTML = `
                    <div style="color:#92400e;">
                    <b style="font-size:13px;">Forward: ${n.label}</b><br>
                    $\\underbrace{z_{${key}}}_{\\text{pre-activation}} = ${wKeys[0]} \\!\\cdot\\! h_1 + ${wKeys[1]} \\!\\cdot\\! h_2 + ${biasKey}$<br>
                    $= ${fmtShort(w[wKeys[0]])} \\!\\times\\! ${fmtShort(hInputs[0])} + ${fmtShort(w[wKeys[1]])} \\!\\times\\! ${fmtShort(hInputs[1])} + ${fmtShort(w[biasKey])} = ${fmtShort(z)}$<br>
                    $\\underbrace{${key}}_{\\text{output}} = \\sigma(${fmtShort(z)}) = ${fmtShort(o)}$<br>
                    $\\underbrace{E_{${key}}}_{\\text{loss}} = \\tfrac{1}{2}(${tKey} - ${key})^2 = \\tfrac{1}{2}(${fmtShort(t)} - ${fmtShort(o)})^2 = ${fmtShort(E)}$
                    </div>`;
            } else if (highlightPhase === 'backward' && delta !== undefined) {
                tipBorder = '#ef4444';
                tipHTML = `
                    <div style="color:#991b1b;">
                    <b style="font-size:13px;">Backward: ${n.label}</b><br>
                    $\\underbrace{\\frac{\\partial E}{\\partial ${key}}}_{\\text{loss derivative}} = -(${tKey} - ${key}) = ${fmtShort(-(t - o))}$<br>
                    $\\underbrace{\\sigma'(z)}_{\\text{activation slope}} = ${key}(1\\!-\\!${key}) = ${fmtShort(o * (1 - o))}$<br>
                    $\\underbrace{\\delta_{${key}}}_{\\text{output error signal}} = ${fmtShort(-(t - o))} \\!\\times\\! ${fmtShort(o * (1 - o))} = ${fmtShort(delta)}$
                    </div>`;
            }

            makeHoverableNode(n.x, n.y, nodeR, fillColor, '#ea580c', 2.5, tipHTML, tipBorder);
            addText(n.x, n.y - 9, n.label, { size: '16', bold: true, color: '#c2410c' });
            if (o !== undefined) {
                addText(n.x, n.y + 11, fmtShort(o), { size: '13', mono: true, color: '#ea580c' });
            }
            addText(n.x + nodeR + 10, n.y - nodeR + 4, 'σ', { size: '14', color: '#fb923c', bold: true });

            // Small hover hint
            if (highlightPhase === 'forward' || highlightPhase === 'backward') {
                addText(n.x, n.y + nodeR + 14, '🔍 hover for math', { size: '9', color: '#94a3b8' });
            }
        });

        // ============================================================
        // TARGET NODES
        // ============================================================
        [['t1', net.t1], ['t2', net.t2]].forEach(([key, value]) => {
            const n = nodes[key];
            addCircle(n.x, n.y, 24, '#dcfce7', '#16a34a', 2);
            addText(n.x, n.y - 7, n.label, { size: '14', bold: true, color: '#166534' });
            if (value !== undefined) {
                addText(n.x, n.y + 9, fmt(value, 2), { size: '12', mono: true, color: '#16a34a' });
            }

            // Dashed line from output to target
            const oNode = key === 't1' ? nodes.o1 : nodes.o2;
            addLine(oNode.x + nodeR, oNode.y, n.x - 24, n.y, '#94a3b8', 1.5, true);
        });

        // ============================================================
        // LOSS BOX — also hoverable
        // ============================================================
        if (net.E_total !== undefined) {
            const lossX = colTarget;
            const lossY = (row1 + row2) / 2;
            const lossColor = highlightPhase === 'backward' ? '#fef2f2' : '#f0fdf4';
            const lossBorder = highlightPhase === 'backward' ? '#ef4444' : '#22c55e';
            const lossRect = addRect(lossX - 70, lossY - 35, 140, 70, lossColor, lossBorder, 8);
            addText(lossX, lossY - 14, 'E_total', { size: '13', bold: true, color: '#dc2626' });
            addText(lossX, lossY + 10, fmt(net.E_total, 6), { size: '14', bold: true, color: '#dc2626', mono: true });

            // Hoverable loss box
            const lossHit = addRect(lossX - 70, lossY - 35, 140, 70, 'transparent', 'transparent', 8);
            lossHit.style.cursor = 'pointer';
            const lossTipHTML = `
                <div style="color:#991b1b;">
                <b style="font-size:13px;">Total Error</b><br>
                $E_{\\text{total}} = \\underbrace{E_1}_{\\frac{1}{2}(t_1 - o_1)^2} + \\underbrace{E_2}_{\\frac{1}{2}(t_2 - o_2)^2}$<br>
                $= \\underbrace{${fmtShort(net.E1)}}_{E_1} + \\underbrace{${fmtShort(net.E2)}}_{E_2} = ${fmt(net.E_total, 6)}$
                </div>`;
            lossHit.addEventListener('mouseenter', function() {
                showTooltip(lossRect, lossTipHTML, '#dc2626');
            });
            lossHit.addEventListener('mouseleave', function() {
                hideTooltip();
            });
        }

        // ============================================================
        // FLOW DIRECTION INDICATOR
        // ============================================================
        const arrowY = 520;
        if (highlightPhase === 'forward') {
            addLine(colInput, arrowY, colOutput + 40, arrowY, '#3b82f6', 2.5);
            addArrowHead(colOutput + 40, arrowY, 'right', '#3b82f6');
            addText((colInput + colOutput) / 2, arrowY - 16, '→ DATA FLOWS FORWARD: inputs are multiplied, summed, and squeezed through σ →', {
                size: '11', bold: true, color: '#3b82f6'
            });
        }

        if (highlightPhase === 'backward') {
            addLine(colOutput + 40, arrowY, colInput, arrowY, '#ef4444', 2.5);
            addArrowHead(colInput, arrowY, 'left', '#ef4444');
            addText((colInput + colOutput) / 2, arrowY - 16, '← ERROR GRADIENT propagates backward: each node computes its local blame ←', {
                size: '11', bold: true, color: '#ef4444'
            });
        }

        if (highlightPhase === 'updated') {
            addText((colInput + colOutput) / 2, arrowY, '✓ Weights updated via gradient descent — run Forward Pass again to see the new loss', {
                size: '11', bold: true, color: '#10b981'
            });
        }
    }

    // ============================================================
    // MATH DISPLAY BUILDERS — with extensive \underbrace usage
    // ============================================================
    function buildForwardMath() {
        const { x1, x2, w, z_h1, h1, z_h2, h2, z_o1, o1, z_o2, o2, t1, t2, E1, E2, E_total } = net;
        return `
<div class="md" style="font-size:1.0rem; line-height:2.0;">
<b style="color:#3b82f6; font-size:1.1rem;">━━━ FORWARD PASS ━━━</b>

<b>Step 1: Hidden Neuron $h_1$</b>
$$\\underbrace{z_{h_1}}_{\\text{pre-activation}} = \\underbrace{w_1 \\cdot x_1}_{${fmt(w.w1,4)} \\times ${fmt(x1,4)}} + \\underbrace{w_2 \\cdot x_2}_{${fmt(w.w2,4)} \\times ${fmt(x2,4)}} + \\underbrace{b_1}_{${fmt(w.b1,4)}} = ${fmt(z_h1,6)}$$
$$\\underbrace{h_1}_{\\text{activated output}} = \\sigma(z_{h_1}) = \\frac{1}{1 + e^{-${fmt(z_h1,6)}}} = ${fmt(h1,6)}$$

<b>Step 2: Hidden Neuron $h_2$</b>
$$\\underbrace{z_{h_2}}_{\\text{pre-activation}} = \\underbrace{w_3 \\cdot x_1}_{${fmt(w.w3,4)} \\times ${fmt(x1,4)}} + \\underbrace{w_4 \\cdot x_2}_{${fmt(w.w4,4)} \\times ${fmt(x2,4)}} + \\underbrace{b_2}_{${fmt(w.b2,4)}} = ${fmt(z_h2,6)}$$
$$h_2 = \\sigma(z_{h_2}) = \\frac{1}{1 + e^{-${fmt(z_h2,6)}}} = ${fmt(h2,6)}$$

<b>Step 3: Output Neuron $o_1$</b>
$$\\underbrace{z_{o_1}}_{\\text{pre-activation}} = \\underbrace{w_5 \\cdot h_1}_{${fmt(w.w5,4)} \\times ${fmt(h1,6)}} + \\underbrace{w_6 \\cdot h_2}_{${fmt(w.w6,4)} \\times ${fmt(h2,6)}} + \\underbrace{b_3}_{${fmt(w.b3,4)}} = ${fmt(z_o1,6)}$$
$$o_1 = \\sigma(z_{o_1}) = ${fmt(o1,6)}$$

<b>Step 4: Output Neuron $o_2$</b>
$$\\underbrace{z_{o_2}}_{\\text{pre-activation}} = \\underbrace{w_7 \\cdot h_1}_{${fmt(w.w7,4)} \\times ${fmt(h1,6)}} + \\underbrace{w_8 \\cdot h_2}_{${fmt(w.w8,4)} \\times ${fmt(h2,6)}} + \\underbrace{b_4}_{${fmt(w.b4,4)}} = ${fmt(z_o2,6)}$$
$$o_2 = \\sigma(z_{o_2}) = ${fmt(o2,6)}$$

<b>Step 5: Total Error</b>
$$E_1 = \\tfrac{1}{2}\\underbrace{(t_1 - o_1)^2}_{(${fmt(t1,4)} - ${fmt(o1,6)})^2} = ${fmt(E1,6)}$$
$$E_2 = \\tfrac{1}{2}\\underbrace{(t_2 - o_2)^2}_{(${fmt(t2,4)} - ${fmt(o2,6)})^2} = ${fmt(E2,6)}$$
$$\\boxed{E_{\\text{total}} = E_1 + E_2 = ${fmt(E_total,6)}}$$
</div>`;
    }

    function buildBackwardMath() {
        const { x1, x2, t1, t2, w, h1, h2, o1, o2 } = net;
        const g = gradients;
        return `
<div class="md" style="font-size:1.0rem; line-height:2.0;">
<b style="color:#ef4444; font-size:1.1rem;">━━━ BACKWARD PASS (Chain Rule Applied) ━━━</b>

<b>Step 1: Output Layer Deltas</b>
$$\\delta_{o_1} = \\underbrace{-(t_1 - o_1)}_{\\text{loss derivative}} \\cdot \\underbrace{o_1(1 - o_1)}_{\\text{sigmoid derivative}} = -(${fmt(t1,4)} - ${fmt(o1,6)}) \\times ${fmt(o1,6)} \\times (1 - ${fmt(o1,6)}) = ${fmt(g.delta_o1,6)}$$
$$\\delta_{o_2} = \\underbrace{-(t_2 - o_2)}_{\\text{loss derivative}} \\cdot \\underbrace{o_2(1 - o_2)}_{\\text{sigmoid derivative}} = -(${fmt(t2,4)} - ${fmt(o2,6)}) \\times ${fmt(o2,6)} \\times (1 - ${fmt(o2,6)}) = ${fmt(g.delta_o2,6)}$$

<b>Step 2: Gradients for Output Weights</b>
Each gradient = $\\underbrace{\\delta}_{\\text{error signal}} \\times \\underbrace{\\text{input}}_{\\text{to this weight}}$:
$$\\frac{\\partial E}{\\partial w_5} = \\underbrace{\\delta_{o_1}}_{${fmt(g.delta_o1,4)}} \\cdot \\underbrace{h_1}_{${fmt(h1,4)}} = ${fmt(g.w5,6)}$$
$$\\frac{\\partial E}{\\partial w_6} = \\underbrace{\\delta_{o_1}}_{${fmt(g.delta_o1,4)}} \\cdot \\underbrace{h_2}_{${fmt(h2,4)}} = ${fmt(g.w6,6)}$$
$$\\frac{\\partial E}{\\partial w_7} = \\underbrace{\\delta_{o_2}}_{${fmt(g.delta_o2,4)}} \\cdot \\underbrace{h_1}_{${fmt(h1,4)}} = ${fmt(g.w7,6)}$$
$$\\frac{\\partial E}{\\partial w_8} = \\underbrace{\\delta_{o_2}}_{${fmt(g.delta_o2,4)}} \\cdot \\underbrace{h_2}_{${fmt(h2,4)}} = ${fmt(g.w8,6)}$$
$$\\frac{\\partial E}{\\partial b_3} = \\delta_{o_1} = ${fmt(g.b3,6)} \\qquad \\frac{\\partial E}{\\partial b_4} = \\delta_{o_2} = ${fmt(g.b4,6)}$$

<b>Step 3: Error Propagated to Hidden Layer</b>
Each hidden neuron receives error from <em>both</em> outputs:
$$\\frac{\\partial E}{\\partial h_1} = \\underbrace{\\delta_{o_1} \\cdot w_5}_{\\text{blame from } o_1} + \\underbrace{\\delta_{o_2} \\cdot w_7}_{\\text{blame from } o_2} = ${fmt(g.delta_o1,4)} \\times ${fmt(w.w5,4)} + ${fmt(g.delta_o2,4)} \\times ${fmt(w.w7,4)} = ${fmt(g.dE_dh1,6)}$$
$$\\frac{\\partial E}{\\partial h_2} = \\underbrace{\\delta_{o_1} \\cdot w_6}_{\\text{blame from } o_1} + \\underbrace{\\delta_{o_2} \\cdot w_8}_{\\text{blame from } o_2} = ${fmt(g.delta_o1,4)} \\times ${fmt(w.w6,4)} + ${fmt(g.delta_o2,4)} \\times ${fmt(w.w8,4)} = ${fmt(g.dE_dh2,6)}$$

<b>Step 4: Hidden Layer Deltas</b>
$$\\delta_{h_1} = \\underbrace{\\frac{\\partial E}{\\partial h_1}}_{${fmt(g.dE_dh1,4)}} \\cdot \\underbrace{h_1(1 - h_1)}_{\\text{sigmoid deriv} = ${fmtShort(h1*(1-h1))}} = ${fmt(g.delta_h1,6)}$$
$$\\delta_{h_2} = \\underbrace{\\frac{\\partial E}{\\partial h_2}}_{${fmt(g.dE_dh2,4)}} \\cdot \\underbrace{h_2(1 - h_2)}_{\\text{sigmoid deriv} = ${fmtShort(h2*(1-h2))}} = ${fmt(g.delta_h2,6)}$$

<b>Step 5: Gradients for Hidden Weights</b>
$$\\frac{\\partial E}{\\partial w_1} = \\underbrace{\\delta_{h_1}}_{${fmt(g.delta_h1,4)}} \\cdot \\underbrace{x_1}_{${fmt(x1,2)}} = ${fmt(g.w1,6)} \\qquad \\frac{\\partial E}{\\partial w_2} = \\underbrace{\\delta_{h_1}}_{${fmt(g.delta_h1,4)}} \\cdot \\underbrace{x_2}_{${fmt(x2,2)}} = ${fmt(g.w2,6)}$$
$$\\frac{\\partial E}{\\partial w_3} = \\underbrace{\\delta_{h_2}}_{${fmt(g.delta_h2,4)}} \\cdot \\underbrace{x_1}_{${fmt(x1,2)}} = ${fmt(g.w3,6)} \\qquad \\frac{\\partial E}{\\partial w_4} = \\underbrace{\\delta_{h_2}}_{${fmt(g.delta_h2,4)}} \\cdot \\underbrace{x_2}_{${fmt(x2,2)}} = ${fmt(g.w4,6)}$$
$$\\frac{\\partial E}{\\partial b_1} = \\delta_{h_1} = ${fmt(g.b1,6)} \\qquad \\frac{\\partial E}{\\partial b_2} = \\delta_{h_2} = ${fmt(g.b2,6)}$$
</div>`;
    }

    function buildUpdateMath() {
        const lr = val('lr');
        const w = readWeights();
        const keys = ['w1','w2','w3','w4','w5','w6','w7','w8','b1','b2','b3','b4'];
        let lines = keys.map(k => {
            const oldVal = net.w[k] !== undefined ? net.w[k] : 0;
            return `$$${k}^{+} = \\underbrace{${fmtShort(oldVal)}}_{\\text{old } ${k}} - \\underbrace{${fmt(lr,2)}}_{\\eta} \\times \\underbrace{${fmt(gradients[k],6)}}_{\\partial E / \\partial ${k}} = ${fmtShort(w[k])}$$`;
        });
        return `
<div class="md" style="font-size:1.0rem; line-height:2.0;">
<b style="color:#10b981; font-size:1.1rem;">━━━ WEIGHT UPDATE (Gradient Descent) ━━━</b>

The update rule: $w^{+} = \\underbrace{w}_{\\text{old weight}} - \\underbrace{\\eta}_{\\text{learning rate}} \\cdot \\underbrace{\\frac{\\partial E}{\\partial w}}_{\\text{gradient}} \\qquad (\\eta = ${fmt(lr,2)})$

${lines.join('\n')}
</div>`;
    }

    // ============================================================
    // LOSS CHART
    // ============================================================
    function drawLossChart() {
        if (!els.lossChart) return;
        if (lossHistory.length === 0) {
            els.lossChart.innerHTML = '<span style="color:#94a3b8; font-style:italic; padding:20px; display:block;">Loss chart will appear after the first forward pass.</span>';
            return;
        }

        const data = [{
            x: lossHistory.map((_, i) => i),
            y: lossHistory,
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#ef4444', width: 2 },
            marker: { size: lossHistory.length > 50 ? 2 : 4, color: '#ef4444' },
            name: 'E_total'
        }];

        const layout = {
            margin: { t: 10, b: 40, l: 50, r: 20 },
            xaxis: { title: 'Epoch', dtick: lossHistory.length > 50 ? 10 : (lossHistory.length > 20 ? 5 : 1) },
            yaxis: { title: 'Total Error', rangemode: 'tozero' },
            showlegend: false,
            height: 250
        };

        if (typeof Plotly !== 'undefined') {
            Plotly.newPlot(els.lossChart, data, layout, { responsive: true });
        }
    }

    // ============================================================
    // BUTTON HANDLERS
    // ============================================================
    els.btnForward.addEventListener('click', () => {
        forwardPass();
        lossHistory.push(net.E_total);
        epoch++;
        els.epochCount.textContent = epoch;
        drawNetwork('forward');
        els.mathDisplay.innerHTML = buildForwardMath();
        if (typeof render_temml === 'function') render_temml();
        drawLossChart();
        clearGradients();
        phase = 'forward-done';
        els.btnBackward.disabled = false;
        els.btnUpdate.disabled = true;
    });

    els.btnBackward.addEventListener('click', () => {
        backwardPass();
        drawNetwork('backward');
        displayGradients();
        els.mathDisplay.innerHTML = buildBackwardMath();
        if (typeof render_temml === 'function') render_temml();
        phase = 'backward-done';
        els.btnUpdate.disabled = false;
    });

    els.btnUpdate.addEventListener('click', () => {
        updateWeights();
        drawNetwork('updated');
        els.mathDisplay.innerHTML = buildUpdateMath();
        if (typeof render_temml === 'function') render_temml();
        phase = 'idle';
        els.btnBackward.disabled = true;
        els.btnUpdate.disabled = true;
    });

    els.btnAuto.addEventListener('click', () => {
        let count = 0;
        const interval = setInterval(() => {
            forwardPass();
            lossHistory.push(net.E_total);
            epoch++;
            backwardPass();
            updateWeights();
            count++;
            if (count >= 100) {
                clearInterval(interval);
                els.epochCount.textContent = epoch;
                forwardPass();
                drawNetwork('forward');
                displayGradients();
                els.mathDisplay.innerHTML = `
<div class="md" style="font-size:1.0rem;">
<b style="color:#8b5cf6; font-size:1.1rem;">━━━ AUTO-TRAIN COMPLETE (100 Epochs) ━━━</b>

After ${epoch} total epochs of gradient descent:
$$\\boxed{E_{\\text{total}} = ${fmt(net.E_total, 6)}}$$
$$o_1 = ${fmt(net.o1, 6)} \\quad (\\underbrace{\\text{target: } ${fmt(net.t1, 4)}}_{t_1})$$
$$o_2 = ${fmt(net.o2, 6)} \\quad (\\underbrace{\\text{target: } ${fmt(net.t2, 4)}}_{t_2})$$

The network has learned to map the inputs closer to the targets!
Click "Forward Pass" to see the current state, or "Auto-Train" again for another 100 epochs.
</div>`;
                if (typeof render_temml === 'function') render_temml();
                drawLossChart();
                phase = 'idle';
                els.btnBackward.disabled = true;
                els.btnUpdate.disabled = true;
            }
        }, 10);
    });

    els.btnReset.addEventListener('click', () => {
        els.w1.value = '0.15'; els.w2.value = '0.20';
        els.w3.value = '0.25'; els.w4.value = '0.30';
        els.w5.value = '0.40'; els.w6.value = '0.45';
        els.w7.value = '0.50'; els.w8.value = '0.55';
        els.b1.value = '0.35'; els.b2.value = '0.35';
        els.b3.value = '0.60'; els.b4.value = '0.60';
        els.x1.value = '0.05'; els.x2.value = '0.10';
        els.t1.value = '0.01'; els.t2.value = '0.99';
        els.lr.value = '0.5';

        net = {};
        gradients = {};
        lossHistory = [];
        epoch = 0;
        phase = 'idle';
        els.epochCount.textContent = '0';
        clearGradients();
        drawNetwork(null);
        hideTooltip();
        els.mathDisplay.innerHTML = '<span style="color:#94a3b8; font-style:italic;">Click "Forward Pass" to begin. Every computation will be shown here step by step.</span>';
        drawLossChart();
        els.btnBackward.disabled = true;
        els.btnUpdate.disabled = true;
    });

    // --- Initial Draw ---
    drawNetwork(null);
    drawLossChart();
}

// ============================================================
// MODULE LOADER
// ============================================================
async function loadBackpropModule() {
    if (typeof updateLoadingStatus === 'function') {
        updateLoadingStatus("Loading section about Backpropagation...");
    }
    initBackpropLab();
    return Promise.resolve();
}
