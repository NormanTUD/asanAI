// ============================================================
// BACKPROPLAB.JS — Interactive Backpropagation Visualizer
// Step-by-step forward pass, backward pass, and weight update
// with full math display and animated network diagram.
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

    function readWeights() {
        return {
            w1: val('w1'), w2: val('w2'), w3: val('w3'), w4: val('w4'),
            w5: val('w5'), w6: val('w6'), w7: val('w7'), w8: val('w8'),
            b1: val('b1'), b2: val('b2'), b3: val('b3'), b4: val('b4')
        };
    }

    function writeWeights(w) {
        els.w1.value = fmt(w.w1, 4);
        els.w2.value = fmt(w.w2, 4);
        els.w3.value = fmt(w.w3, 4);
        els.w4.value = fmt(w.w4, 4);
        els.w5.value = fmt(w.w5, 4);
        els.w6.value = fmt(w.w6, 4);
        els.w7.value = fmt(w.w7, 4);
        els.w8.value = fmt(w.w8, 4);
        els.b1.value = fmt(w.b1, 4);
        els.b2.value = fmt(w.b2, 4);
        els.b3.value = fmt(w.b3, 4);
        els.b4.value = fmt(w.b4, 4);
    }

    // --- Forward Pass ---
    function forwardPass() {
        const x1 = val('x1'), x2 = val('x2');
        const t1 = val('t1'), t2 = val('t2');
        const w = readWeights();

        // Hidden layer
        const z_h1 = w.w1 * x1 + w.w2 * x2 + w.b1;
        const h1 = sigmoid(z_h1);
        const z_h2 = w.w3 * x1 + w.w4 * x2 + w.b2;
        const h2 = sigmoid(z_h2);

        // Output layer
        const z_o1 = w.w5 * h1 + w.w6 * h2 + w.b3;
        const o1 = sigmoid(z_o1);
        const z_o2 = w.w7 * h1 + w.w8 * h2 + w.b4;
        const o2 = sigmoid(z_o2);

        // Loss
        const E1 = 0.5 * Math.pow(t1 - o1, 2);
        const E2 = 0.5 * Math.pow(t2 - o2, 2);
        const E_total = E1 + E2;

        net = { x1, x2, t1, t2, w, z_h1, h1, z_h2, h2, z_o1, o1, z_o2, o2, E1, E2, E_total };
        return net;
    }

    // --- Backward Pass ---
    function backwardPass() {
        const { x1, x2, t1, t2, w, h1, h2, o1, o2 } = net;

        // Output layer deltas
        // dE/do1 = -(t1 - o1), dE/do2 = -(t2 - o2)
        // do/dz = o*(1-o)
        const delta_o1 = -(t1 - o1) * o1 * (1 - o1);
        const delta_o2 = -(t2 - o2) * o2 * (1 - o2);

        // Gradients for output weights
        const dE_dw5 = delta_o1 * h1;
        const dE_dw6 = delta_o1 * h2;
        const dE_dw7 = delta_o2 * h1;
        const dE_dw8 = delta_o2 * h2;
        const dE_db3 = delta_o1;
        const dE_db4 = delta_o2;

        // Hidden layer deltas (error flows back through both outputs)
        const dE_dh1 = delta_o1 * w.w5 + delta_o2 * w.w7;
        const delta_h1 = dE_dh1 * h1 * (1 - h1);

        const dE_dh2 = delta_o1 * w.w6 + delta_o2 * w.w8;
        const delta_h2 = dE_dh2 * h2 * (1 - h2);

        // Gradients for hidden weights
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

    // --- SVG Network Drawing ---
    function drawNetwork(highlightPhase) {
        const svg = els.svg;
        svg.innerHTML = '';

        // Node positions
        const layers = {
            input:  [{x:80,  y:120, label:'x₁'}, {x:80,  y:260, label:'x₂'}],
            hidden: [{x:300, y:100, label:'h₁'}, {x:300, y:280, label:'h₂'}],
            output: [{x:520, y:100, label:'o₁'}, {x:520, y:280, label:'o₂'}],
            target: [{x:640, y:100, label:'t₁'}, {x:640, y:280, label:'t₂'}],
            bias1:  [{x:300, y:20,  label:'b₁'}, {x:300, y:360, label:'b₂'}],
            bias2:  [{x:520, y:20,  label:'b₃'}, {x:520, y:360, label:'b₄'}]
        };

        // Connection definitions: [from, to, weight_key, gradient_key]
        const connections = [
            [layers.input[0], layers.hidden[0], 'w1'],
            [layers.input[1], layers.hidden[0], 'w2'],
            [layers.input[0], layers.hidden[1], 'w3'],
            [layers.input[1], layers.hidden[1], 'w4'],
            [layers.hidden[0], layers.output[0], 'w5'],
            [layers.hidden[1], layers.output[0], 'w6'],
            [layers.hidden[0], layers.output[1], 'w7'],
            [layers.hidden[1], layers.output[1], 'w8'],
        ];

        const biasConnections = [
            [layers.bias1[0], layers.hidden[0], 'b1'],
            [layers.bias1[1], layers.hidden[1], 'b2'],
            [layers.bias2[0], layers.output[0], 'b3'],
            [layers.bias2[1], layers.output[1], 'b4'],
        ];

        function makeSVG(tag, attrs) {
            const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (const [k, v] of Object.entries(attrs)) {
                el.setAttribute(k, v);
            }
            return el;
        }

        function addText(x, y, text, opts = {}) {
            const t = makeSVG('text', {
                x, y,
                'font-size': opts.size || '11',
                'font-family': 'monospace',
                'text-anchor': opts.anchor || 'middle',
                'dominant-baseline': 'central',
                fill: opts.color || '#1e293b',
                'font-weight': opts.bold ? 'bold' : 'normal'
            });
            t.textContent = text;
            svg.appendChild(t);
        }

        function addLine(x1, y1, x2, y2, color, width, dashed) {
            const attrs = { x1, y1, x2, y2, stroke: color, 'stroke-width': width || 1.5 };
            if (dashed) attrs['stroke-dasharray'] = '5,3';
            svg.appendChild(makeSVG('line', attrs));
        }

        function addCircle(cx, cy, r, fill, strokeColor) {
            svg.appendChild(makeSVG('circle', {
                cx, cy, r,
                fill: fill || '#fff',
                stroke: strokeColor || '#1e293b',
                'stroke-width': 2
            }));
        }

        function addRect(x, y, w, h, fill) {
            svg.appendChild(makeSVG('rect', {
                x, y, width: w, height: h,
                fill: fill || '#f1f5f9',
                rx: 4,
                stroke: '#cbd5e1',
                'stroke-width': 1
            }));
        }

        // Draw animated pulse along a line
        function addPulse(x1, y1, x2, y2, color, delay) {
            const circle = makeSVG('circle', {
                cx: x1, cy: y1, r: 4,
                fill: color, opacity: 0.9
            });
            svg.appendChild(circle);

            const anim = makeSVG('animateMotion', {
                dur: '0.8s',
                begin: delay + 's',
                fill: 'freeze',
                repeatCount: '1'
            });
            const path = makeSVG('path', {
                d: `M${x1},${y1} L${x2},${y2}`
            });
            // animateMotion uses a path child
            anim.innerHTML = `<mpath href=""/>`;
            // Simpler: use values
            circle.innerHTML = `<animateMotion dur="0.8s" begin="${delay}s" fill="freeze" path="M0,0 L${x2 - x1},${y2 - y1}" />`;

            return circle;
        }

        // --- Layer labels ---
        addText(80, 30, 'INPUT', { size: '12', bold: true, color: '#64748b' });
        addText(300, 30, 'HIDDEN', { size: '12', bold: true, color: '#64748b' });
        addText(520, 30, 'OUTPUT', { size: '12', bold: true, color: '#64748b' });
        addText(640, 30, 'TARGET', { size: '12', bold: true, color: '#64748b' });

        // --- Draw connections ---
        const getColor = (key) => {
            if (highlightPhase === 'backward' && gradients[key] !== undefined) {
                return Math.abs(gradients[key]) > 0.01 ? '#ef4444' : '#fca5a5';
            }
            if (highlightPhase === 'forward') return '#3b82f6';
            if (highlightPhase === 'updated') return '#10b981';
            return '#94a3b8';
        };

        const getWidth = (key) => {
            if (highlightPhase === 'backward' && gradients[key] !== undefined) {
                return Math.min(4, 1 + Math.abs(gradients[key]) * 15);
            }
            return 1.5;
        };

        // Weight connections
        connections.forEach(([from, to, key]) => {
            addLine(from.x + 20, from.y, to.x - 20, to.y, getColor(key), getWidth(key));
            // Weight label
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2 - 8;
            const w = readWeights();
            addText(mx, my, `${key}=${fmt(w[key], 2)}`, { size: '8', color: '#64748b' });
            if (highlightPhase === 'backward' && gradients[key] !== undefined) {
                addText(mx, my + 14, `∂E=${fmt(gradients[key], 4)}`, { size: '7', color: '#ef4444' });
            }
        });

        // Bias connections (dashed)
        biasConnections.forEach(([from, to, key]) => {
            addLine(from.x, from.y, to.x, to.y - 20, getColor(key), 1, true);
        });

        // --- Draw nodes ---
        // Input nodes
        layers.input.forEach((n, i) => {
            addCircle(n.x, n.y, 20, '#dbeafe', '#3b82f6');
            addText(n.x, n.y - 6, n.label, { size: '10', bold: true });
            const v = i === 0 ? net.x1 : net.x2;
            if (v !== undefined) addText(n.x, n.y + 8, fmt(v, 2), { size: '8', color: '#3b82f6' });
        });

        // Hidden nodes
        layers.hidden.forEach((n, i) => {
            const fill = highlightPhase === 'backward' ? '#fef2f2' : (highlightPhase ? '#dbeafe' : '#f1f5f9');
            addCircle(n.x, n.y, 22, fill, '#6366f1');
            addText(n.x, n.y - 8, n.label, { size: '10', bold: true });
            const h = i === 0 ? net.h1 : net.h2;
            if (h !== undefined) addText(n.x, n.y + 6, fmt(h, 4), { size: '7', color: '#6366f1' });
            // Show z value
            const z = i === 0 ? net.z_h1 : net.z_h2;
            if (z !== undefined) addText(n.x, n.y + 38, `z=${fmt(z, 4)}`, { size: '7', color: '#94a3b8' });
            // Show sigma label
            addText(n.x, n.y - 20, 'σ', { size: '9', color: '#a78bfa' });
        });

        // Output nodes
        layers.output.forEach((n, i) => {
            const fill = highlightPhase === 'backward' ? '#fef2f2' : (highlightPhase ? '#dbeafe' : '#f1f5f9');
            addCircle(n.x, n.y, 22, fill, '#f97316');
            addText(n.x, n.y - 8, n.label, { size: '10', bold: true });
            const o = i === 0 ? net.o1 : net.o2;
            if (o !== undefined) addText(n.x, n.y + 6, fmt(o, 4), { size: '7', color: '#f97316' });
            const z = i === 0 ? net.z_o1 : net.z_o2;
            if (z !== undefined) addText(n.x, n.y + 38, `z=${fmt(z, 4)}`, { size: '7', color: '#94a3b8' });
            addText(n.x, n.y - 20, 'σ', { size: '9', color: '#fb923c' });

            // Show delta if backward
            if (highlightPhase === 'backward') {
                const delta = i === 0 ? gradients.delta_o1 : gradients.delta_o2;
                if (delta !== undefined) {
                    addText(n.x + 35, n.y + 20, `δ=${fmt(delta, 4)}`, { size: '7', color: '#ef4444', bold: true });
                }
            }
        });

        // Target nodes
        layers.target.forEach((n, i) => {
            addCircle(n.x, n.y, 16, '#dcfce7', '#22c55e');
            addText(n.x, n.y - 5, n.label, { size: '9', bold: true });
            const t = i === 0 ? net.t1 : net.t2;
            if (t !== undefined) addText(n.x, n.y + 8, fmt(t, 2), { size: '8', color: '#22c55e' });
        });

        // Bias nodes (small)
        [...layers.bias1, ...layers.bias2].forEach((n) => {
            addCircle(n.x, n.y, 12, '#fef9c3', '#eab308');
            addText(n.x, n.y, n.label, { size: '8', bold: true, color: '#a16207' });
        });

        // Loss display
        if (net.E_total !== undefined) {
            addRect(560, 170, 130, 50, highlightPhase === 'backward' ? '#fef2f2' : '#f0fdf4');
            addText(625, 185, 'E_total', { size: '10', bold: true, color: '#dc2626' });
            addText(625, 200, fmt(net.E_total, 6), { size: '11', bold: true, color: '#dc2626' });
        }

        // Backward flow arrows
        if (highlightPhase === 'backward') {
            // Big red arrow showing flow direction
            const arrowY = 355;
            addLine(580, arrowY, 120, arrowY, '#ef4444', 2);
            addText(350, arrowY - 10, '← ERROR GRADIENT FLOWS BACKWARD ←', { size: '10', bold: true, color: '#ef4444' });
        }

        if (highlightPhase === 'forward') {
            const arrowY = 355;
            addLine(120, arrowY, 580, arrowY, '#3b82f6', 2);
            addText(350, arrowY - 10, '→ DATA FLOWS FORWARD →', { size: '10', bold: true, color: '#3b82f6' });
        }
    }

    // --- Math Display Builders ---
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
            return `$$${k}^{+} = ${fmt(oldVal,4)} - ${fmt(lr,2)} \\times ${fmt(gradients[k],6)} = ${fmt(w[k],4)}$$`;
        });
        return `
<div class="md" style="font-size:0.82rem; line-height:1.8;">
<b style="color:#10b981;">━━━ WEIGHT UPDATE (Gradient Descent) ━━━</b>

$$w^{+} = w - \\eta \\cdot \\frac{\\partial E}{\\partial w} \\qquad (\\eta = ${fmt(lr,2)})$$

${lines.join('\n')}
</div>`;
    }

    // --- Loss Chart ---
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
            marker: { size: 4, color: '#ef4444' },
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

    // --- Button Handlers ---
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
                forwardPass(); // Final forward to show result
                drawNetwork('forward');
                displayGradients();
                els.mathDisplay.innerHTML = `
<div class="md" style="font-size:0.85rem;">
<b style="color:#8b5cf6;">━━━ AUTO-TRAIN COMPLETE (100 Epochs) ━━━</b>

After 100 epochs of gradient descent:
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
        // Reset weights to defaults
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
