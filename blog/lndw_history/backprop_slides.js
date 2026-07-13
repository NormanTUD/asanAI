// ═══════════════════════════════════════════════════════════════════
// backprop_slides.js — Visualisierungen für die Backprop/ResNet-Folien
// Inspiriert von attractors.js (Paris-Attractor-Stil) und resnetlab.js
// ═══════════════════════════════════════════════════════════════════

const BPSlides = (() => {
    'use strict';

    let lossLandscapeRunning = false;
    let lossLandscapeRAF = null;

    // ═══════════════════════════════════════════════════════════════
    // 3D LOSS LANDSCAPE – Ball rollt durch Fehlerlandschaft
    // Stil: Paris-Attractor aus attractors.js (dunkler Hintergrund,
    // leuchtende Trails, interaktive Kamera)
    // ═══════════════════════════════════════════════════════════════

    function initLossLandscape() {
        const container = document.getElementById('bp-loss-landscape');
        const canvas = document.getElementById('bp-loss-canvas');
        if (!container || !canvas) return;

        const rect = container.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) {
            setTimeout(initLossLandscape, 200);
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        // === Loss function: two minima + saddle point ===
        function lossFunc(x, y) {
            // Two Gaussian wells + saddle
            const g1 = -1.2 * Math.exp(-((x - 1.2) ** 2 + (y - 0.8) ** 2) / 0.8);
            const g2 = -1.8 * Math.exp(-((x + 0.8) ** 2 + (y + 0.5) ** 2) / 0.6);
            const g3 = -0.5 * Math.exp(-((x - 0.2) ** 2 + (y - 1.5) ** 2) / 1.0);
            const base = 0.08 * (x * x + y * y);
            const ripple = 0.04 * Math.sin(x * 2.5) * Math.cos(y * 2.5);
            return g1 + g2 + g3 + base + ripple;
        }

        // === Terrain grid ===
        const gridRes = 50;
        const range = 3.0;
        const step = (range * 2) / gridRes;
        let heightMap = [];
        let minH = Infinity, maxH = -Infinity;

        for (let iy = 0; iy <= gridRes; iy++) {
            heightMap[iy] = [];
            for (let ix = 0; ix <= gridRes; ix++) {
                const px = -range + ix * step;
                const py = -range + iy * step;
                const h = lossFunc(px, py);
                heightMap[iy][ix] = { x: px, y: py, h };
                if (h < minH) minH = h;
                if (h > maxH) maxH = h;
            }
        }

        // === Camera state ===
        let camRotY = 0.7;
        let camTilt = 0.5;
        let camZoom = 1.0;
        let targetRotY = 0.7;
        let targetTilt = 0.5;
        let targetZoom = 1.0;

        const baseScaleX = Math.min(W, H) * 0.06;
        const baseScaleY = baseScaleX * 0.5;
        const heightScale = Math.min(W, H) * 0.12;

        function project(px, py, h) {
            const rx = px * Math.cos(camRotY) - py * Math.sin(camRotY);
            const ry = px * Math.sin(camRotY) + py * Math.cos(camRotY);
            const scaleX = baseScaleX * camZoom;
            const scaleY = baseScaleY * camZoom;
            const hScale = heightScale * camZoom;
            return {
                sx: W / 2 + rx * scaleX,
                sy: H / 2 + 20 + ry * scaleY * camTilt - h * hScale,
                depth: ry
            };
        }

        // === Ball (gradient descent) ===
        let ball = {
            x: 2.0, y: 2.0, vx: 0, vy: 0,
            trail: [], arrived: false, restartTimer: 0
        };

        function respawnBall() {
            const angle = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * 1.0;
            ball.x = Math.cos(angle) * r;
            ball.y = Math.sin(angle) * r;
            ball.vx = 0;
            ball.vy = 0;
            ball.trail = [];
            ball.arrived = false;
            ball.restartTimer = 0;
        }

        // === Mouse interaction ===
        let isDragging = false;
        let lastMX = 0, lastMY = 0;

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMX = e.clientX; lastMY = e.clientY;
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastMX;
            const dy = e.clientY - lastMY;
            targetRotY += dx * 0.005;
            targetTilt += dy * 0.003;
            targetTilt = Math.max(0.2, Math.min(1.0, targetTilt));
            lastMX = e.clientX; lastMY = e.clientY;
        });
        canvas.addEventListener('mouseup', () => isDragging = false);
        canvas.addEventListener('mouseleave', () => isDragging = false);
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            targetZoom *= e.deltaY > 0 ? 0.92 : 1.08;
            targetZoom = Math.max(0.5, Math.min(2.5, targetZoom));
        }, { passive: false });

        // Touch support
        let touchStartDist = 0;
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                lastMX = e.touches[0].clientX;
                lastMY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                touchStartDist = Math.sqrt(dx * dx + dy * dy);
            }
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                const dx = e.touches[0].clientX - lastMX;
                const dy = e.touches[0].clientY - lastMY;
                targetRotY += dx * 0.005;
                targetTilt += dy * 0.003;
                targetTilt = Math.max(0.2, Math.min(1.0, targetTilt));
                lastMX = e.touches[0].clientX;
                lastMY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (touchStartDist > 0) {
                    targetZoom *= dist / touchStartDist;
                    targetZoom = Math.max(0.5, Math.min(2.5, targetZoom));
                }
                touchStartDist = dist;
            }
        });
        canvas.addEventListener('touchend', () => { isDragging = false; touchStartDist = 0; });

        // === Gradient computation for ball ===
        function gradLoss(x, y) {
            const eps = 0.05;
            const dfdx = (lossFunc(x + eps, y) - lossFunc(x - eps, y)) / (2 * eps);
            const dfdy = (lossFunc(x, y + eps) - lossFunc(x, y - eps)) / (2 * eps);
            return { dx: dfdx, dy: dfdy };
        }

        // === Animation loop ===
        let t = 0;
        lossLandscapeRunning = true;

        function animate() {
            if (!lossLandscapeRunning) return;
            t++;

            // Smooth camera
            camRotY += (targetRotY - camRotY) * 0.06;
            camTilt += (targetTilt - camTilt) * 0.06;
            camZoom += (targetZoom - camZoom) * 0.08;

            // Auto-rotate when not dragging
            if (!isDragging) targetRotY += 0.001;

            // Update ball physics (gradient descent with momentum)
            if (!ball.arrived) {
                const grad = gradLoss(ball.x, ball.y);
                const lr = 0.012;
                const momentum = 0.92;
                ball.vx = momentum * ball.vx - lr * grad.dx;
                ball.vy = momentum * ball.vy - lr * grad.dy;
                ball.x += ball.vx;
                ball.y += ball.vy;

                // Clamp to range
                ball.x = Math.max(-range + 0.1, Math.min(range - 0.1, ball.x));
                ball.y = Math.max(-range + 0.1, Math.min(range - 0.1, ball.y));

                // Store trail
                ball.trail.push({ x: ball.x, y: ball.y });
                if (ball.trail.length > 300) ball.trail.shift();

                // Check if arrived (speed very low)
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (speed < 0.0005 && t > 100) {
                    ball.arrived = true;
                    ball.restartTimer = 120;
                }
            } else {
                ball.restartTimer--;
                if (ball.restartTimer <= 0) respawnBall();
            }

            // === RENDER ===
            ctx.clearRect(0, 0, W, H);

            // Background gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // === Draw terrain (painter's algorithm) ===
            let quads = [];
            for (let iy = 0; iy < gridRes; iy++) {
                for (let ix = 0; ix < gridRes; ix++) {
                    const p00 = heightMap[iy][ix];
                    const p10 = heightMap[iy][ix + 1];
                    const p01 = heightMap[iy + 1][ix];
                    const p11 = heightMap[iy + 1][ix + 1];
                    const avgH = (p00.h + p10.h + p01.h + p11.h) / 4;
                    const avgX = (p00.x + p10.x) / 2;
                    const avgY = (p00.y + p01.y) / 2;
                    const proj = project(avgX, avgY, avgH);
                    quads.push({ corners: [p00, p10, p11, p01], avgH, depth: proj.depth });
                }
            }
            quads.sort((a, b) => a.depth - b.depth);

            const hRange = maxH - minH || 1;
            for (const q of quads) {
                const projCorners = q.corners.map(c => project(c.x, c.y, c.h));
                const normalizedH = (q.avgH - minH) / hRange;

                // Color: deep blue (low/minimum) to warm orange/red (high/ridge)
                const r = Math.round(40 + normalizedH * 200);
                const g = Math.round(20 + (1 - normalizedH) * 100 + normalizedH * 60);
                const b = Math.round(180 - normalizedH * 140);

                // Simple shading
                const dx = (q.corners[1].h - q.corners[0].h);
                const dy = (q.corners[3].h - q.corners[0].h);
                const light = Math.max(0.5, Math.min(1.4, 1.0 + dx * 3.0 - dy * 1.5));

                ctx.beginPath();
                ctx.moveTo(projCorners[0].sx, projCorners[0].sy);
                ctx.lineTo(projCorners[1].sx, projCorners[1].sy);
                ctx.lineTo(projCorners[2].sx, projCorners[2].sy);
                ctx.lineTo(projCorners[3].sx, projCorners[3].sy);
                ctx.closePath();
                ctx.fillStyle = `rgba(${Math.min(255, Math.round(r * light))}, ${Math.min(255, Math.round(g * light))}, ${Math.min(255, Math.round(b * light))}, 0.9)`;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // === Draw ball trail (Paris-Attractor style: glowing, color-shifting) ===
            if (ball.trail.length > 1) {
                for (let i = 1; i < ball.trail.length; i++) {
                    const p0 = ball.trail[i - 1];
                    const p1 = ball.trail[i];
                    const h0 = lossFunc(p0.x, p0.y);
                    const h1 = lossFunc(p1.x, p1.y);
                    const proj0 = project(p0.x, p0.y, h0 - 0.03);
                    const proj1 = project(p1.x, p1.y, h1 - 0.03);
                    const alpha = (i / ball.trail.length) * 0.7;
                    const hue = (t * 0.5 + i * 1.2) % 360;
                    ctx.beginPath();
                    ctx.moveTo(proj0.sx, proj0.sy);
                    ctx.lineTo(proj1.sx, proj1.sy);
                    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }
            }

            // === Draw ball ===
            const ballH = lossFunc(ball.x, ball.y);
            const ballProj = project(ball.x, ball.y, ballH - 0.05);

            // Glow
            const glow = ctx.createRadialGradient(ballProj.sx, ballProj.sy, 0, ballProj.sx, ballProj.sy, 16);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ballProj.sx, ballProj.sy, 16, 0, Math.PI * 2);
            ctx.fill();

            // Ball body
            ctx.beginPath();
            ctx.arc(ballProj.sx, ballProj.sy, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Label
            ctx.font = 'bold 10px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText('θ', ballProj.sx, ballProj.sy - 14);

            // === Info overlay ===
            ctx.font = '11px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'left';
            ctx.fillText(`Loss: ${lossFunc(ball.x, ball.y).toFixed(4)}`, 12, H - 12);
            ctx.fillText(`w₁: ${ball.x.toFixed(3)}, w₂: ${ball.y.toFixed(3)}`, 12, H - 28);

            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '9px system-ui';
            ctx.fillText('🖱 Ziehen = Drehen · Scroll = Zoom', W - 12, H - 12);

            lossLandscapeRAF = requestAnimationFrame(animate);
        }

        animate();
    }

    // ═══════════════════════════════════════════════════════════════
    // GRADIENT COMPARISON PLOT (Plain vs ResNet)
    // Uses Plotly, inspired by resnetlab.js
    // ═══════════════════════════════════════════════════════════════

    function updateGradientPlot() {
        const depthEl = document.getElementById('bp-depth-slider');
        if (!depthEl) return;
        const depth = parseInt(depthEl.value);

        let plainGradients = [];
        let resGradients = [];
        let labels = [];

        let gPlain = 1.0;
        let gRes = 1.0;

        for (let i = 0; i <= depth; i++) {
            labels.push(`L${i}`);
            plainGradients.push(gPlain);
            resGradients.push(gRes);

            // Plain: exponential decay
            gPlain *= 0.88;

            // ResNet: additive identity preserves gradient
            gRes = (gRes * 0.88) + 0.11;
            if (gRes > 1.0) gRes = 1.0;
        }

        const trace1 = {
            x: labels, y: plainGradients,
            name: 'Plain Network (multiplikativ)',
            type: 'scatter', fill: 'tozeroy',
            line: { color: '#ef4444', width: 3 }
        };
        const trace2 = {
            x: labels, y: resGradients,
            name: 'ResNet (additiv, +1)',
            type: 'scatter', fill: 'tozeroy',
            line: { color: '#3b82f6', width: 3 }
        };

        const layout = {
            margin: { t: 10, b: 40, l: 50, r: 20 },
            yaxis: { title: 'Gradient-Stärke', range: [0, 1.1], gridcolor: '#f1f5f9' },
            xaxis: { title: 'Netztiefe (Schichten)', gridcolor: '#f1f5f9' },
            legend: { orientation: 'h', y: -0.2 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(255,255,255,0.95)',
            autosize: true
        };

        const plotDiv = document.getElementById('bp-gradient-plot');
        if (plotDiv && typeof Plotly !== 'undefined') {
            Plotly.newPlot(plotDiv, [trace1, trace2], layout, { displayModeBar: false, responsive: true });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // RESNET GRADIENT COMPARISON (for the Signal slide)
    // ═══════════════════════════════════════════════════════════════

    function initResnetComparison() {
        const div = document.getElementById('resnet-gradient-comparison');
        if (!div || typeof Plotly === 'undefined') return;

        const depth = 50;
        let plain = [], res = [], labels = [];
        let gP = 1.0, gR = 1.0;

        for (let i = 0; i <= depth; i++) {
            labels.push(i);
            plain.push(gP);
            res.push(gR);
            gP *= 0.88;
            gR = (gR * 0.88) + 0.11;
            if (gR > 1.0) gR = 1.0;
        }

        Plotly.newPlot(div, [
            { x: labels, y: plain, name: 'Plain Net', line: { color: '#ef4444', width: 2 }, type: 'scatter' },
            { x: labels, y: res, name: 'ResNet', line: { color: '#3b82f6', width: 2 }, type: 'scatter' }
        ], {
            margin: { t: 10, b: 35, l: 45, r: 10 },
            yaxis: { title: 'Gradient', range: [0, 1.1] },
            xaxis: { title: 'Schicht' },
            legend: { orientation: 'h', y: -0.25 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(255,255,255,0.95)'
        }, { displayModeBar: false, responsive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // NEURAL NET TIMELINE (for the Geschichte slide)
    // ═══════════════════════════════════════════════════════════════

    function initNNTimeline() {
        const div = document.getElementById('bp-nn-timeline');
        if (!div || typeof Plotly === 'undefined') return;

        const events = [
            { year: 1943, label: 'McCulloch-Pitts Neuron', color: '#ef4444' },
            { year: 1958, label: 'Perceptron (Rosenblatt)', color: '#ef4444' },
            { year: 1969, label: 'XOR-Problem (Minsky)', color: '#94a3b8' },
            { year: 1970, label: 'Autodiff (Linnainmaa)', color: '#f59e0b' },
            { year: 1986, label: 'Backpropagation (Rumelhart)', color: '#22c55e' },
            { year: 1991, label: 'Vanishing Gradient (Hochreiter)', color: '#ef4444' },
            { year: 1997, label: 'LSTM (Hochreiter & Schmidhuber)', color: '#22c55e' },
            { year: 1998, label: 'LeNet-5 (LeCun)', color: '#3b82f6' },
            { year: 2012, label: 'AlexNet / GPU-Revolution', color: '#22c55e' },
            { year: 2015, label: 'ResNet (He et al.)', color: '#3b82f6' },
            { year: 2017, label: 'Transformer (Vaswani et al.)', color: '#3b82f6' },
            { year: 2022, label: 'ChatGPT', color: '#6366f1' }
        ];

        const trace = {
            x: events.map(e => e.year),
            y: events.map(() => 1),
            mode: 'markers+text',
            marker: {
                size: 14,
                color: events.map(e => e.color),
                line: { width: 2, color: '#fff' }
            },
            text: events.map(e => e.label),
            textposition: events.map((_, i) => i % 2 === 0 ? 'top center' : 'bottom center'),
            textfont: { size: 9 },
            hovertext: events.map(e => `${e.year}: ${e.label}`),
            hoverinfo: 'text',
            type: 'scatter'
        };

        Plotly.newPlot(div, [trace], {
            xaxis: { title: 'Jahr', range: [1938, 2027], gridcolor: '#f1f5f9' },
            yaxis: { visible: false, range: [0.3, 1.7] },
            showlegend: false,
            margin: { t: 20, b: 50, l: 20, r: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(255,255,255,0.95)',
            shapes: [{
                type: 'line',
                x0: 1940, x1: 2025,
                y0: 1, y1: 1,
                line: { color: '#e2e8f0', width: 2 }
            }]
        }, { displayModeBar: false, responsive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // RESNET ARCHITECTURE DIAGRAM (SVG in the architecture slide)
    // ═══════════════════════════════════════════════════════════════

    function initResnetArchDiagram() {
        const container = document.getElementById('resnet-architecture-viz');
        if (!container) return;

        const W = container.clientWidth || 700;
        const H = 170;

        let svg = `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible">
        <defs>
            <marker id="bp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6"/>
            </marker>
        </defs>`;

        const nodes = [
            { x: 60, y: 85, label: 'x', color: '#64748b' },
            { x: 200, y: 85, label: 'Conv', color: '#3b82f6' },
            { x: 320, y: 85, label: 'BN+ReLU', color: '#10b981' },
            { x: 440, y: 85, label: 'Conv', color: '#3b82f6' },
            { x: 580, y: 85, label: 'F(x)+x', color: '#6366f1' },
            { x: 660, y: 85, label: 'ReLU', color: '#10b981' }
        ];

        // Main path arrows
        for (let i = 0; i < nodes.length - 1; i++) {
            svg += `<line x1="${nodes[i].x + 30}" y1="${nodes[i].y}" x2="${nodes[i + 1].x - 30}" y2="${nodes[i + 1].y}" stroke="#94a3b8" stroke-width="2" marker-end="url(#bp-arrow)"/>`;
        }

        // Skip connection arc
        svg += `<path d="M ${nodes[0].x} ${nodes[0].y - 25} Q ${(nodes[0].x + nodes[4].x) / 2} ${nodes[0].y - 70} ${nodes[4].x} ${nodes[4].y - 25}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="6,3" marker-end="url(#bp-arrow)"/>`;
        svg += `<text x="${(nodes[0].x + nodes[4].x) / 2}" y="${nodes[0].y - 72}" text-anchor="middle" font-size="11" fill="#f59e0b" font-weight="bold">Identity Shortcut (x)</text>`;

        // + symbol at F(x)+x
        svg += `<text x="${nodes[4].x - 40}" y="${nodes[4].y - 10}" font-size="18" fill="#6366f1" font-weight="bold">+</text>`;

        // Nodes
        nodes.forEach(n => {
            svg += `<rect x="${n.x - 28}" y="${n.y - 18}" width="56" height="36" rx="8" fill="white" stroke="${n.color}" stroke-width="2"/>`;
            svg += `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="11" fill="${n.color}" font-weight="bold">${n.label}</text>`;
        });

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEMML RENDERING for math-display elements
    // ═══════════════════════════════════════════════════════════════

function renderTemml() {
    if (typeof temml === 'undefined') return;

    // 1. Bestehend: Display-Formeln (data-temml)
    document.querySelectorAll('.math-display[data-temml]').forEach(el => {
        if (el.dataset.rendered) return;
        try {
            const tex = el.dataset.temml.replace(/^\$\$/, '').replace(/\$\$$/, '');
            temml.render(tex, el, { displayMode: true });
            el.dataset.rendered = 'true';
        } catch (e) {
            el.textContent = el.dataset.temml;
        }
    });

    // 2. NEU: Inline-Formeln $...$ in Textknoten
    const walker = document.createTreeWalker(
        document.getElementById('presentation'),
        NodeFilter.SHOW_TEXT,
        null
    );

    const nodesToReplace = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (/\$[^$]+\$/.test(node.textContent) && !node.parentElement.closest('.math-display, [data-rendered-inline]')) {
            nodesToReplace.push(node);
        }
    }

    nodesToReplace.forEach(node => {
        const parent = node.parentElement;
        const html = node.textContent.replace(/\$([^$]+)\$/g, (match, tex) => {
            try {
                const span = document.createElement('span');
                temml.render(tex, span, { displayMode: false });
                return span.innerHTML;
            } catch (e) {
                return match;
            }
        });

        if (html !== node.textContent) {
            const wrapper = document.createElement('span');
            wrapper.setAttribute('data-rendered-inline', 'true');
            wrapper.innerHTML = html;
            parent.replaceChild(wrapper, node);
        }
    });
}

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION — called when slides become visible
    // ═══════════════════════════════════════════════════════════════

    function initAll() {
        renderTemml();
        // Delay canvas-based viz to ensure container has dimensions
        setTimeout(() => {
            initLossLandscape();
            initResnetComparison();
            initNNTimeline();
            initResnetArchDiagram();
            updateGradientPlot();
        }, 300);
    }

    function cleanup() {
        lossLandscapeRunning = false;
        if (lossLandscapeRAF) {
            cancelAnimationFrame(lossLandscapeRAF);
            lossLandscapeRAF = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        initAll,
        cleanup,
        updateGradientPlot,
        initLossLandscape,
        initResnetComparison,
        initNNTimeline,
        initResnetArchDiagram,
        renderTemml
    };

})(); // end BPSlides IIFE


// ═══════════════════════════════════════════════════════════════════
// AUTO-INIT: Hook into existing Presentation engine
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Render Temml on load
    setTimeout(() => BPSlides.renderTemml(), 200);

    // Re-init visualizations when relevant slides become active
    const observer = new MutationObserver(() => {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return;
        const title = activeSlide.getAttribute('data-title') || '';

        if (title.includes('Loss Landscape')) {
            setTimeout(() => BPSlides.initLossLandscape(), 100);
        } else if (title.includes('Gradient Explorer')) {
            setTimeout(() => BPSlides.updateGradientPlot(), 100);
        } else if (title.includes('Signal: Plain vs ResNet')) {
            setTimeout(() => BPSlides.initResnetComparison(), 100);
        } else if (title.includes('Geschichte: Neuronale Netze')) {
            setTimeout(() => BPSlides.initNNTimeline(), 100);
        } else if (title.includes('ResNet Architektur')) {
            setTimeout(() => BPSlides.initResnetArchDiagram(), 100);
        }

        // Always re-render Temml when slide changes
        BPSlides.renderTemml();
    });

    const presentation = document.getElementById('presentation');
    if (presentation) {
        observer.observe(presentation, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
});
