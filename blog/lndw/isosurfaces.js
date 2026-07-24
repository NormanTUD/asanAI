// ============================================================
// ISOSURFACES.JS – Wahrscheinlichkeits-Isoflächen (Truth Tunnels)
// Präsentationsfolie: Pfeiltasten-Navigation, zwei Beispiele
// ============================================================

const IsosurfaceDemo = (() => {
    // ── State ──────────────────────────────────────────────────
    let canvas = null;
    let ctx = null;
    let W = 0, H = 0;
    let currentStep = 0;
    let tweenActive = false;
    let tweenStart = 0;
    let tweenFrom = {};
    let tweenTo = {};
    let displayState = { step: 0, temperature: 0.6 };
    let initialized = false;

    // ── Zwei verschiedene deutsche Beispielsätze ────────────────
    const sentences = [
        {
            // Satz 1: Faktenwissen – verengt sich stark
            label: 'Faktenwissen (T = 0.6)',
            tokens: ['Die', 'Hauptstadt', 'von', 'Frankreich', 'ist', 'Paris', '.'],
            entropy: [0.90, 0.45, 0.12, 0.50, 0.10, 0.03, 0.06],
            path: [
                { x: 0.07, y: 0.50 },
                { x: 0.20, y: 0.44 },
                { x: 0.33, y: 0.40 },
                { x: 0.46, y: 0.36 },
                { x: 0.60, y: 0.33 },
                { x: 0.76, y: 0.30 },
                { x: 0.91, y: 0.32 },
            ],
            branches: [
                {
                    atStep: 3,
                    alternatives: [
                        { token: 'Deutschland', path: { x: 0.46, y: 0.56 }, entropy: 0.48 },
                        { token: 'Italien', path: { x: 0.46, y: 0.20 }, entropy: 0.45 },
                    ]
                },
                {
                    atStep: 5,
                    alternatives: [
                        { token: 'Lyon', path: { x: 0.76, y: 0.44 }, entropy: 0.18 },
                    ]
                }
            ],
            temperature: 0.6,
            color: { main: '#60a5fa', envelope: 'rgba(96, 165, 250, ', hue: 220 }
        },
        {
            // Satz 2: Kreatives Erzählen – bleibt weit offen
            label: 'Kreatives Erzählen (T = 1.6)',
            tokens: ['Es', 'war', 'einmal', 'ein', 'Drache', ',', 'der', 'über', 'die', 'Berge', 'flog'],
            entropy: [0.70, 0.20, 0.15, 0.85, 0.72, 0.08, 0.30, 0.55, 0.12, 0.68, 0.60],
            path: [
                { x: 0.04, y: 0.50 },
                { x: 0.12, y: 0.47 },
                { x: 0.19, y: 0.45 },
                { x: 0.27, y: 0.46 },
                { x: 0.36, y: 0.40 },
                { x: 0.43, y: 0.41 },
                { x: 0.50, y: 0.43 },
                { x: 0.59, y: 0.38 },
                { x: 0.67, y: 0.39 },
                { x: 0.78, y: 0.34 },
                { x: 0.91, y: 0.32 },
            ],
            branches: [
                {
                    atStep: 4,
                    alternatives: [
                        { token: 'König', path: { x: 0.36, y: 0.58 }, entropy: 0.65 },
                        { token: 'Mädchen', path: { x: 0.36, y: 0.24 }, entropy: 0.60 },
                        { token: 'Zauberer', path: { x: 0.39, y: 0.52 }, entropy: 0.55 },
                    ]
                },
                {
                    atStep: 9,
                    alternatives: [
                        { token: 'Wälder', path: { x: 0.78, y: 0.50 }, entropy: 0.62 },
                        { token: 'Meere', path: { x: 0.78, y: 0.20 }, entropy: 0.58 },
                    ]
                }
            ],
            temperature: 1.6,
            color: { main: '#a78bfa', envelope: 'rgba(167, 139, 250, ', hue: 270 }
        }
    ];

    // ── Schritte berechnen ─────────────────────────────────────
    // Phase 1: Satz 1, Token für Token (0 bis 6)
    // Phase 2: Satz 2, Token für Token (7 bis 17)
    // Phase 3: Fertig (18)
    const TOKENS_1 = sentences[0].tokens.length; // 7
    const TOKENS_2 = sentences[1].tokens.length; // 11
    const TOTAL_STEPS = TOKENS_1 + TOKENS_2 + 1; // 19

    function getTargetState(step) {
        if (step < TOKENS_1) {
            return { sentenceIdx: 0, tokenStep: step, temperature: sentences[0].temperature };
        } else if (step < TOKENS_1 + TOKENS_2) {
            return { sentenceIdx: 1, tokenStep: step - TOKENS_1, temperature: sentences[1].temperature };
        } else {
            return { sentenceIdx: 1, tokenStep: TOKENS_2 - 1, temperature: sentences[1].temperature };
        }
    }

    function getDisplayTarget(step) {
        const s = getTargetState(step);
        return { step: s.tokenStep, temperature: s.temperature };
    }

    // ── Slide Detection ────────────────────────────────────────
    function isOnIsoSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Wahrscheinlichkeits-Tunnel';
    }

    function canGoNext() {
        if (!isOnIsoSlide()) return false;
        if (tweenActive) return false;
        return currentStep < TOTAL_STEPS - 1;
    }

    function canGoPrev() {
        if (!isOnIsoSlide()) return false;
        if (tweenActive) return false;
        return currentStep > 0;
    }

    function next() {
        if (!canGoNext()) return;
        currentStep++;
        startTween();
    }

    function prev() {
        if (!canGoPrev()) return;
        currentStep--;
        startTween();
    }

    function reset() {
        currentStep = 0;
        tweenActive = false;
        displayState = { step: 0, temperature: sentences[0].temperature };
        if (canvas) render();
        updateInfoPanel();
    }

    // ── Tween Engine ───────────────────────────────────────────
    function startTween() {
        const target = getDisplayTarget(currentStep);
        tweenFrom = { ...displayState };
        tweenTo = target;
        tweenStart = performance.now();
        if (!tweenActive) {
            tweenActive = true;
            tweenLoop();
        }
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function tweenLoop() {
        if (!tweenActive) return;
        const elapsed = performance.now() - tweenStart;
        const duration = 550;
        let t = Math.min(elapsed / duration, 1.0);
        const eased = easeInOutCubic(t);

        displayState.step = tweenFrom.step + (tweenTo.step - tweenFrom.step) * eased;
        displayState.temperature = tweenFrom.temperature + (tweenTo.temperature - tweenFrom.temperature) * eased;

        render();
        updateInfoPanel();

        if (t >= 1.0) {
            displayState.step = tweenTo.step;
            displayState.temperature = tweenTo.temperature;
            tweenActive = false;
            render();
            updateInfoPanel();
        } else {
            requestAnimationFrame(tweenLoop);
        }
    }

    // ── Canvas Setup ───────────────────────────────────────────
    function init() {
        canvas = document.getElementById('canvas-iso-tunnel');
        if (!canvas) return;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            W = rect.width;
            H = rect.height;
            canvas.width = W * window.devicePixelRatio;
            canvas.height = H * window.devicePixelRatio;
            ctx = canvas.getContext('2d');
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            render();
            updateInfoPanel();
        }
        resize();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 150);
        });

        initialized = true;
        render();
        updateInfoPanel();
    }

    // ── Rendering ──────────────────────────────────────────────
    function render() {
        if (!ctx) return;

        const state = getTargetState(currentStep);
        const sentIdx = state.sentenceIdx;
        const sent = sentences[sentIdx];
        const step = displayState.step;
        const temp = displayState.temperature;
        const visibleStep = Math.floor(step);
        const stepFrac = step - visibleStep;

        // Clear
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(51,65,85,0.2)';
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx < W; gx += 50) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 50) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }

        function toCanvas(p) { return { x: p.x * W, y: p.y * H }; }

        // Full path guide (faint)
        ctx.beginPath();
        sent.path.forEach((p, i) => {
            const cp = toCanvas(p);
            if (i === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
        });
        ctx.strokeStyle = 'rgba(148,163,184,0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Envelope (Isosurface)
        const baseWidth = 85;
        if (visibleStep >= 1) {
            const upperPath = [];
            const lowerPath = [];

            for (let i = 0; i <= visibleStep; i++) {
                const cp = toCanvas(sent.path[i]);
                let envelope = sent.entropy[i] * temp * baseWidth;
                // Animate the current step appearing
                if (i === visibleStep) {
                    envelope *= stepFrac < 0.01 ? 1 : 1;
                }

                let dx = 0, dy = -1;
                if (i < sent.path.length - 1) {
                    const nxt = toCanvas(sent.path[i + 1]);
                    const tdx = nxt.x - cp.x;
                    const tdy = nxt.y - cp.y;
                    const len = Math.hypot(tdx, tdy);
                    if (len > 0) { dx = -tdy / len; dy = tdx / len; }
                } else if (i > 0) {
                    const prev = toCanvas(sent.path[i - 1]);
                    const tdx = cp.x - prev.x;
                    const tdy = cp.y - prev.y;
                    const len = Math.hypot(tdx, tdy);
                    if (len > 0) { dx = -tdy / len; dy = tdx / len; }
                }

                upperPath.push({ x: cp.x + dx * envelope, y: cp.y + dy * envelope });
                lowerPath.push({ x: cp.x - dx * envelope, y: cp.y - dy * envelope });
            }

            // Glow layers
            for (let layer = 3; layer >= 0; layer--) {
                const scale = 1 + layer * 0.35;
                const alpha = 0.02 + (3 - layer) * 0.02;
                ctx.beginPath();
                upperPath.forEach((p, i) => {
                    const cp = toCanvas(sent.path[i]);
                    const ex = cp.x + (p.x - cp.x) * scale;
                    const ey = cp.y + (p.y - cp.y) * scale;
                    if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
                });
                for (let i = lowerPath.length - 1; i >= 0; i--) {
                    const cp = toCanvas(sent.path[i]);
                    const p = lowerPath[i];
                    const ex = cp.x + (p.x - cp.x) * scale;
                    const ey = cp.y + (p.y - cp.y) * scale;
                    ctx.lineTo(ex, ey);
                }
                ctx.closePath();
                ctx.fillStyle = `hsla(${sent.color.hue}, 70%, 55%, ${alpha})`;
                ctx.fill();
            }

            // Inner envelope
            ctx.beginPath();
            upperPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            for (let i = lowerPath.length - 1; i >= 0; i--) ctx.lineTo(lowerPath[i].x, lowerPath[i].y);
            ctx.closePath();
            ctx.fillStyle = sent.color.envelope + '0.06)';
            ctx.fill();
            ctx.strokeStyle = sent.color.envelope + '0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Branches
        sent.branches.forEach(branch => {
            if (visibleStep >= branch.atStep) {
                const origin = toCanvas(sent.path[branch.atStep]);
                branch.alternatives.forEach(alt => {
                    const target = toCanvas(alt.path);
                    const altEnvelope = alt.entropy * temp * baseWidth * 0.45;

                    ctx.beginPath();
                    ctx.moveTo(origin.x, origin.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.beginPath();
                    ctx.arc(target.x, target.y, altEnvelope, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.04)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.font = '11px system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
                    ctx.fillText(alt.token, target.x, target.y - altEnvelope - 6);

                    ctx.beginPath();
                    ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = '#fbbf24';
                    ctx.fill();
                });
            }
        });

        // Main trajectory
        if (visibleStep >= 1) {
            ctx.beginPath();
            for (let i = 0; i <= visibleStep; i++) {
                const cp = toCanvas(sent.path[i]);
                if (i === 0) ctx.moveTo(cp.x, cp.y); else ctx.lineTo(cp.x, cp.y);
            }
            ctx.strokeStyle = sent.color.main;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.strokeStyle = sent.color.envelope + '0.2)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // Token nodes
        for (let i = 0; i <= visibleStep; i++) {
            const cp = toCanvas(sent.path[i]);
            const entropy = sent.entropy[i];
            const radius = 5 + entropy * temp * 4;

            ctx.beginPath();
            ctx.arc(cp.x, cp.y, radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(148, 163, 184, ${0.06 + entropy * 0.06})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cp.x, cp.y, radius, 0, Math.PI * 2);
            const hue = 220 - entropy * 180;
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = 'bold 13px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(sent.tokens[i], cp.x, cp.y - radius - 10);
        }

        // Future tokens (faint)
        for (let i = visibleStep + 1; i < sent.tokens.length; i++) {
            const cp = toCanvas(sent.path[i]);
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
            ctx.fill();
            ctx.font = '9px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
            ctx.fillText(sent.tokens[i], cp.x, cp.y - 8);
        }

        // ── HUD: Temperatur & Phase ───────────────────────────
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = sent.color.main;
        ctx.fillText(`Temperatur: ${temp.toFixed(2)}`, 14, 24);

        let tempLabel;
        if (temp < 0.4) tempLabel = '❄️ Sehr fokussiert';
        else if (temp < 0.9) tempLabel = '🧊 Fokussiert – enger Tunnel';
        else if (temp < 1.3) tempLabel = '🌡️ Warm – weiter Tunnel';
        else tempLabel = '🔥 Heiß – sehr weiter Tunnel';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.fillText(tempLabel, 14, 42);

        // Phase indicator (top right)
        ctx.textAlign = 'right';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillStyle = sent.color.main;
        ctx.fillText(sent.label, W - 14, 24);

        // Step counter
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.fillText(`Schritt ${currentStep + 1} / ${TOTAL_STEPS}`, W - 14, 42);

        // Entropy bar (right side)
        if (visibleStep < sent.tokens.length) {
            const barX = W - 38;
            const barH = H - 100;
            const barW = 12;
            const barY = 60;

            ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
            ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);

            const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
            grad.addColorStop(0, '#3b82f6');
            grad.addColorStop(0.5, '#8b5cf6');
            grad.addColorStop(1, '#f59e0b');
            ctx.fillStyle = grad;
            ctx.fillRect(barX, barY, barW, barH);

            const currentEntropy = sent.entropy[visibleStep];
            const effectiveEntropy = Math.min(1, currentEntropy * temp);
            const markerY = barY + (1 - effectiveEntropy) * barH;

            ctx.beginPath();
            ctx.moveTo(barX - 6, markerY);
            ctx.lineTo(barX, markerY - 4);
            ctx.lineTo(barX, markerY + 4);
            ctx.closePath();
            ctx.fillStyle = '#fff';
            ctx.fill();

            ctx.font = '9px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Sicher', barX + barW / 2, barY - 8);
            ctx.fillText('Unsicher', barX + barW / 2, barY + barH + 14);
        }
    }

    // ── Info Panel ─────────────────────────────────────────────
    function updateInfoPanel() {
        const sentenceDisplay = document.getElementById('iso-tunnel-sentence');
        const infoDisplay = document.getElementById('iso-tunnel-info');
        if (!sentenceDisplay || !infoDisplay) return;

        const state = getTargetState(currentStep);
        const sent = sentences[state.sentenceIdx];
        const visibleStep = Math.min(Math.floor(displayState.step), sent.tokens.length - 1);
        const temp = displayState.temperature;

        // Sentence display
        let html = '';
        sent.tokens.forEach((token, i) => {
            if (i < visibleStep) {
                html += `<span style="color:#1e293b; font-weight:bold;">${token}</span> `;
            } else if (i === visibleStep) {
                const entropy = sent.entropy[i];
                const hue = 220 - entropy * 180;
                html += `<span style="background:hsl(${hue},80%,92%); color:hsl(${hue},80%,30%); font-weight:bold; padding:2px 6px; border-radius:4px; border:2px solid hsl(${hue},80%,60%);">${token}</span> `;
            } else {
                html += `<span style="color:#cbd5e1;">${token}</span> `;
            }
        });
        sentenceDisplay.innerHTML = html;

        // Info
        const entropy = sent.entropy[visibleStep] || 0;
        const effective = Math.min(1, entropy * temp);
        const tunnelPct = (effective * 100).toFixed(0);

        let certainty, certColor;
        if (effective < 0.12) { certainty = 'Fast sicher'; certColor = '#3b82f6'; }
        else if (effective < 0.30) { certainty = 'Zuversichtlich'; certColor = '#10b981'; }
        else if (effective < 0.55) { certainty = 'Moderat'; certColor = '#f59e0b'; }
        else { certainty = 'Weit offen'; certColor = '#ef4444'; }

        // Branch info
        let branchHtml = '';
        sent.branches.forEach(branch => {
            if (branch.atStep === visibleStep) {
                branchHtml += `<div style="margin-top:8px; padding:6px 8px; background:rgba(251,191,36,0.1); border-radius:4px; border-left:3px solid #fbbf24;">
                    <b style="color:#f59e0b;">🔀 Gabelung!</b><br>`;
                branch.alternatives.forEach(alt => {
                    branchHtml += `<span style="color:#f59e0b;">→ "${alt.token}"</span><br>`;
                });
                branchHtml += `</div>`;
            }
        });

        infoDisplay.innerHTML = `
            <div style="margin-bottom:6px;">
                <b>Token:</b> <span style="font-size:1.1em; font-weight:bold;">"${sent.tokens[visibleStep]}"</span>
            </div>
            <div style="margin-bottom:4px;">
                <b>Entropie:</b> ${entropy.toFixed(2)} × T${temp.toFixed(1)} = <b>${effective.toFixed(2)}</b>
            </div>
            <div style="margin-bottom:4px;">
                <b>Tunnelbreite:</b>
                <div style="background:#1e293b; border-radius:4px; height:10px; width:100%; margin-top:2px; overflow:hidden;">
                    <div style="background:linear-gradient(90deg, ${sent.color.main}, ${sent.color.envelope}0.8)); height:100%; width:${tunnelPct}%; border-radius:4px; transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="margin-bottom:6px;">
                <b>Sicherheit:</b> <span style="color:${certColor}; font-weight:bold;">${certainty}</span>
            </div>
            ${branchHtml}
            <hr style="border:none; border-top:1px solid #e2e8f0; margin:8px 0;">
            <div style="font-size:0.78em; color:#94a3b8;">
                ${currentStep < TOKENS_1
                    ? '📘 Phase 1: Faktenwissen (T=0.6) – Tunnel verengt sich stark'
                    : currentStep < TOKENS_1 + TOKENS_2
                    ? '📙 Phase 2: Kreatives Erzählen (T=1.6) – Tunnel bleibt weit'
                    : '✅ Vergleich abgeschlossen'}
            </div>
        `;
    }

    // ── Public API ─────────────────────────────────────────────
    return {
        init,
        next,
        prev,
        canGoNext,
        canGoPrev,
        isOnIsoSlide,
        reset
    };
})();
