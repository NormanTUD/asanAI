"use strict";

const _topologyLazyRegistry = [];
let _topologyLazyObserver = null;

function _topologyLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _topologyLazyRegistry.push({ el, initFn, initialized: false });
}

function _topologyLazyCreateObserver() {
    if (_topologyLazyObserver) return;

    _topologyLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _topologyLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _topologyLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin
    });

    _topologyLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _topologyLazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// TOPOLOGY MODULE
// ============================================================

// ── 1. Latent Space Manifold (Warp Surface) ──

function initTopologyVisualization() {
    const warpSlider = document.getElementById('topo-warp');
    const plotId = 'topology-plot';

    function render() {
        const warp = parseFloat(warpSlider.value);

        const xSize = 50;
        const ySize = 50;
        let zValues = [];
        let xValues = [];
        let yValues = [];

        for (let i = 0; i < xSize; i++) xValues.push(-2 + (4 * i / (xSize - 1)));
        for (let j = 0; j < ySize; j++) yValues.push(-2 + (4 * j / (ySize - 1)));

        for (let i = 0; i < xSize; i++) {
            let row = [];
            for (let j = 0; j < ySize; j++) {
                let x = xValues[i];
                let y = yValues[j];
                let r = Math.sqrt(x * x + y * y);

                // Multi-frequency manifold surface
                let z = 0;
                // Primary ripple (topology-preserving deformation)
                z += Math.sin(r * (1 + warp * 3)) * (1 / (1 + r * 0.3));
                // Secondary saddle component
                z += warp * 0.3 * (x * x - y * y) * 0.1;
                // Tertiary twist
                z += warp * 0.2 * Math.sin(x * 2) * Math.cos(y * 2) * 0.5;

                row.push(z);
            }
            zValues.push(row);
        }

        const data = [{
            z: zValues,
            x: xValues,
            y: yValues,
            type: 'surface',
            colorscale: [
                [0, 'rgba(99,102,241,0.85)'],
                [0.25, 'rgba(139,92,246,0.85)'],
                [0.5, 'rgba(236,72,153,0.85)'],
                [0.75, 'rgba(249,115,22,0.85)'],
                [1, 'rgba(245,158,11,0.85)']
            ],
            showscale: false,
            contours: {
                z: { show: true, usecolormap: true, project: { z: true }, highlightcolor: '#fff', highlightwidth: 1 }
            },
            lighting: {
                roughness: 0.6,
                fresnel: 0.2,
                specular: 0.8,
                diffuse: 0.8
            },
            opacity: 0.92
        }];

        const layout = {
            title: {
                text: 'Topological Manifold — Latent Space',
                font: { size: 14, color: '#475569' }
            },
            scene: {
                camera: { eye: { x: 1.6, y: 1.6, z: 1.0 } },
                xaxis: { title: 'Feature A', showgrid: true, gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' },
                yaxis: { title: 'Feature B', showgrid: true, gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' },
                zaxis: { title: 'Activation', range: [-1.8, 1.8], showgrid: true, gridcolor: '#f1f5f9' },
                bgcolor: '#fff'
            },
            margin: { t: 50, b: 0, l: 0, r: 0 }
        };

        if (typeof lazyRender === 'function') {
            lazyRender(plotId, () => Plotly.react(plotId, data, layout, { displayModeBar: false, responsive: true }));
        } else {
            Plotly.react(plotId, data, layout, { displayModeBar: false, responsive: true });
        }
    }

    if (warpSlider) {
        warpSlider.addEventListener('input', render);
        render();
    }
}

// ── 2. Helix–Turing Machine Visualization ──

const helixTuringState = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    numStates: 3,
    helixRadius: 0.6,
    rotX: -0.25,
    rotY: 0.6,
    dragging: false,
    lastMouse: null,
    running: false,
    animFrame: null,

    // Turing machine state
    tape: [],
    tapeSize: 21,
    headPos: 10,       // middle of tape
    currentState: 0,
    stepCount: 0,
    halted: false,
    maxSteps: 200,

    // Transition table: δ(state, symbol) → { newState, writeSymbol, direction }
    // Generated dynamically based on numStates
    transitions: {},

    // For 3D rendering
    helixPoints: [],
    currentHelixPoint: null,
    transitionArrows: []
};

function generateTuringTransitions(numStates) {
    // Generate a simple but non-trivial transition table
    // This implements a "binary increment" machine for small state counts
    // and a more complex "busy beaver"-like machine for larger counts
    const trans = {};
    const symbols = [0, 1];

    for (let q = 0; q < numStates; q++) {
        for (const s of symbols) {
            const key = `${q},${s}`;

            if (q === numStates - 1) {
                // Halt state — no transition
                trans[key] = { newState: q, write: s, dir: 0, halt: true };
                continue;
            }

            // Deterministic but interesting transitions
            // Cycle through states, flip bits, move in patterns
            const nextState = (q + s + 1) % numStates;
            const writeSym = 1 - s; // flip the bit
            const dir = (q % 2 === 0) ? 1 : -1; // alternate directions

            trans[key] = {
                newState: nextState,
                write: writeSym,
                dir: dir,
                halt: false
            };
        }
    }

    return trans;
}

function initHelixTuring() {
    const canvas = document.getElementById('canvas-helix-turing');
    if (!canvas) return;

    const st = helixTuringState;
    st.canvas = canvas;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        st.width = rect.width;
        st.height = rect.height;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        st.ctx = canvas.getContext('2d');
        st.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeCanvas();

    // Initialize tape
    st.tape = new Array(st.tapeSize).fill(0);
    // Seed some 1s near the head
    st.tape[9] = 1;
    st.tape[10] = 1;
    st.tape[11] = 0;
    st.tape[12] = 1;

    st.transitions = generateTuringTransitions(st.numStates);

    // Drag to rotate
    canvas.addEventListener('mousedown', e => {
        st.dragging = true;
        st.lastMouse = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', e => {
        if (st.dragging && st.lastMouse) {
            const dx = e.clientX - st.lastMouse.x;
            const dy = e.clientY - st.lastMouse.y;
            st.rotY += dx * 0.005;
            st.rotX += dy * 0.005;
            st.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rotX));
            st.lastMouse = { x: e.clientX, y: e.clientY };
            renderHelixTuring();
        }
    });

    canvas.addEventListener('mouseup', () => {
        st.dragging = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        st.dragging = false;
        canvas.style.cursor = 'grab';
    });

    // Touch support
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        st.dragging = true;
        st.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        if (st.dragging && st.lastMouse) {
            const dx = e.touches[0].clientX - st.lastMouse.x;
            const dy = e.touches[0].clientY - st.lastMouse.y;
            st.rotY += dx * 0.005;
            st.rotX += dy * 0.005;
            st.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rotX));
            st.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            renderHelixTuring();
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => { st.dragging = false; });

    // Sliders
    const statesSlider = document.getElementById('helix-num-states');
    const radiusSlider = document.getElementById('helix-tm-radius');

    if (statesSlider) {
        statesSlider.addEventListener('input', () => {
            st.numStates = parseInt(statesSlider.value);
            document.getElementById('helix-num-states-val').textContent = st.numStates;
            st.transitions = generateTuringTransitions(st.numStates);
            resetHelixTuringInternal();
            renderHelixTuring();
        });
    }
    if (radiusSlider) {
        radiusSlider.addEventListener('input', () => {
            st.helixRadius = parseFloat(radiusSlider.value);
            document.getElementById('helix-tm-radius-val').textContent = st.helixRadius.toFixed(2);
            renderHelixTuring();
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); renderHelixTuring(); }, 150);
    });

    renderHelixTuring();
}

function resetHelixTuringInternal() {
    const st = helixTuringState;
    st.tape = new Array(st.tapeSize).fill(0);
    st.tape[9] = 1;
    st.tape[10] = 1;
    st.tape[11] = 0;
    st.tape[12] = 1;
    st.headPos = 10;
    st.currentState = 0;
    st.stepCount = 0;
    st.halted = false;
    st.running = false;

    if (st.animFrame) {
        cancelAnimationFrame(st.animFrame);
        st.animFrame = null;
    }

    const statusEl = document.getElementById('helix-turing-status');
    if (statusEl) {
        statusEl.textContent = 'Ready — click Step or Run.';
        statusEl.style.color = '#64748b';
    }

    const runBtn = document.getElementById('helix-run-btn');
    if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }
}

window.resetHelixTuring = function () {
    resetHelixTuringInternal();
    renderHelixTuring();
};

function stepHelixTuringInternal() {
    const st = helixTuringState;
    if (st.halted || st.stepCount >= st.maxSteps) {
        st.halted = true;
        return false;
    }

    const symbol = st.tape[st.headPos] || 0;
    const key = `${st.currentState},${symbol}`;
    const trans = st.transitions[key];

    if (!trans || trans.halt) {
        st.halted = true;
        return false;
    }

    // Apply transition
    st.tape[st.headPos] = trans.write;
    st.currentState = trans.newState;
    st.headPos += trans.dir;

    // Extend tape if needed
    if (st.headPos < 0) {
        st.tape.unshift(0);
        st.headPos = 0;
        st.tapeSize++;
    }
    if (st.headPos >= st.tapeSize) {
        st.tape.push(0);
        st.tapeSize++;
    }

    st.stepCount++;
    return true;
}

window.stepHelixTuring = function () {
    const st = helixTuringState;
    if (st.running) return;

    const ok = stepHelixTuringInternal();
    renderHelixTuring();

    const statusEl = document.getElementById('helix-turing-status');
    if (statusEl) {
        if (st.halted) {
            statusEl.innerHTML = `⏹ <b>Halted</b> after ${st.stepCount} steps in state q${st.currentState}.`;
            statusEl.style.color = '#f59e0b';
        } else {
            statusEl.textContent = `Step ${st.stepCount}: state q${st.currentState}, head at position ${st.headPos}.`;
            statusEl.style.color = '#3b82f6';
        }
    }
};

window.runHelixTuring = function () {
    const st = helixTuringState;
    const runBtn = document.getElementById('helix-run-btn');

    if (st.running) {
        // Pause
        st.running = false;
        if (st.animFrame) cancelAnimationFrame(st.animFrame);
        if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }
        return;
    }

    if (st.halted) return;

    st.running = true;
    if (runBtn) { runBtn.textContent = '⏸ Pause'; runBtn.style.background = '#f59e0b'; }

    let lastTime = 0;
    const stepInterval = 300; // ms between steps

    function animate(now) {
        if (!st.running) return;

        if (now - lastTime >= stepInterval) {
            lastTime = now;
            const ok = stepHelixTuringInternal();
            renderHelixTuring();

            const statusEl = document.getElementById('helix-turing-status');
            if (st.halted) {
                st.running = false;
                if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }
                if (statusEl) {
                    statusEl.innerHTML = `⏹ <b>Halted</b> after ${st.stepCount} steps in state q${st.currentState}.`;
                    statusEl.style.color = '#f59e0b';
                }
                return;
            } else if (statusEl) {
                statusEl.textContent = `Running… Step ${st.stepCount}: state q${st.currentState}, head at ${st.headPos}.`;
                statusEl.style.color = '#10b981';
            }
        }

        st.animFrame = requestAnimationFrame(animate);
    }

    st.animFrame = requestAnimationFrame(animate);
};

// ── 3D Projection Helper ──

function helixProject3D(x, y, z, rotX, rotY, W, H) {
    // Rotate around Y axis
    let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
    let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
    let y1 = y;

    // Rotate around X axis
    let y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    let z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
    let x2 = x1;

    // Perspective
    const fov = 2.8;
    const scale = fov / (fov + z2 + 2);

    return {
        sx: W / 2 + x2 * scale * W * 0.3,
        sy: H / 2 - y2 * scale * H * 0.3,
        depth: z2,
        scale: scale
    };
}

// ── Main Render ──

window.renderHelixTuring = function () {
    const st = helixTuringState;
    if (!st.ctx) return;

    const ctx = st.ctx;
    const W = st.width;
    const H = st.height;
    const numStates = st.numStates;
    const radius = st.helixRadius;

    const showTransitions = document.getElementById('helix-show-transitions')?.checked ?? true;
    const showHelixThread = document.getElementById('helix-show-helix-thread')?.checked ?? true;
    const showShadow = document.getElementById('helix-show-shadow')?.checked ?? true;

    // ── Clear ──
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // ── Grid ──
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.12)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // ── Generate helix points for each tape position ──
    // Each tape cell gets a position along the helix.
    // The angular position encodes the state; the linear axis encodes tape position.
    const tapeLen = st.tapeSize;
    const helixPoints = []; // { tapePos, state, symbol, x, y, z, isCurrent }

    // We show the helix for the current state configuration
    // Each tape position has a point; the current head position is highlighted
    for (let i = 0; i < tapeLen; i++) {
        const t = (i - tapeLen / 2) / (tapeLen / 2); // normalized -1 to 1
        const z = t; // linear axis

        // For the current head position, use the actual state
        // For other positions, show them at state 0 (neutral)
        const stateForPos = (i === st.headPos) ? st.currentState : 0;
        const angularOffset = (stateForPos / numStates) * 2 * Math.PI;

        const x = radius * Math.cos(angularOffset + t * Math.PI * 2);
        const y = radius * Math.sin(angularOffset + t * Math.PI * 2);

        helixPoints.push({
            tapePos: i,
            state: stateForPos,
            symbol: st.tape[i] || 0,
            x, y, z,
            isCurrent: i === st.headPos
        });
    }

    // ── Project and sort ──
    const projected = helixPoints.map(p => {
        const proj = helixProject3D(p.x, p.y, p.z, st.rotX, st.rotY, W, H);
        return { ...p, sx: proj.sx, sy: proj.sy, depth: proj.depth, scale: proj.scale };
    });

    const sorted = [...projected].sort((a, b) => a.depth - b.depth);

    // ── 2D Shadow ──
    if (showShadow) {
        const shadowPts = helixPoints.map(p => {
            const proj = helixProject3D(p.x * 0.3, -0.9, p.z, st.rotX, st.rotY, W, H);
            return { sx: proj.sx, sy: proj.sy };
        });
        if (shadowPts.length > 1) {
            ctx.beginPath();
            shadowPts.forEach((sp, i) => {
                if (i === 0) ctx.moveTo(sp.sx, sp.sy);
                else ctx.lineTo(sp.sx, sp.sy);
            });
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // ── Helix thread ──
    if (showHelixThread && projected.length > 1) {
        for (let i = 0; i < projected.length - 1; i++) {
            const p1 = projected[i];
            const p2 = projected[i + 1];
            const alpha = 0.2 + p1.scale * 0.3;

            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
            ctx.lineWidth = 1.5 * p1.scale * 2;
            ctx.stroke();
        }
    }

    // ── State color palette ──
    const stateColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];

    // ── Transition arrows ──
    if (showTransitions) {
        // Draw arrows from current config to next config
        // Only show transitions from the current state
        const symbols = [0, 1];
        for (const s of symbols) {
            const key = `${st.currentState},${s}`;
            const trans = st.transitions[key];
            if (!trans || trans.halt) continue;

            // Source: current head position, current state
            const srcPoint = projected.find(p => p.isCurrent);
            if (!srcPoint) continue;

            // Target: next head position, next state
            const nextPos = st.headPos + trans.dir;
            if (nextPos < 0 || nextPos >= tapeLen) continue;

            const targetT = (nextPos - tapeLen / 2) / (tapeLen / 2);
            const targetAngular = (trans.newState / numStates) * 2 * Math.PI;
            const targetX = radius * Math.cos(targetAngular + targetT * Math.PI * 2);
            const targetY = radius * Math.sin(targetAngular + targetT * Math.PI * 2);
            const targetZ = targetT;

            const tProj = helixProject3D(targetX, targetY, targetZ, st.rotX, st.rotY, W, H);

            // Draw arrow
            ctx.beginPath();
            ctx.moveTo(srcPoint.sx, srcPoint.sy);
            ctx.lineTo(tProj.sx, tProj.sy);
            ctx.strokeStyle = `rgba(239, 68, 68, ${s === st.tape[st.headPos] ? 0.7 : 0.2})`;
            ctx.lineWidth = s === st.tape[st.headPos] ? 3 : 1.5;
            ctx.setLineDash(s === st.tape[st.headPos] ? [] : [4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrowhead
            const dx = tProj.sx - srcPoint.sx;
            const dy = tProj.sy - srcPoint.sy;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 10) {
                const ux = dx / len;
                const uy = dy / len;
                const arrowSize = 8;
                const ax = tProj.sx - ux * arrowSize;
                const ay = tProj.sy - uy * arrowSize;

                ctx.beginPath();
                ctx.moveTo(tProj.sx, tProj.sy);
                ctx.lineTo(ax - uy * arrowSize * 0.5, ay + ux * arrowSize * 0.5);
                ctx.lineTo(ax + uy * arrowSize * 0.5, ay - ux * arrowSize * 0.5);
                ctx.closePath();
                ctx.fillStyle = `rgba(239, 68, 68, ${s === st.tape[st.headPos] ? 0.7 : 0.2})`;
                ctx.fill();
            }

            // Label
            if (s === st.tape[st.headPos]) {
                const midX = (srcPoint.sx + tProj.sx) / 2;
                const midY = (srcPoint.sy + tProj.sy) / 2;
                ctx.font = 'bold 10px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.fillText(`δ(q${st.currentState},${s})→q${trans.newState},${trans.write},${trans.dir > 0 ? 'R' : 'L'}`, midX, midY - 8);
            }
        }
    }

    // ── Points (back to front) ──
    sorted.forEach(p => {
        const dotR = p.isCurrent ? 8 * p.scale * 2 : 4 * p.scale * 2;
        const stateColor = stateColors[p.state % stateColors.length];

        if (p.isCurrent) {
            // Glow
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, dotR + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.sx, p.sy, dotR + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Dot
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = p.isCurrent ? '#10b981' : (p.symbol === 1 ? '#f59e0b' : 'rgba(148, 163, 184, 0.4)');
        ctx.fill();
        ctx.strokeStyle = p.isCurrent ? '#fff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = p.isCurrent ? 2 : 1;
        ctx.stroke();

        // Symbol label
        if (p.isCurrent || p.symbol === 1) {
            ctx.font = `${p.isCurrent ? 'bold ' : ''}${Math.round(9 * p.scale * 1.5)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = p.isCurrent ? '#fff' : 'rgba(245, 158, 11, 0.7)';
            ctx.fillText(p.symbol.toString(), p.sx, p.sy + 3);
        }

        // State label for current
        if (p.isCurrent) {
            ctx.font = 'bold 12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#10b981';
            ctx.fillText(`q${p.state}`, p.sx, p.sy - dotR - 8);

            // Tape position
            ctx.font = '9px system-ui, sans-serif';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
            ctx.fillText(`pos ${p.tapePos}`, p.sx, p.sy + dotR + 14);
        }
    });

    // ── Axis labels ──
    const leftProj = helixProject3D(0, 0, -1, st.rotX, st.rotY, W, H);
    const rightProj = helixProject3D(0, 0, 1, st.rotX, st.rotY, W, H);

    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.fillText('← Tape', leftProj.sx, leftProj.sy + 20);
    ctx.fillText('Tape →', rightProj.sx, rightProj.sy + 20);

    // ── Update tape display ──
    updateHelixTapeDisplay();
    updateHelixStateInfo();
    updateHelixTuringStats();
};

function updateHelixTapeDisplay() {
    const st = helixTuringState;
    const tapeDiv = document.getElementById('helix-tape-display');
    if (!tapeDiv) return;

    let html = '';
    const windowStart = Math.max(0, st.headPos - 8);
    const windowEnd = Math.min(st.tapeSize, st.headPos + 9);

    if (windowStart > 0) html += '<span style="color:#64748b;">…</span>';

    for (let i = windowStart; i < windowEnd; i++) {
        const sym = st.tape[i] || 0;
        const isCurrent = i === st.headPos;

        if (isCurrent) {
            html += `<span style="background:#10b981; color:#fff; padding:2px 5px; border-radius:4px; font-weight:bold; border:2px solid #059669;">${sym}</span>`;
        } else {
            html += `<span style="color:${sym === 1 ? '#f59e0b' : '#94a3b8'}; padding:0 2px;">${sym}</span>`;
        }
        html += ' ';
    }

    if (windowEnd < st.tapeSize) html += '<span style="color:#64748b;">…</span>';

    tapeDiv.innerHTML = html;
}

function updateHelixStateInfo() {
    const st = helixTuringState;
    const infoDiv = document.getElementById('helix-state-info');
    if (!infoDiv) return;

    const stateColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];

    const currentSymbol = st.tape[st.headPos] || 0;
    const key = `${st.currentState},${currentSymbol}`;
    const trans = st.transitions[key];

    let html = `
        <div style="margin-bottom: 6px;">
            <b>Current State:</b>
            <span style="color:${stateColors[st.currentState % 8]}; font-weight:bold; font-size:1.1em;">
                q${st.currentState}
            </span>
        </div>
        <div style="margin-bottom: 6px;">
            <b>Head Position:</b> ${st.headPos}
        </div>
        <div style="margin-bottom: 6px;">
            <b>Reading:</b> <span style="font-family:monospace; font-weight:bold; color:${currentSymbol === 1 ? '#f59e0b' : '#94a3b8'};">${currentSymbol}</span>
        </div>
        <div style="margin-bottom: 6px;">
            <b>Steps:</b> ${st.stepCount}
        </div>
    `;

    if (st.halted) {
        html += `<div style="color:#f59e0b; font-weight:bold; margin-top:8px;">⏹ HALTED</div>`;
    } else if (trans && !trans.halt) {
        html += `
            <hr style="border:none; border-top:1px solid #e2e8f0; margin:8px 0;">
            <div style="font-size:0.85em; color:#94a3b8;">
                <b>Next transition:</b><br>
                δ(q${st.currentState}, ${currentSymbol}) →
                (q${trans.newState}, ${trans.write}, ${trans.dir > 0 ? 'R' : 'L'})<br>
                <span style="color:#64748b;">
                    Write ${trans.write}, move ${trans.dir > 0 ? 'right' : 'left'},
                    go to <span style="color:${stateColors[trans.newState % 8]};">q${trans.newState}</span>
                </span>
            </div>
        `;
    } else {
        html += `
            <hr style="border:none; border-top:1px solid #e2e8f0; margin:8px 0;">
            <div style="font-size:0.85em; color:#f59e0b;">
                <b>Next:</b> HALT (state q${st.numStates - 1} reached or no transition)
            </div>
        `;
    }

    // State legend
    html += `<hr style="border:none; border-top:1px solid #e2e8f0; margin:8px 0;">
        <div style="font-size:0.8em; color:#94a3b8;"><b>States:</b></div>`;
    for (let q = 0; q < st.numStates; q++) {
        const isHalt = q === st.numStates - 1;
        const isCurrent = q === st.currentState;
        html += `<div style="display:flex; align-items:center; gap:4px; margin:2px 0; ${isCurrent ? 'font-weight:bold;' : ''}">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${stateColors[q % 8]};"></span>
            <span style="color:${isCurrent ? '#1e293b' : '#94a3b8'};">q${q}${isHalt ? ' (halt)' : ''}${isCurrent ? ' ← current' : ''}</span>
        </div>`;
    }

    infoDiv.innerHTML = html;
}

function updateHelixTuringStats() {
    const st = helixTuringState;
    const statsDiv = document.getElementById('helix-turing-stats');
    if (!statsDiv) return;

    const stateColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];

    const windingNumber = st.numStates;
    const angularResolution = (360 / st.numStates).toFixed(1);
    const onesCount = st.tape.filter(s => s === 1).length;

    statsDiv.innerHTML = `
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Winding Number</div>
            <div style="font-size:1.4em; font-weight:bold; color:#8b5cf6;">${windingNumber}</div>
            <div style="font-size:0.7em; color:#94a3b8;">states per loop</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Angular Resolution</div>
            <div style="font-size:1.4em; font-weight:bold; color:#3b82f6;">${angularResolution}°</div>
            <div style="font-size:0.7em; color:#94a3b8;">per state</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Steps Executed</div>
            <div style="font-size:1.4em; font-weight:bold; color:${st.halted ? '#f59e0b' : '#10b981'};">${st.stepCount}</div>
            <div style="font-size:0.7em; color:#94a3b8;">${st.halted ? 'halted' : 'running'}</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Tape 1s</div>
            <div style="font-size:1.4em; font-weight:bold; color:#f59e0b;">${onesCount}</div>
            <div style="font-size:0.7em; color:#94a3b8;">of ${st.tapeSize} cells</div>
        </div>
    `;
}

// ── Topology Module Loader ──

async function loadTopologyModule() {
    // 1. Latent space manifold (Plotly surface)
    initTopologyVisualization();

    // 2. Helix–Turing Machine (Canvas)
    _topologyLazyRegister('canvas-helix-turing', () => {
        initHelixTuring();
    });

    // Start observing
    _topologyLazyCreateObserver();
}
