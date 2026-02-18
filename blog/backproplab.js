// ============================================================
// BACKPROPLAB.JS — Interactive Backpropagation Visualizer
// Full rewrite with larger diagram, per-neuron math annotations,
// and weights displayed below in a side-by-side layout.
// ============================================================

function initBackpropLab() {
    // --- State ---
    let net = {};
    let gradients = {};
    let lossHistory = [];
    let epoch = 0;
    let phase = 'idle'; // idle, forward-done, backward-done

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
    // SVG NETWORK DRAWING — Large, with per-neuron annotations
    // ============================================================
    function drawNetwork(highlightPhase) {
        const svg = els.svg;
        svg.innerHTML = '';

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
                'font-size': opts.size || '12',
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
            if (dashed) attrs['stroke-dasharray'] = '5,3';
            addEl('line', attrs);
        }

        function addCircle(cx, cy, r, fill, strokeColor, strokeWidth) {
            addEl('circle', {
                cx, cy, r,
                fill: fill || '#fff',
                stroke: strokeColor || '#1e293b',
                'stroke-width': strokeWidth || 2
            });
        }

        function addRect(x, y, w, h, fill, stroke, rx) {
            addEl('rect', {
                x, y, width: w, height: h,
                fill: fill || '#f1f5f9',
                rx: rx || 6,
                stroke: stroke || '#cbd5e1',
                'stroke-width': 1
            });
        }

        // Annotation box: a rounded rect with multiline text
        function addAnnotationBox(cx, cy, lines, bgColor, borderColor, textColor, maxWidth) {
            const lineHeight = 14;
            const padding = 8;
            const boxH = lines.length * lineHeight + padding * 2;
            const boxW = maxWidth || 170;
            const bx = cx - boxW / 2;
            const by = cy - boxH / 2;

            addEl('rect', {
                x: bx, y: by, width: boxW, height: boxH,
                fill: bgColor || '#fffbeb',
                rx: 5,
                stroke: borderColor || '#f59e0b',
                'stroke-width': 1,
                opacity: 0.95
            });

            lines.forEach((line, i) => {
                addText(cx, by + padding + i * lineHeight + lineHeight / 2, line, {
                    size: '9.5', mono: true, color: textColor || '#92400e'
                });
            });
        }

        // Arrow head
        function addArrowHead(x, y, direction, color) {
            const size = 6;
            let points;
            if (direction === 'right') {
                points = `${x},${y - size / 2} ${x + size},${y} ${x},${y + size / 2}`;
            } else {
                points = `${x},${y - size / 2} ${x - size},${y} ${x},${y + size / 2}`;
            }
            addEl('polygon', { points, fill: color, stroke: 'none' });
        }

        // ============================================================
        // LAYOUT — Generous spacing for annotations
        // ============================================================
        const nodeR = 26;
        // Column X positions
        const colInput = 90;
        const colHidden = 330;
        const colOutput = 570;
        const colTarget = 720;
        // Row Y positions
        const row1 = 160;
        const row2 = 380;
        // Annotation Y offsets
        const annoOffsetForward = 70;   // below node for forward
        const annoOffsetBackward = -75;  // above node for backward

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
        // BACKGROUND LAYER LABELS
        // ============================================================
        // Layer background bands
        addEl('rect', { x: colInput - 50, y: 50, width: 100, height: 440, fill: '#eff6ff', rx: 10, opacity: 0.5 });
        addEl('rect', { x: colHidden - 60, y: 50, width: 120, height: 440, fill: '#f5f3ff', rx: 10, opacity: 0.5 });
        addEl('rect', { x: colOutput - 60, y: 50, width: 120, height: 440, fill: '#fff7ed', rx: 10, opacity: 0.5 });

        addText(colInput, 70, 'INPUT LAYER', { size: '11', bold: true, color: '#3b82f6' });
        addText(colHidden, 70, 'HIDDEN LAYER', { size: '11', bold: true, color: '#7c3aed' });
        addText(colOutput, 70, 'OUTPUT LAYER', { size: '11', bold: true, color: '#ea580c' });
        addText(colTarget, 70, 'TARGETS', { size: '11', bold: true, color: '#16a34a' });

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
                return Math.min(5, 1.5 + Math.abs(gradients[key]) * 20);
            }
            if (highlightPhase === 'forward') return 2;
            return 1.5;
        };

        connections.forEach(([from, to, key]) => {
            const x1 = from.x + nodeR;
            const y1 = from.y;
            const x2 = to.x - nodeR;
            const y2 = to.y;
            addLine(x1, y1, x2, y2, getLineColor(key), getLineWidth(key));

            // Weight label on connection
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const w = readWeights();

            // Offset label to avoid overlap
            const dy = (y2 - y1);
            const labelOffY = dy > 50 ? -10 : (dy < -50 ? 10 : -10);

            addText(mx, my + labelOffY, `${key}=${fmtShort(w[key])}`, {
                size: '8.5', mono: true, color: '#64748b'
            });

            // Show gradient on connection during backward
            if (highlightPhase === 'backward' && gradients[key] !== undefined) {
                addText(mx, my + labelOffY + 12, `∂E/∂${key}=${fmtShort(gradients[key])}`, {
                    size: '7.5', mono: true, color: '#dc2626', bold: true
                });
            }
        });

        // ============================================================
        // NODES
        // ============================================================

        // --- Input Nodes ---
        [['x1', net.x1], ['x2', net.x2]].forEach(([key, value]) => {
            const n = nodes[key];
            addCircle(n.x, n.y, nodeR, '#dbeafe', '#3b82f6', 2.5);
            addText(n.x, n.y - 7, n.label, { size: '13', bold: true, color: '#1e40af' });
            if (value !== undefined) {
                addText(n.x, n.y + 9, fmt(value, 2), { size: '10', mono: true, color: '#3b82f6' });
            }
        });

        // --- Hidden Nodes ---
        const hiddenData = [
            { key: 'h1', z: net.z_h1, h: net.h1, delta: gradients.delta_h1, dE_dh: gradients.dE_dh1, wFrom: ['w1', 'w2'], wTo: ['w5', 'w7'], inputs: [net.x1, net.x2], biasKey: 'b1' },
            { key: 'h2', z: net.z_h2, h: net.h2, delta: gradients.delta_h2, dE_dh: gradients.dE_dh2, wFrom: ['w3', 'w4'], wTo: ['w6', 'w8'], inputs: [net.x1, net.x2], biasKey: 'b2' }
        ];

        hiddenData.forEach(({ key, z, h, delta, dE_dh, wFrom, wTo, inputs, biasKey }) => {
            const n = nodes[key];
            const fillColor = highlightPhase === 'backward' ? '#fef2f2' : (highlightPhase === 'forward' ? '#ede9fe' : '#f5f3ff');
            addCircle(n.x, n.y, nodeR, fillColor, '#7c3aed', 2.5);
            addText(n.x, n.y - 7, n.label, { size: '13', bold: true, color: '#5b21b6' });
            if (h !== undefined) {
                addText(n.x, n.y + 9, fmtShort(h), { size: '10', mono: true, color: '#7c3aed' });
            }
            // σ label
            addText(n.x + nodeR + 8, n.y - nodeR + 2, 'σ', { size: '11', color: '#a78bfa', bold: true });

            // --- FORWARD ANNOTATION ---
            if (highlightPhase === 'forward' && z !== undefined) {
                const w = readWeights();
                const bVal = w[biasKey];
                const lines = [
                    `z = ${wFrom[0]}·x₁ + ${wFrom[1]}·x₂ + ${biasKey}`,
                    `  = ${fmtShort(w[wFrom[0]])}·${fmt(inputs[0],2)} + ${fmtShort(w[wFrom[1]])}·${fmt(inputs[1],2)} + ${fmtShort(bVal)}`,
                    `  = ${fmtShort(z)}`,
                    `${key} = σ(${fmtShort(z)}) = ${fmtShort(h)}`
                ];
                addAnnotationBox(n.x, n.y + annoOffsetForward, lines, '#eff6ff', '#3b82f6', '#1e40af', 200);
            }

            // --- BACKWARD ANNOTATION ---
            if (highlightPhase === 'backward' && delta !== undefined) {
                const w = readWeights();
                const lines = [
                    `∂E/∂${key} = δ_o1·${wTo[0]} + δ_o2·${wTo[1]}`,
                    `  = ${fmtShort(gradients.delta_o1)}·${fmtShort(w[wTo[0]])} + ${fmtShort(gradients.delta_o2)}·${fmtShort(w[wTo[1]])}`,
                    `  = ${fmtShort(dE_dh)}`,
                    `δ_${key} = ${fmtShort(dE_dh)} × ${key}(1-${key})`,
                    `  = ${fmtShort(dE_dh)} × ${fmtShort(h)}×${fmtShort(1 - h)}`,
                    `  = ${fmtShort(delta)}`
                ];
                addAnnotationBox(n.x, n.y + annoOffsetBackward - 10, lines, '#fef2f2', '#ef4444', '#991b1b', 220);
            }
        });

        // --- Output Nodes ---
        const outputData = [
            { key: 'o1', z: net.z_o1, o: net.o1, t: net.t1, E: net.E1, delta: gradients.delta_o1, hInputs: [net.h1, net.h2], wKeys: ['w5', 'w6'], biasKey: 'b3', tKey: 't1' },
            { key: 'o2', z: net.z_o2, o: net.o2, t: net.t2, E: net.E2, delta: gradients.delta_o2, hInputs: [net.h1, net.h2], wKeys: ['w7', 'w8'], biasKey: 'b4', tKey: 't2' }
        ];

        outputData.forEach(({ key, z, o, t, E, delta, hInputs, wKeys, biasKey, tKey }) => {
            const n = nodes[key];
            const fillColor = highlightPhase === 'backward' ? '#fef2f2' : (highlightPhase === 'forward' ? '#fff7ed' : '#fff7ed');
            addCircle(n.x, n.y, nodeR, fillColor, '#ea580c', 2.5);
            addText(n.x, n.y - 7, n.label, { size: '13', bold: true, color: '#c2410c' });
            if (o !== undefined) {
                addText(n.x, n.y + 9, fmtShort(o), { size: '10', mono: true, color: '#ea580c' });
            }
            addText(n.x + nodeR + 8, n.y - nodeR + 2, 'σ', { size: '11', color: '#fb923c', bold: true });

            // --- FORWARD ANNOTATION ---
            if (highlightPhase === 'forward' && z !== undefined) {
                const w = readWeights();
                const lines = [
                    `z = ${wKeys[0]}·h₁ + ${wKeys[1]}·h₂ + ${biasKey}`,
                    `  = ${fmtShort(w[wKeys[0]])}·${fmtShort(hInputs[0])} + ${fmtShort(w[wKeys[1]])}·${fmtShort(hInputs[1])} + ${fmtShort(w[biasKey])}`,
                    `  = ${fmtShort(z)}`,
                    `${key} = σ(${fmtShort(z)}) = ${fmtShort(o)}`,
                    `E_${key} = ½(${tKey} - ${key})²`,
                    `  = ½(${fmtShort(t)} - ${fmtShort(o)})² = ${fmtShort(E)}`
                ];
                addAnnotationBox(n.x, n.y + annoOffsetForward + 10, lines, '#fffbeb', '#f59e0b', '#92400e', 220);
            }

            // --- BACKWARD ANNOTATION ---
            if (highlightPhase === 'backward' && delta !== undefined) {
                const lines = [
                    `∂E/∂${key} = -(${tKey} - ${key})`,
                    `  = -(${fmtShort(t)} - ${fmtShort(o)}) = ${fmtShort(-(t - o))}`,
                    `σ'(z) = ${key}(1-${key})`,
                    `  = ${fmtShort(o)}×${fmtShort(1 - o)} = ${fmtShort(o * (1 - o))}`,
                    `δ_${key} = ${fmtShort(-(t - o))} × ${fmtShort(o * (1 - o))}`,
                    `  = ${fmtShort(delta)}`
                ];
                addAnnotationBox(n.x, n.y + annoOffsetBackward - 10, lines, '#fef2f2', '#ef4444', '#991b1b', 220);
            }
        });

        // --- Target Nodes ---
        [['t1', net.t1], ['t2', net.t2]].forEach(([key, value]) => {
            const n = nodes[key];
            addCircle(n.x, n.y, 20, '#dcfce7', '#16a34a', 2);
            addText(n.x, n.y - 6, n.label, { size: '11', bold: true, color: '#166534' });
            if (value !== undefined) {
                addText(n.x, n.y + 8, fmt(value, 2), { size: '10', mono: true, color: '#16a34a' });
            }

            // Dashed line from output to target
            const oNode = key === 't1' ? nodes.o1 : nodes.o2;
            addLine(oNode.x + nodeR, oNode.y, n.x - 20, n.y, '#94a3b8', 1, true);
        });

        // ============================================================
        // LOSS BOX
        // ============================================================
        if (net.E_total !== undefined) {
            const lossX = colTarget;
            const lossY = (row1 + row2) / 2;
            const lossColor = highlightPhase === 'backward' ? '#fef2f2' : '#f0fdf4';
            const lossBorder = highlightPhase === 'backward' ? '#ef4444' : '#22c55e';
            addRect(lossX - 65, lossY - 30, 130, 60, lossColor, lossBorder, 8);
            addText(lossX, lossY - 12, 'E_total', { size: '11', bold: true, color: '#dc2626' });
            addText(lossX, lossY + 8, fmt(net.E_total, 6), { size: '12', bold: true, color: '#dc2626', mono: true });
        }

        // ============================================================
        // FLOW DIRECTION INDICATOR
        // ============================================================
        const arrowY = 510;
        if (highlightPhase === 'forward') {
            addLine(colInput, arrowY, colOutput + 40, arrowY, '#3b82f6', 2.5);
            addArrowHead(colOutput + 40, arrowY, 'right', '#3b82f6');
            addText((colInput + colOutput) / 2, arrowY - 14, '→ DATA FLOWS FORWARD: inputs are multiplied, summed, and squeezed through σ →', {
		                    size: '9', bold: true, color: '#3b82f6'
            });
        }

        if (highlightPhase === 'backward') {
            addLine(colOutput + 40, arrowY, colInput, arrowY, '#ef4444', 2.5);
            addArrowHead(colInput, arrowY, 'left', '#ef4444');
            addText((colInput + colOutput) / 2, arrowY - 14, '← ERROR GRADIENT propagates backward: each node computes its local blame ←', {
                size: '9', bold: true, color: '#ef4444'
            });
        }

        if (highlightPhase === 'updated') {
            addText((colInput + colOutput) / 2, arrowY, '✓ Weights updated via gradient descent — run Forward Pass again to see the new loss', {
                size: '9', bold: true, color: '#10b981'
            });
        }
    }

    // ============================================================
    // MATH DISPLAY BUILDERS
    // ============================================================
    function buildForwardMath() {
        const { x1, x2, w, z_h1, h1, z_h2, h2, z_o1, o1, z_o2, o2, t1, t2, E1, E2, E_total } = net;
        return `
<div class="md" style="font-size:0.82rem; line-height:1.8;">
<b style="color:#3b82f6;">━━━ FORWARD PASS ━━━</b>

<b>Step 1: Hidden Neuron h₁</b>
$$z_{h_1} = w_1 \\cdot x_1 + w_2 \\cdot x_2 + b_1 = ${fmt(w.w1,4)} \\times ${fmt(x1,4)} + ${fmt(w.w2,4)} \\times ${fmt(x2,4)} + ${fmt(w.b1,4)} = ${fmt(z_h1,6)}$$
$$h_1 = \\sigma(z_{h_1}) = \\frac{1}{1 + e^{-${fmt(z_h1,6)}}} = ${fmt(h1,6)}$$

<b>Step 2: Hidden Neuron h₂</b>
$$z_{h_2} = w_3 \\cdot x_1 + w_4 \\cdot x_2 + b_2 = ${fmt(w.w3,4)} \\times ${fmt(x1,4)} + ${fmt(w.w4,4)} \\times ${fmt(x2,4)} + ${fmt(w.b2,4)} = ${fmt(z_h2,6)}$$
$$h_2 = \\sigma(z_{h_2}) = \\frac{1}{1 + e^{-${fmt(z_h2,6)}}} = ${fmt(h2,6)}$$

<b>Step 3: Output Neuron o₁</b>
$$z_{o_1} = w_5 \\cdot h_1 + w_6 \\cdot h_2 + b_3 = ${fmt(w.w5,4)} \\times ${fmt(h1,6)} + ${fmt(w.w6,4)} \\times ${fmt(h2,6)} + ${fmt(w.b3,4)} = ${fmt(z_o1,6)}$$
$$o_1 = \\sigma(z_{o_1}) = ${fmt(o1,6)}$$

<b>Step 4: Output Neuron o₂</b>
$$z_{o_2} = w_7 \\cdot h_1 + w_8 \\cdot h_2 + b_4 = ${fmt(w.w7,4)} \\times ${fmt(h1,6)} + ${fmt(w.w8,4)} \\times ${fmt(h2,6)} + ${fmt(w.b4,4)} = ${fmt(z_o2,6)}$$
$$o_2 = \\sigma(z_{o_2}) = ${fmt(o2,6)}$$

<b>Step 5: Total Error</b>
$$E_1 = \\tfrac{1}{2}(t_1 - o_1)^2 = \\tfrac{1}{2}(${fmt(t1,4)} - ${fmt(o1,6)})^2 = ${fmt(E1,6)}$$
$$E_2 = \\tfrac{1}{2}(t_2 - o_2)^2 = \\tfrac{1}{2}(${fmt(t2,4)} - ${fmt(o2,6)})^2 = ${fmt(E2,6)}$$
$$\\boxed{E_{\\text{total}} = E_1 + E_2 = ${fmt(E_total,6)}}$$
</div>`;
    }

    function buildBackwardMath() {
        const { x1, x2, t1, t2, w, h1, h2, o1, o2 } = net;
        const g = gradients;
        return `
<div class="md" style="font-size:0.82rem; line-height:1.8;">
<b style="color:#ef4444;">━━━ BACKWARD PASS (Chain Rule Applied) ━━━</b>

<b>Step 1: Output Layer Deltas</b>
The error signal at each output neuron combines the loss derivative and the activation derivative:
$$\\delta_{o_1} = -(t_1 - o_1) \\cdot o_1(1 - o_1) = -(${fmt(t1,4)} - ${fmt(o1,6)}) \\times ${fmt(o1,6)} \\times (1 - ${fmt(o1,6)}) = ${fmt(g.delta_o1,6)}$$
$$\\delta_{o_2} = -(t_2 - o_2) \\cdot o_2(1 - o_2) = -(${fmt(t2,4)} - ${fmt(o2,6)}) \\times ${fmt(o2,6)} \\times (1 - ${fmt(o2,6)}) = ${fmt(g.delta_o2,6)}$$

<b>Step 2: Gradients for Output Weights</b>
Each gradient = delta × input to that weight:
$$\\frac{\\partial E}{\\partial w_5} = \\delta_{o_1} \\cdot h_1 = ${fmt(g.delta_o1,6)} \\times ${fmt(h1,6)} = ${fmt(g.w5,6)}$$
$$\\frac{\\partial E}{\\partial w_6} = \\delta_{o_1} \\cdot h_2 = ${fmt(g.delta_o1,6)} \\times ${fmt(h2,6)} = ${fmt(g.w6,6)}$$
$$\\frac{\\partial E}{\\partial w_7} = \\delta_{o_2} \\cdot h_1 = ${fmt(g.delta_o2,6)} \\times ${fmt(h1,6)} = ${fmt(g.w7,6)}$$
$$\\frac{\\partial E}{\\partial w_8} = \\delta_{o_2} \\cdot h_2 = ${fmt(g.delta_o2,6)} \\times ${fmt(h2,6)} = ${fmt(g.w8,6)}$$
$$\\frac{\\partial E}{\\partial b_3} = \\delta_{o_1} = ${fmt(g.b3,6)} \\qquad \\frac{\\partial E}{\\partial b_4} = \\delta_{o_2} = ${fmt(g.b4,6)}$$

<b>Step 3: Error Propagated to Hidden Layer</b>
Each hidden neuron receives error from <em>both</em> outputs, weighted by the connections:
$$\\frac{\\partial E}{\\partial h_1} = \\delta_{o_1} \\cdot w_5 + \\delta_{o_2} \\cdot w_7 = ${fmt(g.delta_o1,6)} \\times ${fmt(w.w5,4)} + ${fmt(g.delta_o2,6)} \\times ${fmt(w.w7,4)} = ${fmt(g.dE_dh1,6)}$$
$$\\frac{\\partial E}{\\partial h_2} = \\delta_{o_1} \\cdot w_6 + \\delta_{o_2} \\cdot w_8 = ${fmt(g.delta_o1,6)} \\times ${fmt(w.w6,4)} + ${fmt(g.delta_o2,6)} \\times ${fmt(w.w8,4)} = ${fmt(g.dE_dh2,6)}$$

<b>Step 4: Hidden Layer Deltas</b>
$$\\delta_{h_1} = \\frac{\\partial E}{\\partial h_1} \\cdot h_1(1 - h_1) = ${fmt(g.dE_dh1,6)} \\times ${fmt(h1,6)} \\times ${fmt(1 - h1,6)} = ${fmt(g.delta_h1,6)}$$
$$\\delta_{h_2} = \\frac{\\partial E}{\\partial h_2} \\cdot h_2(1 - h_2) = ${fmt(g.dE_dh2,6)} \\times ${fmt(h2,6)} \\times ${fmt(1 - h2,6)} = ${fmt(g.delta_h2,6)}$$

<b>Step 5: Gradients for Hidden Weights</b>
$$\\frac{\\partial E}{\\partial w_1} = \\delta_{h_1} \\cdot x_1 = ${fmt(g.delta_h1,6)} \\times ${fmt(x1,4)} = ${fmt(g.w1,6)}$$
$$\\frac{\\partial E}{\\partial w_2} = \\delta_{h_1} \\cdot x_2 = ${fmt(g.delta_h1,6)} \\times ${fmt(x2,4)} = ${fmt(g.w2,6)}$$
$$\\frac{\\partial E}{\\partial w_3} = \\delta_{h_2} \\cdot x_1 = ${fmt(g.delta_h2,6)} \\times ${fmt(x1,4)} = ${fmt(g.w3,6)}$$
$$\\frac{\\partial E}{\\partial w_4} = \\delta_{h_2} \\cdot x_2 = ${fmt(g.delta_h2,6)} \\times ${fmt(x2,4)} = ${fmt(g.w4,6)}$$
$$\\frac{\\partial E}{\\partial b_1} = \\delta_{h_1} = ${fmt(g.b1,6)} \\qquad \\frac{\\partial E}{\\partial b_2} = \\delta_{h_2} = ${fmt(g.b2,6)}$$
</div>`;
    }

    function buildUpdateMath() {
        const lr = val('lr');
        const w = readWeights();
        const keys = ['w1','w2','w3','w4','w5','w6','w7','w8','b1','b2','b3','b4'];
        let lines = keys.map(k => {
            const oldVal = net.w[k] !== undefined ? net.w[k] : 0;
            return `$$${k}^{+} = ${fmtShort(oldVal)} - ${fmt(lr,2)} \\times ${fmt(gradients[k],6)} = ${fmtShort(w[k])}$$`;
        });
        return `
<div class="md" style="font-size:0.82rem; line-height:1.8;">
<b style="color:#10b981;">━━━ WEIGHT UPDATE (Gradient Descent) ━━━</b>

$$w^{+} = w - \\eta \\cdot \\frac{\\partial E}{\\partial w} \\qquad (\\eta = ${fmt(lr,2)})$$

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
                // Final forward to show result
                forwardPass();
                drawNetwork('forward');
                displayGradients();
                els.mathDisplay.innerHTML = `
<div class="md" style="font-size:0.85rem;">
<b style="color:#8b5cf6;">━━━ AUTO-TRAIN COMPLETE (100 Epochs) ━━━</b>

After ${epoch} total epochs of gradient descent:
$$E_{\\text{total}} = ${fmt(net.E_total, 6)}$$
$$o_1 = ${fmt(net.o1, 6)} \\quad (\\text{target: } ${fmt(net.t1, 4)})$$
$$o_2 = ${fmt(net.o2, 6)} \\quad (\\text{target: } ${fmt(net.t2, 4)})$$

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
