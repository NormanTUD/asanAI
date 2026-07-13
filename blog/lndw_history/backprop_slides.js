// ═══════════════════════════════════════════════════════════════════
// backprop_slides.js — Visualisierungen für die Backprop/ResNet-Folien
// Inspiriert von attractors.js (Paris-Attractor-Stil) und resnetlab.js
// ═══════════════════════════════════════════════════════════════════

const BPSlides = (() => {
    'use strict';

    let lossLandscapeRunning = false;
    let lossLandscapeRAF = null;
    let ballSpeedMultiplier = 0.3;
    let landscapePaused = false;

    // ═══════════════════════════════════════════════════════════════
    // FORWARD-VIZ: Animiertes Netz-Diagramm
    // ═══════════════════════════════════════════════════════════════

    function initForwardViz() {
        const container = document.getElementById('bp-forward-viz');
        if (!container) return;

        const layers = [
            { name: 'Input', neurons: 3, color: '#64748b' },
            { name: 'Hidden 1', neurons: 4, color: '#3b82f6' },
            { name: 'Hidden 2', neurons: 4, color: '#6366f1' },
            { name: 'Output', neurons: 2, color: '#10b981' }
        ];

        let html = '<svg width="100%" height="200" viewBox="0 0 700 200" style="max-width:700px;">';

        const layerX = [80, 250, 420, 600];

        // Draw connections
        for (let l = 0; l < layers.length - 1; l++) {
            const curr = layers[l], next = layers[l + 1];
            const currY = Array.from({ length: curr.neurons }, (_, i) => 100 - ((curr.neurons - 1) * 22) + i * 44);
            const nextY = Array.from({ length: next.neurons }, (_, i) => 100 - ((next.neurons - 1) * 22) + i * 44);
            for (const cy of currY) {
                for (const ny of nextY) {
                    html += `<line x1="${layerX[l]}" y1="${cy}" x2="${layerX[l + 1]}" y2="${ny}" stroke="#cbd5e1" stroke-width="1" opacity="0.5"/>`;
                }
            }
        }

        // Draw neurons
        for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            const positions = Array.from({ length: layer.neurons }, (_, i) => 100 - ((layer.neurons - 1) * 22) + i * 44);
            for (const y of positions) {
                html += `<circle cx="${layerX[l]}" cy="${y}" r="14" fill="white" stroke="${layer.color}" stroke-width="2.5"/>`;
            }
            html += `<text x="${layerX[l]}" y="195" text-anchor="middle" font-size="11" fill="${layer.color}" font-weight="bold">${layer.name}</text>`;
        }

        // Arrows between layers
        for (let l = 0; l < layers.length - 1; l++) {
            const midX = (layerX[l] + layerX[l + 1]) / 2;
            html += `<text x="${midX}" y="16" text-anchor="middle" font-size="10" fill="#94a3b8">W×x + b → σ</text>`;
        }

        html += '</svg>';
        container.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    // FORWARD/BACKWARD FLOW ANIMATION
    // ═══════════════════════════════════════════════════════════════

    let flowState = { phase: 'idle', t: 0, raf: null, draw: null, drawSignal: null };

    function initFlowAnimation() {
        const canvas = document.getElementById('bp-flow-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = Math.max(rect.height, 340) * dpr;
        canvas.style.height = '340px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 340;

        const layers = [
            { x: 0.1, label: 'Input\nx', color: '#64748b' },
            { x: 0.3, label: 'Layer 1\nW₁x+b₁', color: '#3b82f6' },
            { x: 0.5, label: 'Layer 2\nW₂h₁+b₂', color: '#6366f1' },
            { x: 0.7, label: 'Output\nŷ', color: '#10b981' },
            { x: 0.9, label: 'Loss\nE(ŷ,y)', color: '#ef4444' }
        ];

        function drawBase() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            // Connections
            for (let i = 0; i < layers.length - 1; i++) {
                ctx.beginPath();
                ctx.moveTo(layers[i].x * W + 40, H / 2);
                ctx.lineTo(layers[i + 1].x * W - 40, H / 2);
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Nodes
            layers.forEach(l => {
                const x = l.x * W, y = H / 2;
                ctx.beginPath();
                ctx.arc(x, y, 35, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = l.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = l.color;
                ctx.font = 'bold 11px system-ui';
                ctx.textAlign = 'center';
                const lines = l.label.split('\n');
                lines.forEach((line, idx) => {
                    ctx.fillText(line, x, y - 6 + idx * 14);
                });
            });
        }

        function drawSignal(progress, direction, color) {
            drawBase();
            const startIdx = direction === 'forward' ? 0 : layers.length - 1;
            const endIdx = direction === 'forward' ? layers.length - 1 : 0;
            const sign = direction === 'forward' ? 1 : -1;

            const totalDist = Math.abs(endIdx - startIdx);
            const currentPos = startIdx + sign * progress * totalDist;

            const fromLayer = layers[Math.floor(Math.min(currentPos, layers.length - 1.01))];
            const toLayer = layers[Math.ceil(Math.min(currentPos, layers.length - 1))];
            const frac = currentPos - Math.floor(currentPos);
            const ballX = (fromLayer ? fromLayer.x : layers[startIdx].x) * W +
                ((toLayer ? toLayer.x : layers[endIdx].x) * W - (fromLayer ? fromLayer.x : layers[startIdx].x) * W) * frac;

            // Glow
            const glow = ctx.createRadialGradient(ballX, H / 2, 0, ballX, H / 2, 25);
            glow.addColorStop(0, color + 'aa');
            glow.addColorStop(1, color + '00');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ballX, H / 2, 25, 0, Math.PI * 2);
            ctx.fill();

            // Ball
            ctx.beginPath();
            ctx.arc(ballX, H / 2, 10, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 13px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(direction === 'forward' ? '→ Daten fließen vorwärts' : '← Fehler fließt rückwärts', W / 2, 30);
        }

        flowState.draw = drawBase;
        flowState.drawSignal = drawSignal;
        flowState.W = W;
        flowState.H = H;
        drawBase();
    }

    function animateForward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.phase = 'forward';
        flowState.t = 0;

        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) {
                flowState.drawSignal(1, 'forward', '#10b981');
                flowState.phase = 'idle';
                return;
            }
            flowState.drawSignal(flowState.t, 'forward', '#10b981');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function animateBackward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.phase = 'backward';
        flowState.t = 0;

        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) {
                flowState.drawSignal(1, 'backward', '#ef4444');
                flowState.phase = 'idle';
                return;
            }
            flowState.drawSignal(flowState.t, 'backward', '#ef4444');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetFlow() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.phase = 'idle';
        flowState.t = 0;
        if (flowState.draw) flowState.draw();
    }

    // ═══════════════════════════════════════════════════════════════
    // WEIGHT UPDATE / GRADIENT DESCENT 2D VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    function loss1D(x) {
        return 0.5 * (x - 1) * (x - 1) + 0.3 * Math.sin(x * 2) + 0.1 * (x + 1) * (x + 1) * 0.05;
    }

    function gradLoss1D(x) {
        const eps = 0.001;
        return (loss1D(x + eps) - loss1D(x - eps)) / (2 * eps);
    }

    function drawGDViz() {
        const canvas = document.getElementById('bp-update-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 320 * dpr;
        canvas.style.height = '320px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 320;

        ctx.clearRect(0, 0, W, H);

        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#f8fafc');
        bg.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const xMin = -2, xMax = 5;
        const padding = 40;
        const plotW = W - 2 * padding;
        const plotH = H - 80;

        let yMin = Infinity, yMax = -Infinity;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }
        yMin -= 0.5; yMax += 0.5;

        function toScreen(x, y) {
            return {
                sx: padding + ((x - xMin) / (xMax - xMin)) * plotW,
                sy: padding + (1 - (y - yMin) / (yMax - yMin)) * plotH
            };
        }

        // Grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
            const { sx } = toScreen(gx, 0);
            ctx.beginPath(); ctx.moveTo(sx, padding); ctx.lineTo(sx, padding + plotH); ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(gx.toString(), sx, padding + plotH + 14);
        }

        // Loss curve
        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            const { sx, sy } = toScreen(x, y);
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Fill under curve
        const lastX = xMin + ((plotW - 1) / plotW) * (xMax - xMin);
        const { sx: lastSx } = toScreen(lastX, loss1D(lastX));
        ctx.lineTo(lastSx, padding + plotH);
        const { sx: firstSx } = toScreen(xMin, 0);
        ctx.lineTo(firstSx, padding + plotH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
        ctx.fill();

        // History trail
        if (gdState.history.length > 1) {
            for (let i = 1; i < gdState.history.length; i++) {
                const p0 = toScreen(gdState.history[i - 1], loss1D(gdState.history[i - 1]));
                const p1 = toScreen(gdState.history[i], loss1D(gdState.history[i]));
                ctx.beginPath();
                ctx.moveTo(p0.sx, p0.sy);
                ctx.lineTo(p1.sx, p1.sy);
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + 0.7 * (i / gdState.history.length)})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Current position
        const { sx: bx, sy: by } = toScreen(gdState.x, loss1D(gdState.x));

        // Gradient arrow
        const grad = gradLoss1D(gdState.x);
        const lr = parseFloat(document.getElementById('bp-lr-slider')?.value || 10) / 100;
        const arrowLen = Math.min(80, Math.abs(grad * lr) * 60);
        const arrowDir = grad > 0 ? -1 : 1;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + arrowDir * arrowLen, by);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + arrowDir * arrowLen, by);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by - 5);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by + 5);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Ball glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 18);
        glow.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill();

        // Ball
        ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

        // Info text
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`w = ${gdState.x.toFixed(3)}`, padding, 20);
        ctx.fillText(`Loss = ${loss1D(gdState.x).toFixed(4)}`, padding + 130, 20);
        ctx.fillText(`∇ = ${grad.toFixed(4)}`, padding + 290, 20);
        ctx.fillStyle = '#6366f1';
        ctx.fillText(`η = ${lr.toFixed(2)}`, padding + 420, 20);
    }

    function autoGD() {
        if (gdState.running) {
            gdState.running = false;
            if (gdState.raf) cancelAnimationFrame(gdState.raf);
            return;
        }
        gdState.running = true;
        let count = 0;
        function step() {
            if (!gdState.running || count > 200) {
                gdState.running = false;
                return;
            }
            stepGD();
            count++;
            gdState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetGD() {
        gdState.running = false;
        if (gdState.raf) cancelAnimationFrame(gdState.raf);
        gdState.x = 3.5;
        gdState.history = [3.5];
        drawGDViz();
    }

    // ═══════════════════════════════════════════════════════════════
    // LOSS LANDSCAPE – Speed-Control, Pause, Respawn
    // ═══════════════════════════════════════════════════════════════

    function respawnBall() {
        lossLandscapeRespawnRequested = true;
    }

    function toggleLandscapePause() {
        landscapePaused = !landscapePaused;
        const infoEl = document.getElementById('bp-loss-info');
        if (infoEl) infoEl.textContent = landscapePaused ? '⏸ Pausiert' : '';
    }

    function setBallSpeed(val) {
        ballSpeedMultiplier = parseInt(val) / 10;
    }

    // ═══════════════════════════════════════════════════════════════
    // 3D LOSS LANDSCAPE – Überarbeitet (schneller, schöner, mit Controls)
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

        // Stop previous instance
        lossLandscapeRunning = false;
        if (lossLandscapeRAF) cancelAnimationFrame(lossLandscapeRAF);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        // === Loss function: multiple minima ===
        function lossFunc(x, y) {
            const g1 = -1.2 * Math.exp(-((x - 1.2) ** 2 + (y - 0.8) ** 2) / 0.8);
            const g2 = -1.8 * Math.exp(-((x + 0.8) ** 2 + (y + 0.5) ** 2) / 0.6);
            const g3 = -0.5 * Math.exp(-((x - 0.2) ** 2 + (y - 1.5) ** 2) / 1.0);
            const base = 0.08 * (x * x + y * y);
            const ripple = 0.04 * Math.sin(x * 2.5) * Math.cos(y * 2.5);
            return g1 + g2 + g3 + base + ripple;
        }

        // === Terrain grid ===
        const gridRes = 45;
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

        // === Ball ===
        let ball = {
            x: 2.0, y: 2.0, vx: 0, vy: 0,
            trail: [], arrived: false, restartTimer: 0
        };

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

        // Click to place ball
        canvas.addEventListener('dblclick', (e) => {
            // Simple: respawn at random
            doRespawnBall();
        });

        // === Gradient computation ===
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

            // Check respawn request
            if (lossLandscapeRespawnRequested) {
                doRespawnBall();
                lossLandscapeRespawnRequested = false;
            }

            // Smooth camera
            camRotY += (targetRotY - camRotY) * 0.06;
            camTilt += (targetTilt - camTilt) * 0.06;
            camZoom += (targetZoom - camZoom) * 0.08;

            // Auto-rotate when not dragging
            if (!isDragging) targetRotY += 0.0008;

            // Update ball physics (with speed control and pause)
            if (!landscapePaused && !ball.arrived) {
                const grad = gradLoss(ball.x, ball.y);
                const lr = 0.008 * ballSpeedMultiplier;
                const momentum = 0.94;
                ball.vx = momentum * ball.vx - lr * grad.dx;
                ball.vy = momentum * ball.vy - lr * grad.dy;
                ball.x += ball.vx;
                ball.y += ball.vy;

                ball.x = Math.max(-range + 0.1, Math.min(range - 0.1, ball.x));
                ball.y = Math.max(-range + 0.1, Math.min(range - 0.1, ball.y));

                ball.trail.push({ x: ball.x, y: ball.y });
                if (ball.trail.length > 400) ball.trail.shift();

                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (speed < 0.0003 && t > 100) {
                    ball.arrived = true;
                    ball.restartTimer = 180;
                }
            } else if (ball.arrived) {
                ball.restartTimer--;
                if (ball.restartTimer <= 0) doRespawnBall();
            }

            // === RENDER ===
            ctx.clearRect(0, 0, W, H);

            // Background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // === Draw terrain ===
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

                const r = Math.round(40 + normalizedH * 200);
                const g = Math.round(20 + (1 - normalizedH) * 100 + normalizedH * 60);
                const b2 = Math.round(180 - normalizedH * 140);

                const dx = (q.corners[1].h - q.corners[0].h);
                const dy = (q.corners[3].h - q.corners[0].h);
                const light = Math.max(0.5, Math.min(1.4, 1.0 + dx * 3.0 - dy * 1.5));

                ctx.beginPath();
                ctx.moveTo(projCorners[0].sx, projCorners[0].sy);
                ctx.lineTo(projCorners[1].sx, projCorners[1].sy);
                ctx.lineTo(projCorners[2].sx, projCorners[2].sy);
                ctx.lineTo(projCorners[3].sx, projCorners[3].sy);
                ctx.closePath();
                ctx.fillStyle = `rgba(${Math.min(255, Math.round(r * light))}, ${Math.min(255, Math.round(g * light))}, ${Math.min(255, Math.round(b2 * light))}, 0.9)`;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // === Ball trail ===
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

            // === Ball ===
            const ballH = lossFunc(ball.x, ball.y);
            const ballProj = project(ball.x, ball.y, ballH - 0.05);

            const glow = ctx.createRadialGradient(ballProj.sx, ballProj.sy, 0, ballProj.sx, ballProj.sy, 16);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ballProj.sx, ballProj.sy, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(ballProj.sx, ballProj.sy, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2.5;
            ctx.stroke();

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
            ctx.fillText('🖱 Ziehen = Drehen · Scroll = Zoom · Doppelklick = Respawn', W - 12, H - 12);

            lossLandscapeRAF = requestAnimationFrame(animate);
        }

        animate();
    }

    // ═══════════════════════════════════════════════════════════════
    // GRADIENT COMPARISON PLOT (Plain vs ResNet)
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
            gPlain *= 0.88;
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

    function initResnetComparison(customDepth) {
        const div = document.getElementById('resnet-gradient-comparison');
        if (!div || typeof Plotly === 'undefined') return;

        const depth = customDepth || parseInt(document.getElementById('bp-resnet-depth')?.value || 50);
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
    // NEURAL NET TIMELINE
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
    // FORWARD-VIZ: Animiertes Netz-Diagramm
    // ═══════════════════════════════════════════════════════════════

    function initForwardViz() {
        const container = document.getElementById('bp-forward-viz');
        if (!container) return;

        const layers = [
            { name: 'Input', neurons: 3, color: '#64748b' },
            { name: 'Hidden 1', neurons: 4, color: '#3b82f6' },
            { name: 'Hidden 2', neurons: 4, color: '#6366f1' },
            { name: 'Output', neurons: 2, color: '#10b981' }
        ];

        let html = '<svg width="100%" height="200" viewBox="0 0 700 200" style="max-width:700px;">';
        const layerX = [80, 250, 420, 600];

        for (let l = 0; l < layers.length - 1; l++) {
            const curr = layers[l], next = layers[l + 1];
            const currY = Array.from({ length: curr.neurons }, (_, i) => 100 - ((curr.neurons - 1) * 22) + i * 44);
            const nextY = Array.from({ length: next.neurons }, (_, i) => 100 - ((next.neurons - 1) * 22) + i * 44);
            for (const cy of currY) {
                for (const ny of nextY) {
                    html += `<line x1="${layerX[l]}" y1="${cy}" x2="${layerX[l + 1]}" y2="${ny}" stroke="#cbd5e1" stroke-width="1" opacity="0.5"/>`;
                }
            }
        }

        for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            const positions = Array.from({ length: layer.neurons }, (_, i) => 100 - ((layer.neurons - 1) * 22) + i * 44);
            for (const y of positions) {
                html += `<circle cx="${layerX[l]}" cy="${y}" r="14" fill="white" stroke="${layer.color}" stroke-width="2.5"/>`;
            }
            html += `<text x="${layerX[l]}" y="195" text-anchor="middle" font-size="11" fill="${layer.color}" font-weight="bold">${layer.name}</text>`;
        }

        for (let l = 0; l < layers.length - 1; l++) {
            const midX = (layerX[l] + layerX[l + 1]) / 2;
            html += `<text x="${midX}" y="16" text-anchor="middle" font-size="10" fill="#94a3b8">W×x + b → σ</text>`;
        }

        html += '</svg>';
        container.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    // FORWARD/BACKWARD FLOW ANIMATION
    // ═══════════════════════════════════════════════════════════════

    function animateForward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) { flowState.drawSignal(1, 'forward', '#10b981'); return; }
            flowState.drawSignal(flowState.t, 'forward', '#10b981');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function animateBackward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) { flowState.drawSignal(1, 'backward', '#ef4444'); return; }
            flowState.drawSignal(flowState.t, 'backward', '#ef4444');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetFlow() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        if (flowState.draw) flowState.draw();
    }

    // ═══════════════════════════════════════════════════════════════
    // CHAIN RULE VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    function drawChainViz() {
        const canvas = document.getElementById('bp-chain-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 280 * dpr;
        canvas.style.height = '280px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 280;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const n = chainLayers.length;
        const boxW = Math.min(80, (W - 60) / (n + 1));
        const gap = (W - boxW * (n + 1)) / (n + 2);
        let product = 1;

        for (let i = 0; i < n; i++) {
            const x = gap + i * (boxW + gap);
            const y = H / 2 - 30;
            const val = chainLayers[i];
            product *= val;

            const hue = val > 0.5 ? 120 : val > 0.2 ? 40 : 0;
            const sat = 70;
            const light = 85 - val * 30;

            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
            ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${light - 20}%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, boxW, 60, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 11px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`Layer ${i + 1}`, x + boxW / 2, y + 22);
            ctx.font = '13px system-ui';
            ctx.fillText(`∂ = ${val.toFixed(2)}`, x + boxW / 2, y + 42);

            if (i < n - 1) {
                const arrowX = x + boxW + gap / 2;
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 16px system-ui';
                ctx.fillText('×', arrowX, H / 2 + 2);
            }
        }

        const resX = gap + n * (boxW + gap);
        const resY = H / 2 - 30;
        const isVanishing = product < 0.01;
        ctx.fillStyle = isVanishing ? '#fee2e2' : '#dcfce7';
        ctx.strokeStyle = isVanishing ? '#ef4444' : '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(resX, resY, boxW + 10, 60, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isVanishing ? '#991b1b' : '#166534';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Gradient', resX + (boxW + 10) / 2, resY + 22);
        ctx.font = 'bold 13px system-ui';
        ctx.fillText(product.toExponential(2), resX + (boxW + 10) / 2, resY + 42);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px system-ui';
        ctx.fillText('=', resX - gap / 2, H / 2 + 2);

        const resultEl = document.getElementById('bp-chain-result');
        if (resultEl) {
            const emoji = isVanishing ? '💀' : product < 0.1 ? '⚠️' : '✅';
            resultEl.innerHTML = `${emoji} Gesamtgradient: <span style="color:${isVanishing ? '#ef4444' : '#10b981'}">${product.toExponential(3)}</span> (${n} Schichten)`;
        }
    }

    function chainAddLayer() {
        if (chainLayers.length >= 12) return;
        chainLayers.push(0.7 + Math.random() * 0.25);
        drawChainViz();
    }

    function chainRemoveLayer() {
        if (chainLayers.length <= 2) return;
        chainLayers.pop();
        drawChainViz();
    }

    // ═══════════════════════════════════════════════════════════════
    // WEIGHT UPDATE / GRADIENT DESCENT 2D VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    function loss1D(x) {
        return 0.5 * (x - 1) * (x - 1) + 0.3 * Math.sin(x * 2) + 0.1 * (x + 1) * (x + 1) * 0.05;
    }

    function gradLoss1D(x) {
        const eps = 0.001;
        return (loss1D(x + eps) - loss1D(x - eps)) / (2 * eps);
    }

    function drawGDViz() {
        const canvas = document.getElementById('bp-update-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 320 * dpr;
        canvas.style.height = '320px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 320;

        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#f8fafc');
        bg.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const xMin = -2, xMax = 5;
        const padding = 40;
        const plotW = W - 2 * padding;
        const plotH = H - 80;

        let yMin = Infinity, yMax = -Infinity;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }
        yMin -= 0.5; yMax += 0.5;

        function toScreen(x, y) {
            return {
                sx: padding + ((x - xMin) / (xMax - xMin)) * plotW,
                sy: padding + (1 - (y - yMin) / (yMax - yMin)) * plotH
            };
        }

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
            const { sx } = toScreen(gx, 0);
            ctx.beginPath(); ctx.moveTo(sx, padding); ctx.lineTo(sx, padding + plotH); ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(gx.toString(), sx, padding + plotH + 14);
        }

        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            const { sx, sy } = toScreen(x, y);
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        const lastX = xMin + ((plotW - 1) / plotW) * (xMax - xMin);
        const { sx: lastSx } = toScreen(lastX, loss1D(lastX));
        ctx.lineTo(lastSx, padding + plotH);
        const { sx: firstSx } = toScreen(xMin, 0);
        ctx.lineTo(firstSx, padding + plotH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
        ctx.fill();

        if (gdState.history.length > 1) {
            for (let i = 1; i < gdState.history.length; i++) {
                const p0 = toScreen(gdState.history[i - 1], loss1D(gdState.history[i - 1]));
                const p1 = toScreen(gdState.history[i], loss1D(gdState.history[i]));
                ctx.beginPath();
                ctx.moveTo(p0.sx, p0.sy);
                ctx.lineTo(p1.sx, p1.sy);
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + 0.7 * (i / gdState.history.length)})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Current position
        const { sx: bx, sy: by } = toScreen(gdState.x, loss1D(gdState.x));

        // Gradient arrow
        const grad = gradLoss1D(gdState.x);
        const lr = parseFloat(document.getElementById('bp-lr-slider')?.value || 10) / 100;
        const arrowLen = Math.min(80, Math.abs(grad * lr) * 60);
        const arrowDir = grad > 0 ? -1 : 1;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + arrowDir * arrowLen, by);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + arrowDir * arrowLen, by);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by - 5);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by + 5);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Ball glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 18);
        glow.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill();

        // Ball
        ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

        // Info text
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`w = ${gdState.x.toFixed(3)}`, padding, 20);
        ctx.fillText(`Loss = ${loss1D(gdState.x).toFixed(4)}`, padding + 130, 20);
        ctx.fillText(`∇ = ${grad.toFixed(4)}`, padding + 290, 20);
        ctx.fillStyle = '#6366f1';
        ctx.fillText(`η = ${lr.toFixed(2)}`, padding + 420, 20);
    }

    function autoGD() {
        if (gdState.running) {
            gdState.running = false;
            if (gdState.raf) cancelAnimationFrame(gdState.raf);
            return;
        }
        gdState.running = true;
        let count = 0;
        function step() {
            if (!gdState.running || count > 200) {
                gdState.running = false;
                return;
            }
            stepGD();
            count++;
            gdState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetGD() {
        gdState.running = false;
        if (gdState.raf) cancelAnimationFrame(gdState.raf);
        gdState.x = 3.5;
        gdState.history = [3.5];
        drawGDViz();
    }

    // ═══════════════════════════════════════════════════════════════
    // LOSS LANDSCAPE – Speed-Control, Pause, Respawn
    // ═══════════════════════════════════════════════════════════════

    function respawnBall() {
        lossLandscapeRespawnRequested = true;
    }

    function toggleLandscapePause() {
        landscapePaused = !landscapePaused;
        const infoEl = document.getElementById('bp-loss-info');
        if (infoEl) infoEl.textContent = landscapePaused ? '⏸ Pausiert' : '';
    }

    function setBallSpeed(val) {
        ballSpeedMultiplier = parseInt(val) / 10;
    }

    // ═══════════════════════════════════════════════════════════════
    // FORWARD-VIZ: Animiertes Netz-Diagramm
    // ═══════════════════════════════════════════════════════════════

    function initForwardViz() {
        const container = document.getElementById('bp-forward-viz');
        if (!container) return;

        const layers = [
            { name: 'Input', neurons: 3, color: '#64748b' },
            { name: 'Hidden 1', neurons: 4, color: '#3b82f6' },
            { name: 'Hidden 2', neurons: 4, color: '#6366f1' },
            { name: 'Output', neurons: 2, color: '#10b981' }
        ];

        let html = '<svg width="100%" height="200" viewBox="0 0 700 200" style="max-width:700px;">';
        const layerX = [80, 250, 420, 600];

        for (let l = 0; l < layers.length - 1; l++) {
            const curr = layers[l], next = layers[l + 1];
            const currY = Array.from({ length: curr.neurons }, (_, i) => 100 - ((curr.neurons - 1) * 22) + i * 44);
            const nextY = Array.from({ length: next.neurons }, (_, i) => 100 - ((next.neurons - 1) * 22) + i * 44);
            for (const cy of currY) {
                for (const ny of nextY) {
                    html += `<line x1="${layerX[l]}" y1="${cy}" x2="${layerX[l + 1]}" y2="${ny}" stroke="#cbd5e1" stroke-width="1" opacity="0.5"/>`;
                }
            }
        }

        for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            const positions = Array.from({ length: layer.neurons }, (_, i) => 100 - ((layer.neurons - 1) * 22) + i * 44);
            for (const y of positions) {
                html += `<circle cx="${layerX[l]}" cy="${y}" r="14" fill="white" stroke="${layer.color}" stroke-width="2.5"/>`;
            }
            html += `<text x="${layerX[l]}" y="195" text-anchor="middle" font-size="11" fill="${layer.color}" font-weight="bold">${layer.name}</text>`;
        }

        for (let l = 0; l < layers.length - 1; l++) {
            const midX = (layerX[l] + layerX[l + 1]) / 2;
            html += `<text x="${midX}" y="16" text-anchor="middle" font-size="10" fill="#94a3b8">W×x + b → σ</text>`;
        }

        html += '</svg>';
        container.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    // FORWARD/BACKWARD FLOW ANIMATION
    // ═══════════════════════════════════════════════════════════════

    function initFlowAnimation() {
        const canvas = document.getElementById('bp-flow-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = Math.max(rect.height, 340) * dpr;
        canvas.style.height = '340px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 340;

        const layers = [
            { x: 0.1, label: 'Input\nx', color: '#64748b' },
            { x: 0.3, label: 'Layer 1\nW₁x+b₁', color: '#3b82f6' },
            { x: 0.5, label: 'Layer 2\nW₂h₁+b₂', color: '#6366f1' },
            { x: 0.7, label: 'Output\nŷ', color: '#10b981' },
            { x: 0.9, label: 'Loss\nE(ŷ,y)', color: '#ef4444' }
        ];

        function drawBase() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < layers.length - 1; i++) {
                ctx.beginPath();
                ctx.moveTo(layers[i].x * W + 40, H / 2);
                ctx.lineTo(layers[i + 1].x * W - 40, H / 2);
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            layers.forEach(l => {
                const x = l.x * W, y = H / 2;
                ctx.beginPath();
                ctx.arc(x, y, 35, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = l.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = l.color;
                ctx.font = 'bold 11px system-ui';
                ctx.textAlign = 'center';
                const lines = l.label.split('\n');
                lines.forEach((line, idx) => {
                    ctx.fillText(line, x, y - 6 + idx * 14);
                });
            });
        }

        function drawSignal(progress, direction, color) {
            drawBase();
            const startIdx = direction === 'forward' ? 0 : layers.length - 1;
            const sign = direction === 'forward' ? 1 : -1;
            const totalDist = layers.length - 1;
            const currentPos = startIdx + sign * progress * totalDist;

            const floorIdx = Math.max(0, Math.min(layers.length - 1, Math.floor(currentPos)));
            const ceilIdx = Math.max(0, Math.min(layers.length - 1, Math.ceil(currentPos)));
            const frac = currentPos - Math.floor(currentPos);
            const ballX = layers[floorIdx].x * W + (layers[ceilIdx].x * W - layers[floorIdx].x * W) * frac;

            const glow = ctx.createRadialGradient(ballX, H / 2, 0, ballX, H / 2, 25);
            glow.addColorStop(0, color + 'aa');
            glow.addColorStop(1, color + '00');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ballX, H / 2, 25, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(ballX, H / 2, 10, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = color;
            ctx.font = 'bold 13px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(direction === 'forward' ? '→ Daten fließen vorwärts' : '← Fehler fließt rückwärts', W / 2, 30);
        }

        flowState.draw = drawBase;
        flowState.drawSignal = drawSignal;
        drawBase();
    }

    function animateForward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) { flowState.drawSignal(1, 'forward', '#10b981'); return; }
            flowState.drawSignal(flowState.t, 'forward', '#10b981');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function animateBackward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) { flowState.drawSignal(1, 'backward', '#ef4444'); return; }
            flowState.drawSignal(flowState.t, 'backward', '#ef4444');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetFlow() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        if (flowState.draw) flowState.draw();
    }

    // ═══════════════════════════════════════════════════════════════
    // CHAIN RULE VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    let chainLayers = [0.9, 0.85, 0.9, 0.1];

    function drawChainViz() {
        const canvas = document.getElementById('bp-chain-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 280 * dpr;
        canvas.style.height = '280px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 280;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const n = chainLayers.length;
        const boxW = Math.min(80, (W - 60) / (n + 1));
        const gap = (W - boxW * (n + 1)) / (n + 2);
        let product = 1;

        for (let i = 0; i < n; i++) {
            const x = gap + i * (boxW + gap);
            const y = H / 2 - 30;
            const val = chainLayers[i];
            product *= val;

            const hue = val > 0.5 ? 120 : val > 0.2 ? 40 : 0;
            const sat = 70;
            const light = 85 - val * 30;

            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
            ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${light - 20}%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, boxW, 60, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 11px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`Layer ${i + 1}`, x + boxW / 2, y + 22);
            ctx.font = '13px system-ui';
            ctx.fillText(`∂ = ${val.toFixed(2)}`, x + boxW / 2, y + 42);

            if (i < n - 1) {
                const arrowX = x + boxW + gap / 2;
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 16px system-ui';
                ctx.fillText('×', arrowX, H / 2 + 2);
            }
        }

        const resX = gap + n * (boxW + gap);
        const resY = H / 2 - 30;
        const isVanishing = product < 0.01;
        ctx.fillStyle = isVanishing ? '#fee2e2' : '#dcfce7';
        ctx.strokeStyle = isVanishing ? '#ef4444' : '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(resX, resY, boxW + 10, 60, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isVanishing ? '#991b1b' : '#166534';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Gradient', resX + (boxW + 10) / 2, resY + 22);
        ctx.font = 'bold 13px system-ui';
        ctx.fillText(product.toExponential(2), resX + (boxW + 10) / 2, resY + 42);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px system-ui';
        ctx.fillText('=', resX - gap / 2, H / 2 + 2);

        const resultEl = document.getElementById('bp-chain-result');
        if (resultEl) {
            const emoji = isVanishing ? '💀' : product < 0.1 ? '⚠️' : '✅';
            resultEl.innerHTML = `${emoji} Gesamtgradient: <span style="color:${isVanishing ? '#ef4444' : '#10b981'}">${product.toExponential(3)}</span> (${n} Schichten)`;
        }
    }

    function chainAddLayer() {
        if (chainLayers.length >= 12) return;
        chainLayers.push(0.7 + Math.random() * 0.25);
        drawChainViz();
    }

    function chainRemoveLayer() {
        if (chainLayers.length <= 2) return;
        chainLayers.pop();
        drawChainViz();
    }

    // ═══════════════════════════════════════════════════════════════
    // WEIGHT UPDATE / GRADIENT DESCENT 2D VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    function loss1D(x) {
        return 0.5 * (x - 1) * (x - 1) + 0.3 * Math.sin(x * 2) + 0.1 * (x + 1) * (x + 1) * 0.05;
    }

    function gradLoss1D(x) {
        const eps = 0.001;
        return (loss1D(x + eps) - loss1D(x - eps)) / (2 * eps);
    }

    function drawGDViz() {
        const canvas = document.getElementById('bp-update-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 320 * dpr;
        canvas.style.height = '320px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 320;

        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#f8fafc');
        bg.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const xMin = -2, xMax = 5;
        const padding = 40;
        const plotW = W - 2 * padding;
        const plotH = H - 80;

        let yMin = Infinity, yMax = -Infinity;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }
        yMin -= 0.5; yMax += 0.5;

        function toScreen(x, y) {
            return {
                sx: padding + ((x - xMin) / (xMax - xMin)) * plotW,
                sy: padding + (1 - (y - yMin) / (yMax - yMin)) * plotH
            };
        }

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
            const { sx } = toScreen(gx, 0);
            ctx.beginPath(); ctx.moveTo(sx, padding); ctx.lineTo(sx, padding + plotH); ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(gx.toString(), sx, padding + plotH + 14);
        }

        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            const { sx, sy } = toScreen(x, y);
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        const lastX = xMin + ((plotW - 1) / plotW) * (xMax - xMin);
        const { sx: lastSx } = toScreen(lastX, loss1D(lastX));
        ctx.lineTo(lastSx, padding + plotH);
        const { sx: firstSx } = toScreen(xMin, 0);
        ctx.lineTo(firstSx, padding + plotH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
        ctx.fill();

        if (gdState.history.length > 1) {
            for (let i = 1; i < gdState.history.length; i++) {
                const p0 = toScreen(gdState.history[i - 1], loss1D(gdState.history[i - 1]));
                const p1 = toScreen(gdState.history[i], loss1D(gdState.history[i]));
                ctx.beginPath();
                ctx.moveTo(p0.sx, p0.sy);
                ctx.lineTo(p1.sx, p1.sy);
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + 0.7 * (i / gdState.history.length)})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        const { sx: bx, sy: by } = toScreen(gdState.x, loss1D(gdState.x));
        const grad = gradLoss1D(gdState.x);
        const lr = parseFloat(document.getElementById('bp-lr-slider')?.value || 10) / 100;
        const arrowLen = Math.min(80, Math.abs(grad * lr) * 60);
        const arrowDir = grad > 0 ? -1 : 1;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + arrowDir * arrowLen, by);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + arrowDir * arrowLen, by);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by - 5);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by + 5);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 18);
        glow.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`w = ${gdState.x.toFixed(3)}`, padding, 20);
        ctx.fillText(`Loss = ${loss1D(gdState.x).toFixed(4)}`, padding + 130, 20);
        ctx.fillText(`∇ = ${grad.toFixed(4)}`, padding + 290, 20);
        ctx.fillStyle = '#6366f1';
        ctx.fillText(`η = ${lr.toFixed(2)}`, padding + 420, 20);
    }

    function autoGD() {
        if (gdState.running) {
            gdState.running = false;
            if (gdState.raf) cancelAnimationFrame(gdState.raf);
            return;
        }
        gdState.running = true;
        let count = 0;
        function step() {
            if (!gdState.running || count > 200) {
                gdState.running = false;
                return;
            }
            stepGD();
            count++;
            gdState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetGD() {
        gdState.running = false;
        if (gdState.raf) cancelAnimationFrame(gdState.raf);
        gdState.x = 3.5;
        gdState.history = [3.5];
        drawGDViz();
    }

    // ═══════════════════════════════════════════════════════════════
    // LOSS LANDSCAPE – Speed-Control, Pause, Respawn (public helpers)
    // ═══════════════════════════════════════════════════════════════

    let lossLandscapeRespawnRequested = false;

    function respawnBall() {
        lossLandscapeRespawnRequested = true;
    }

    function toggleLandscapePause() {
        landscapePaused = !landscapePaused;
        const infoEl = document.getElementById('bp-loss-info');
        if (infoEl) infoEl.textContent = landscapePaused ? '⏸ Pausiert' : '';
    }

    function setBallSpeed(val) {
        ballSpeedMultiplier = parseInt(val) / 10;
    }

    // ═══════════════════════════════════════════════════════════════
    // FORWARD-VIZ: Animiertes Netz-Diagramm
    // ═══════════════════════════════════════════════════════════════

    function initForwardViz() {
        const container = document.getElementById('bp-forward-viz');
        if (!container) return;

        const layers = [
            { name: 'Input', neurons: 3, color: '#64748b' },
            { name: 'Hidden 1', neurons: 4, color: '#3b82f6' },
            { name: 'Hidden 2', neurons: 4, color: '#6366f1' },
            { name: 'Output', neurons: 2, color: '#10b981' }
        ];

        let html = '<svg width="100%" height="200" viewBox="0 0 700 200" style="max-width:700px;">';
        const layerX = [80, 250, 420, 600];

        for (let l = 0; l < layers.length - 1; l++) {
            const curr = layers[l], next = layers[l + 1];
            const currY = Array.from({ length: curr.neurons }, (_, i) => 100 - ((curr.neurons - 1) * 22) + i * 44);
            const nextY = Array.from({ length: next.neurons }, (_, i) => 100 - ((next.neurons - 1) * 22) + i * 44);
            for (const cy of currY) {
                for (const ny of nextY) {
                    html += `<line x1="${layerX[l]}" y1="${cy}" x2="${layerX[l + 1]}" y2="${ny}" stroke="#cbd5e1" stroke-width="1" opacity="0.5"/>`;
                }
            }
        }

        for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            const positions = Array.from({ length: layer.neurons }, (_, i) => 100 - ((layer.neurons - 1) * 22) + i * 44);
            for (const y of positions) {
                html += `<circle cx="${layerX[l]}" cy="${y}" r="14" fill="white" stroke="${layer.color}" stroke-width="2.5"/>`;
            }
            html += `<text x="${layerX[l]}" y="195" text-anchor="middle" font-size="11" fill="${layer.color}" font-weight="bold">${layer.name}</text>`;
        }

        for (let l = 0; l < layers.length - 1; l++) {
            const midX = (layerX[l] + layerX[l + 1]) / 2;
            html += `<text x="${midX}" y="16" text-anchor="middle" font-size="10" fill="#94a3b8">W×x + b → σ</text>`;
        }

        html += '</svg>';
        container.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    // ACTIVATION FUNCTION MINI-PLOTS
    // ═══════════════════════════════════════════════════════════════

    function initActivationViz() {
        const container = document.getElementById('bp-activation-viz');
        if (!container) return;

        const functions = [
            { name: 'ReLU', fn: x => Math.max(0, x), color: '#3b82f6' },
            { name: 'Sigmoid', fn: x => 1 / (1 + Math.exp(-x)), color: '#10b981' },
            { name: 'Tanh', fn: x => Math.tanh(x), color: '#6366f1' }
        ];

        let html = '';
        functions.forEach(f => {
            html += `<div style="flex:1; min-width:150px; max-width:220px;">
                <canvas id="bp-act-${f.name}" width="200" height="140" style="width:100%; height:auto; border:1px solid #e2e8f0; border-radius:8px; background:#fff;"></canvas>
                <div style="text-align:center; font-weight:bold; font-size:0.85em; color:${f.color}; margin-top:4px;">${f.name}</div>
            </div>`;
        });
        container.innerHTML = html;

        functions.forEach(f => {
            const canvas = document.getElementById(`bp-act-${f.name}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
            ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = f.color;
            ctx.lineWidth = 3;
            for (let px = 0; px < W; px++) {
                const x = (px / W) * 8 - 4;
                const y = f.fn(x);
                const py = H - ((y + 1.2) / 2.4) * H;
                if (px === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '9px system-ui';
            ctx.fillText('-4', 2, H / 2 - 4);
            ctx.fillText('4', W - 14, H / 2 - 4);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // FORWARD/BACKWARD FLOW ANIMATION
    // ═══════════════════════════════════════════════════════════════

    function initFlowAnimation() {
        const canvas = document.getElementById('bp-flow-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = Math.max(rect.height, 340) * dpr;
        canvas.style.height = '340px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 340;

        const layers = [
            { x: 0.1, label: 'Input\nx', color: '#64748b' },
            { x: 0.3, label: 'Layer 1\nW₁x+b₁', color: '#3b82f6' },
            { x: 0.5, label: 'Layer 2\nW₂h₁+b₂', color: '#6366f1' },
            { x: 0.7, label: 'Output\nŷ', color: '#10b981' },
            { x: 0.9, label: 'Loss\nE(ŷ,y)', color: '#ef4444' }
        ];

        function drawBase() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < layers.length - 1; i++) {
                ctx.beginPath();
                ctx.moveTo(layers[i].x * W + 40, H / 2);
                ctx.lineTo(layers[i + 1].x * W - 40, H / 2);
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            layers.forEach(l => {
                const x = l.x * W, y = H / 2;
                ctx.beginPath();
                ctx.arc(x, y, 35, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = l.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = l.color;
                ctx.font = 'bold 11px system-ui';
                ctx.textAlign = 'center';
                const lines = l.label.split('\n');
                lines.forEach((line, idx) => {
                    ctx.fillText(line, x, y - 6 + idx * 14);
                });
            });
        }

        function drawSignal(progress, direction, color) {
            drawBase();
            const startIdx = direction === 'forward' ? 0 : layers.length - 1;
            const sign = direction === 'forward' ? 1 : -1;
            const totalDist = layers.length - 1;
            const currentPos = startIdx + sign * progress * totalDist;

            const floorIdx = Math.max(0, Math.min(layers.length - 1, Math.floor(currentPos)));
            const ceilIdx = Math.max(0, Math.min(layers.length - 1, Math.ceil(currentPos)));
            const frac = currentPos - Math.floor(currentPos);
            const ballX = layers[floorIdx].x * W + (layers[ceilIdx].x * W - layers[floorIdx].x * W) * frac;

            const glow = ctx.createRadialGradient(ballX, H / 2, 0, ballX, H / 2, 25);
            glow.addColorStop(0, color + 'aa');
            glow.addColorStop(1, color + '00');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ballX, H / 2, 25, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(ballX, H / 2, 10, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = color;
            ctx.font = 'bold 13px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(direction === 'forward' ? '→ Daten fließen vorwärts' : '← Fehler fließt rückwärts', W / 2, 30);
        }

        flowState.draw = drawBase;
        flowState.drawSignal = drawSignal;
        drawBase();
    }

    function animateForward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) { flowState.drawSignal(1, 'forward', '#10b981'); return; }
            flowState.drawSignal(flowState.t, 'forward', '#10b981');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function animateBackward() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        function step() {
            flowState.t += 0.012;
            if (flowState.t >= 1) { flowState.drawSignal(1, 'backward', '#ef4444'); return; }
            flowState.drawSignal(flowState.t, 'backward', '#ef4444');
            flowState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetFlow() {
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
        flowState.t = 0;
        if (flowState.draw) flowState.draw();
    }

    // ═══════════════════════════════════════════════════════════════
    // CHAIN RULE VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    function chainAddLayer() {
        if (chainLayers.length >= 12) return;
        chainLayers.push(0.7 + Math.random() * 0.25);
        drawChainViz();
    }

    function chainRemoveLayer() {
        if (chainLayers.length <= 2) return;
        chainLayers.pop();
        drawChainViz();
    }

    function chainReset() {
        chainLayers = [0.9, 0.85, 0.9, 0.1];
        drawChainViz();
    }

    // ═══════════════════════════════════════════════════════════════
    // WEIGHT UPDATE / GRADIENT DESCENT 2D VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    let gdState = { x: 3.5, history: [3.5], running: false, raf: null };

    function loss1D(x) {
        return 0.5 * (x - 1) * (x - 1) + 0.3 * Math.sin(x * 2) + 0.1 * (x + 1) * (x + 1) * 0.05;
    }

    function gradLoss1D(x) {
        const eps = 0.001;
        return (loss1D(x + eps) - loss1D(x - eps)) / (2 * eps);
    }

    function drawGDViz() {
        const canvas = document.getElementById('bp-update-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 320 * dpr;
        canvas.style.height = '320px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 320;

        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#f8fafc');
        bg.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const xMin = -2, xMax = 5;
        const padding = 40;
        const plotW = W - 2 * padding;
        const plotH = H - 80;

        let yMin = Infinity, yMax = -Infinity;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }
        yMin -= 0.5; yMax += 0.5;

        function toScreen(x, y) {
            return {
                sx: padding + ((x - xMin) / (xMax - xMin)) * plotW,
                sy: padding + (1 - (y - yMin) / (yMax - yMin)) * plotH
            };
        }

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
            const { sx } = toScreen(gx, 0);
            ctx.beginPath(); ctx.moveTo(sx, padding); ctx.lineTo(sx, padding + plotH); ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
            ctx.fillText(gx.toString(), sx, padding + plotH + 14);
        }

        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        for (let px = 0; px < plotW; px++) {
            const x = xMin + (px / plotW) * (xMax - xMin);
            const y = loss1D(x);
            const { sx, sy } = toScreen(x, y);
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        const lastX = xMin + ((plotW - 1) / plotW) * (xMax - xMin);
        const { sx: lastSx } = toScreen(lastX, loss1D(lastX));
        ctx.lineTo(lastSx, padding + plotH);
        const { sx: firstSx } = toScreen(xMin, 0);
        ctx.lineTo(firstSx, padding + plotH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
        ctx.fill();

        if (gdState.history.length > 1) {
            for (let i = 1; i < gdState.history.length; i++) {
                const p0 = toScreen(gdState.history[i - 1], loss1D(gdState.history[i - 1]));
                const p1 = toScreen(gdState.history[i], loss1D(gdState.history[i]));
                ctx.beginPath();
                ctx.moveTo(p0.sx, p0.sy);
                ctx.lineTo(p1.sx, p1.sy);
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + 0.7 * (i / gdState.history.length)})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        const { sx: bx, sy: by } = toScreen(gdState.x, loss1D(gdState.x));
        const grad = gradLoss1D(gdState.x);
        const lr = parseFloat(document.getElementById('bp-lr-slider')?.value || 10) / 100;
        const arrowLen = Math.min(80, Math.abs(grad * lr) * 60);
        const arrowDir = grad > 0 ? -1 : 1;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + arrowDir * arrowLen, by);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + arrowDir * arrowLen, by);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by - 5);
        ctx.lineTo(bx + arrowDir * (arrowLen - 8), by + 5);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 18);
        glow.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`w = ${gdState.x.toFixed(3)}`, padding, 20);
        ctx.fillText(`Loss = ${loss1D(gdState.x).toFixed(4)}`, padding + 130, 20);
        ctx.fillText(`∇ = ${grad.toFixed(4)}`, padding + 290, 20);
        ctx.fillStyle = '#6366f1';
        ctx.fillText(`η = ${lr.toFixed(2)}`, padding + 420, 20);
    }

    function updateLRViz() {
        const val = document.getElementById('bp-lr-slider')?.value || 10;
        const el = document.getElementById('bp-lr-val');
        if (el) el.textContent = (val / 100).toFixed(2);
        drawGDViz();
    }

    function stepGD() {
        const lr = parseFloat(document.getElementById('bp-lr-slider')?.value || 10) / 100;
        const grad = gradLoss1D(gdState.x);
        gdState.x -= lr * grad;
        gdState.x = Math.max(-2, Math.min(5, gdState.x));
        gdState.history.push(gdState.x);
        if (gdState.history.length > 50) gdState.history.shift();
        drawGDViz();
    }

    function autoGD() {
        if (gdState.running) {
            gdState.running = false;
            if (gdState.raf) cancelAnimationFrame(gdState.raf);
            return;
        }
        gdState.running = true;
        let count = 0;
        function step() {
            if (!gdState.running || count > 200) {
                gdState.running = false;
                return;
            }
            stepGD();
            count++;
            gdState.raf = requestAnimationFrame(step);
        }
        step();
    }

    function resetGD() {
        gdState.running = false;
        if (gdState.raf) cancelAnimationFrame(gdState.raf);
        gdState.x = 3.5;
        gdState.history = [3.5];
        drawGDViz();
    }

    // ═══════════════════════════════════════════════════════════════
    // VANISHING GRADIENT VISUALIZATION
    // ═══════════════════════════════════════════════════════════════

    function updateVanishViz() {
        const depthEl = document.getElementById('bp-vanish-depth');
        const factorEl = document.getElementById('bp-vanish-factor');
        if (!depthEl || !factorEl) return;

        const depth = parseInt(depthEl.value);
        const factor = parseInt(factorEl.value) / 100;

        document.getElementById('bp-vanish-depth-val').textContent = depth;
        document.getElementById('bp-vanish-factor-val').textContent = factor.toFixed(2);

        const canvas = document.getElementById('bp-vanish-canvas');
        if (!canvas) return;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 220 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 220;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const padding = 50;
        const barW = Math.min(20, (W - 2 * padding) / depth - 2);
        const totalBarW = depth * (barW + 2);
        const startX = (W - totalBarW) / 2;

        let gradient = 1.0;
        const maxBarH = H - 80;

        for (let i = 0; i < depth; i++) {
            const x = startX + i * (barW + 2);
            const barH = Math.max(1, gradient * maxBarH);
            const y = H - 40 - barH;

            const hue = Math.max(0, Math.min(120, gradient * 120));
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(x, y, barW, barH);

            if (depth <= 20 || i % Math.ceil(depth / 20) === 0) {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '8px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(`${i + 1}`, x + barW / 2, H - 26);
            }

            gradient *= factor;
        }

        ctx.fillStyle = '#64748b';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Schicht →', W / 2, H - 8);
        ctx.textAlign = 'left';
        ctx.fillText('Gradient-Stärke ↑', 8, 16);

        const finalGrad = Math.pow(factor, depth);
        const resultEl = document.getElementById('bp-vanish-result');
        if (resultEl) {
            const emoji = finalGrad < 0.001 ? '💀' : finalGrad < 0.1 ? '⚠️' : '✅';
            resultEl.innerHTML = `${emoji} Gradient nach ${depth} Schichten: <b style="color:${finalGrad < 0.01 ? '#ef4444' : '#10b981'}">${finalGrad.toExponential(2)}</b> (Faktor ${factor}^${depth})`;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LOSS LANDSCAPE – Speed-Control, Pause, Respawn (public helpers)
    // ═══════════════════════════════════════════════════════════════

    function respawnBall() {
        lossLandscapeRespawnRequested = true;
    }

    function toggleLandscapePause() {
        landscapePaused = !landscapePaused;
        const infoEl = document.getElementById('bp-loss-info');
        if (infoEl) infoEl.textContent = landscapePaused ? '⏸ Pausiert' : '';
    }

    function setBallSpeed(val) {
        ballSpeedMultiplier = parseInt(val) / 10;
    }

    // ═══════════════════════════════════════════════════════════════
    // RESNET CONCEPT DIAGRAM (SVG)
    // ═══════════════════════════════════════════════════════════════

    function initResnetConcept() {
        const container = document.getElementById('bp-resnet-concept');
        if (!container) return;

        const W = container.clientWidth || 600;
        const H = 250;

        let svg = `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible;">
        <defs>
            <marker id="bp-arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6"/>
            </marker>
            <marker id="bp-arr-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/>
            </marker>
        </defs>`;

        const cx = W / 2;

        svg += `<rect x="${cx - 200}" y="100" width="80" height="50" rx="10" fill="#f1f5f9" stroke="#64748b" stroke-width="2"/>`;
        svg += `<text x="${cx - 160}" y="130" text-anchor="middle" font-size="14" font-weight="bold" fill="#334155">x</text>`;

        svg += `<rect x="${cx - 60}" y="100" width="120" height="50" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>`;
        svg += `<text x="${cx}" y="122" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">F(x)</text>`;
        svg += `<text x="${cx}" y="140" text-anchor="middle" font-size="10" fill="#64748b">Conv → BN → ReLU</text>`;

        svg += `<circle cx="${cx + 130}" cy="125" r="18" fill="#dcfce7" stroke="#10b981" stroke-width="2.5"/>`;
        svg += `<text x="${cx + 130}" y="131" text-anchor="middle" font-size="20" font-weight="bold" fill="#166534">+</text>`;

        svg += `<rect x="${cx + 170}" y="100" width="80" height="50" rx="10" fill="#f0fdf4" stroke="#10b981" stroke-width="2"/>`;
        svg += `<text x="${cx + 210}" y="125" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">F(x) + x</text>`;
        svg += `<text x="${cx + 210}" y="142" text-anchor="middle" font-size="10" fill="#64748b">= y</text>`;

        svg += `<line x1="${cx - 120}" y1="125" x2="${cx - 62}" y2="125" stroke="#94a3b8" stroke-width="2" marker-end="url(#bp-arr2)"/>`;
        svg += `<line x1="${cx + 60}" y1="125" x2="${cx + 110}" y2="125" stroke="#3b82f6" stroke-width="2" marker-end="url(#bp-arr2)"/>`;
        svg += `<line x1="${cx + 148}" y1="125" x2="${cx + 168}" y2="125" stroke="#10b981" stroke-width="2" marker-end="url(#bp-arr2)"/>`;

        svg += `<path d="M ${cx - 160} 100 Q ${cx - 160} 50, ${cx - 20} 50 Q ${cx + 100} 50, ${cx + 130} 107" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="6,4" marker-end="url(#bp-arr-gold)"/>`;
        svg += `<text x="${cx - 20}" y="40" text-anchor="middle" font-size="12" font-weight="bold" fill="#f59e0b">Identity Shortcut (x)</text>`;

        svg += `<text x="${cx}" y="185" text-anchor="middle" font-size="11" fill="#64748b">Das Netz lernt nur die Abweichung F(x) = H(x) − x</text>`;
        svg += `<text x="${cx}" y="205" text-anchor="middle" font-size="11" fill="#64748b">Wenn F(x) ≈ 0, dann y ≈ x (Identity-Funktion)</text>`;

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    // ═══════════════════════════════════════════════════════════════
    // 3D LOSS LANDSCAPE – Überarbeitet (schneller, schöner, mit Controls)
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

        lossLandscapeRunning = false;
        if (lossLandscapeRAF) cancelAnimationFrame(lossLandscapeRAF);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        function lossFunc(x, y) {
            const g1 = -1.2 * Math.exp(-((x - 1.2) ** 2 + (y - 0.8) ** 2) / 0.8);
            const g2 = -1.8 * Math.exp(-((x + 0.8) ** 2 + (y + 0.5) ** 2) / 0.6);
            const g3 = -0.5 * Math.exp(-((x - 0.2) ** 2 + (y - 1.5) ** 2) / 1.0);
            const base = 0.08 * (x * x + y * y);
            const ripple = 0.04 * Math.sin(x * 2.5) * Math.cos(y * 2.5);
            return g1 + g2 + g3 + base + ripple;
        }

        const gridRes = 45;
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

        let camRotY = 0.7, camTilt = 0.5, camZoom = 1.0;
        let targetRotY = 0.7, targetTilt = 0.5, targetZoom = 1.0;

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

        let ball = { x: 2.0, y: 2.0, vx: 0, vy: 0, trail: [], arrived: false, restartTimer: 0 };

        function doRespawnBall() {
            const angle = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * 1.0;
            ball.x = Math.cos(angle) * r;
            ball.y = Math.sin(angle) * r;
            ball.vx = 0; ball.vy = 0;
            ball.trail = []; ball.arrived = false; ball.restartTimer = 0;
        }

        let isDragging = false, lastMX = 0, lastMY = 0;

        canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMX = e.clientX; lastMY = e.clientY; });
        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            targetRotY += (e.clientX - lastMX) * 0.005;
            targetTilt += (e.clientY - lastMY) * 0.003;
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
        canvas.addEventListener('dblclick', () => doRespawnBall());

        let touchStartDist = 0;
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) { isDragging = true; lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY; }
            else if (e.touches.length === 2) {
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                touchStartDist = Math.sqrt(dx * dx + dy * dy);
            }
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                targetRotY += (e.touches[0].clientX - lastMX) * 0.005;
                targetTilt += (e.touches[0].clientY - lastMY) * 0.003;
                targetTilt = Math.max(0.2, Math.min(1.0, targetTilt));
                lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (touchStartDist > 0) { targetZoom *= dist / touchStartDist; targetZoom = Math.max(0.5, Math.min(2.5, targetZoom)); }
                touchStartDist = dist;
            }
        });
        canvas.addEventListener('touchend', () => { isDragging = false; touchStartDist = 0; });

        function gradLoss(x, y) {
            const eps = 0.05;
            return {
                dx: (lossFunc(x + eps, y) - lossFunc(x - eps, y)) / (2 * eps),
                dy: (lossFunc(x, y + eps) - lossFunc(x, y - eps)) / (2 * eps)
            };
        }

        // === Animation loop ===
        let t = 0;
        lossLandscapeRunning = true;

        function animate() {
            if (!lossLandscapeRunning) return;
            t++;

            // Check respawn request
            if (lossLandscapeRespawnRequested) {
                doRespawnBall();
                lossLandscapeRespawnRequested = false;
            }

            // Smooth camera
            camRotY += (targetRotY - camRotY) * 0.06;
            camTilt += (targetTilt - camTilt) * 0.06;
            camZoom += (targetZoom - camZoom) * 0.08;

            // Auto-rotate when not dragging
            if (!isDragging) targetRotY += 0.0008;

            // Update ball physics (with speed control and pause)
            if (!landscapePaused && !ball.arrived) {
                const grad = gradLoss(ball.x, ball.y);
                const lr = 0.008 * ballSpeedMultiplier;
                const momentum = 0.94;
                ball.vx = momentum * ball.vx - lr * grad.dx;
                ball.vy = momentum * ball.vy - lr * grad.dy;
                ball.x += ball.vx;
                ball.y += ball.vy;

                ball.x = Math.max(-range + 0.1, Math.min(range - 0.1, ball.x));
                ball.y = Math.max(-range + 0.1, Math.min(range - 0.1, ball.y));

                ball.trail.push({ x: ball.x, y: ball.y });
                if (ball.trail.length > 400) ball.trail.shift();

                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (speed < 0.0003 && t > 100) {
                    ball.arrived = true;
                    ball.restartTimer = 180;
                }
            } else if (ball.arrived) {
                ball.restartTimer--;
                if (ball.restartTimer <= 0) doRespawnBall();
            }

            // === RENDER ===
            ctx.clearRect(0, 0, W, H);

            // Background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // === Draw terrain ===
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

                const r = Math.round(40 + normalizedH * 200);
                const g = Math.round(20 + (1 - normalizedH) * 100 + normalizedH * 60);
                const b2 = Math.round(180 - normalizedH * 140);

                const dx = (q.corners[1].h - q.corners[0].h);
                const dy = (q.corners[3].h - q.corners[0].h);
                const light = Math.max(0.5, Math.min(1.4, 1.0 + dx * 3.0 - dy * 1.5));

                ctx.beginPath();
                ctx.moveTo(projCorners[0].sx, projCorners[0].sy);
                ctx.lineTo(projCorners[1].sx, projCorners[1].sy);
                ctx.lineTo(projCorners[2].sx, projCorners[2].sy);
                ctx.lineTo(projCorners[3].sx, projCorners[3].sy);
                ctx.closePath();
                ctx.fillStyle = `rgba(${Math.min(255, Math.round(r * light))}, ${Math.min(255, Math.round(g * light))}, ${Math.min(255, Math.round(b2 * light))}, 0.9)`;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // === Ball trail ===
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

            // === Ball ===
            const ballH = lossFunc(ball.x, ball.y);
            const ballProj = project(ball.x, ball.y, ballH - 0.05);

            const glow = ctx.createRadialGradient(ballProj.sx, ballProj.sy, 0, ballProj.sx, ballProj.sy, 16);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ballProj.sx, ballProj.sy, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(ballProj.sx, ballProj.sy, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2.5;
            ctx.stroke();

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
            ctx.fillText('🖱 Ziehen = Drehen · Scroll = Zoom · Doppelklick = Respawn', W - 12, H - 12);

            lossLandscapeRAF = requestAnimationFrame(animate);
        }

        animate();
    }

    // ═══════════════════════════════════════════════════════════════
    // GRADIENT COMPARISON PLOT (Plain vs ResNet)
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
            gPlain *= 0.88;
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

    function initResnetComparison(customDepth) {
        const div = document.getElementById('resnet-gradient-comparison');
        if (!div || typeof Plotly === 'undefined') return;

        const depth = customDepth || parseInt(document.getElementById('bp-resnet-depth')?.value || 50);
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
    // NEURAL NET TIMELINE
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
            marker: { size: 14, color: events.map(e => e.color), line: { width: 2, color: '#fff' } },
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
            shapes: [{ type: 'line', x0: 1940, x1: 2025, y0: 1, y1: 1, line: { color: '#e2e8f0', width: 2 } }]
        }, { displayModeBar: false, responsive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // RESNET ARCHITECTURE DIAGRAM (SVG)
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

        for (let i = 0; i < nodes.length - 1; i++) {
            svg += `<line x1="${nodes[i].x + 30}" y1="${nodes[i].y}" x2="${nodes[i + 1].x - 30}" y2="${nodes[i + 1].y}" stroke="#94a3b8" stroke-width="2" marker-end="url(#bp-arrow)"/>`;
        }

        svg += `<path d="M ${nodes[0].x} ${nodes[0].y - 25} Q ${(nodes[0].x + nodes[4].x) / 2} ${nodes[0].y - 70} ${nodes[4].x} ${nodes[4].y - 25}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="6,3" marker-end="url(#bp-arrow)"/>`;
        svg += `<text x="${(nodes[0].x + nodes[4].x) / 2}" y="${nodes[0].y - 72}" text-anchor="middle" font-size="11" fill="#f59e0b" font-weight="bold">Identity Shortcut (x)</text>`;
        svg += `<text x="${nodes[4].x - 40}" y="${nodes[4].y - 10}" font-size="18" fill="#6366f1" font-weight="bold">+</text>`;

        nodes.forEach(n => {
            svg += `<rect x="${n.x - 28}" y="${n.y - 18}" width="56" height="36" rx="8" fill="white" stroke="${n.color}" stroke-width="2"/>`;
            svg += `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="11" fill="${n.color}" font-weight="bold">${n.label}</text>`;
        });

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEMML RENDERING for math-display elements (1:1 übernommen)
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
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    function initAll() {
        renderTemml();
        setTimeout(() => {
            initForwardViz();
            initActivationViz();
            initFlowAnimation();
            drawChainViz();
            drawGDViz();
            updateVanishViz();
            initResnetConcept();
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
        if (gdState.raf) cancelAnimationFrame(gdState.raf);
        if (flowState.raf) cancelAnimationFrame(flowState.raf);
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
        renderTemml,
        // Neue Public-Methoden:
        animateForward,
        animateBackward,
        resetFlow,
        chainAddLayer,
        chainRemoveLayer,
        chainReset,
        stepGD,
        autoGD,
        resetGD,
        updateLRViz,
        updateVanishViz,
        respawnBall,
        toggleLandscapePause,
        setBallSpeed,
        initForwardViz,
        initActivationViz,
        initFlowAnimation,
        initResnetConcept,
        drawChainViz,
        drawGDViz
    };

})(); // end BPSlides IIFE


// ═══════════════════════════════════════════════════════════════════
// AUTO-INIT: Hook into existing Presentation engine
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => BPSlides.renderTemml(), 200);

    const observer = new MutationObserver(() => {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return;
        const title = activeSlide.getAttribute('data-title') || '';

        if (title.includes('Backpropagation') && title.includes('Überblick')) {
            setTimeout(() => { BPSlides.initForwardViz(); BPSlides.initActivationViz(); }, 100);
        } else if (title.includes('Forward & Backward Pass')) {
            setTimeout(() => BPSlides.initFlowAnimation(), 100);
        } else if (title.includes('Kettenregel')) {
            setTimeout(() => BPSlides.drawChainViz(), 100);
        } else if (title.includes('Gewichts-Update')) {
            setTimeout(() => BPSlides.drawGDViz(), 100);
        } else if (title.includes('Loss Landscape') || title.includes('Loss-Landschaft')) {
            setTimeout(() => BPSlides.initLossLandscape(), 100);
        } else if (title.includes('Vanishing Gradient')) {
            setTimeout(() => BPSlides.updateVanishViz(), 100);
        } else if (title.includes('Residual Networks')) {
            setTimeout(() => BPSlides.initResnetConcept(), 100);
        } else if (title.includes('Gradient Explorer')) {
            setTimeout(() => BPSlides.updateGradientPlot(), 100);
        } else if (title.includes('Signal: Plain vs ResNet')) {
            setTimeout(() => BPSlides.initResnetComparison(), 100);
        } else if (title.includes('Geschichte: Neuronale Netze')) {
            setTimeout(() => BPSlides.initNNTimeline(), 100);
        } else if (title.includes('ResNet Architektur')) {
            setTimeout(() => BPSlides.initResnetArchDiagram(), 100);
        }

        BPSlides.renderTemml();
    });

    const presentation = document.getElementById('presentation');
    if (presentation) {
        observer.observe(presentation, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
});
