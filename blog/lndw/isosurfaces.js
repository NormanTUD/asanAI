// ============================================================
// ISOSURFACES.JS – Wahrscheinlichkeits-Isoflächen (Truth Tunnels)
// Präsentationsfolie mit Pfeiltasten-Navigation
// ============================================================

const IsosurfaceDemo = (() => {
    // ── State ──────────────────────────────────────────────────
    let canvas = null;
    let ctx = null;
    let W = 0, H = 0;
    let currentStep = 0;
    let animFrame = null;
    let tweenActive = false;
    let tweenStart = 0;
    let tweenFrom = {};
    let tweenTo = {};
    let displayState = { step: 0, temperature: 0.7 };

    // Der deutsche Beispielsatz
    const sentence = {
        tokens: ['Die', 'Hauptstadt', 'von', 'Frankreich', 'ist', 'Paris', '.'],
        entropy: [0.92, 0.50, 0.15, 0.55, 0.12, 0.04, 0.08],
        path: [
            { x: 0.07, y: 0.50 },
            { x: 0.19, y: 0.44 },
            { x: 0.31, y: 0.40 },
            { x: 0.44, y: 0.37 },
            { x: 0.57, y: 0.34 },
            { x: 0.72, y: 0.31 },
            { x: 0.88, y: 0.33 },
        ],
        branches: [
            {
                atStep: 3,
                alternatives: [
                    { token: 'Deutschland', path: { x: 0.44, y: 0.55 }, entropy: 0.50 },
                    { token: 'Italien', path: { x: 0.44, y: 0.22 }, entropy: 0.48 },
                ]
            },
            {
                atStep: 5,
                alternatives: [
                    { token: 'Lyon', path: { x: 0.72, y: 0.45 }, entropy: 0.20 },
                ]
            }
        ],
    };

    // ── Schritte der Präsentation ──────────────────────────────
    // Phase 1: Token für Token bei T=0.7 (Steps 0–6)
    // Phase 2: Reset + Token für Token bei T=1.8 (Steps 7–13)
    // Phase 3: Vergleichs-Ansicht (Step 14)
    const PHASE1_TEMP = 0.7;
    const PHASE2_TEMP = 1.8;
    const TOKENS = sentence.tokens.length; // 7
    const TOTAL_STEPS = TOKENS + TOKENS + 1; // 15

    function getTargetState(step) {
        if (step < TOKENS) {
            return { step: step, temperature: PHASE1_TEMP };
        } else if (step < TOKENS * 2) {
            return { step: step - TOKENS, temperature: PHASE2_TEMP };
        } else {
            return { step: TOKENS - 1, temperature: PHASE2_TEMP };
        }
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
        displayState = { step: 0, temperature: PHASE1_TEMP };
        if (canvas) render();
    }

    // ── Tween Engine ───────────────────────────────────────────
    function startTween() {
        const target = getTargetState(currentStep);
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
        const duration = 500; // ms
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
            animFrame = requestAnimationFrame(tweenLoop);
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
        }
        resize();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 150);
        });

        render();
        updateInfoPanel();
    }

    // ── Rendering ──────────────────────────────────────────────
    function render() {
        if (!ctx) return;

        const step = displayState.step;
        const temp = displayState.temperature;
        const visibleStep = Math.floor(step);

        // Clear
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(51,65,85,0.25)';
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx < W; gx += 50) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 50) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }

        // Helper
        function toCanvas(p) { return { x: p.x * W, y: p.y * H }; }

        // Full path guide (faint)
        ctx.beginPath();
        sentence.path.forEach((p, i) => {
            const cp = toCanvas(p);
            if (i === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
        });
        ctx.strokeStyle = 'rgba(96,165,250,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Envelope (Isosurface)
        const baseWidth = 90;
        if (visibleStep >= 1) {
            const upperPath = [];
            const lowerPath = [];

            for (let i = 0; i <= visibleStep; i++) {
                const cp = toCanvas(sentence.path[i]);
                // Interpolate envelope for current animating step
                let envelope = sentence.entropy[i] * temp * baseWidth;
                if (i === visibleStep) {
                    const frac = step - visibleStep;
                    envelope *= frac;
                }

                let dx = 0, dy = -1;
                if (i < sentence.path.length - 1) {
                    const next = toCanvas(sentence.path[i + 1]);
                    const tdx = next.x - cp.x;
                    const tdy = next.y - cp.y;
                    const len = Math.hypot(tdx, tdy);
                    if (len > 0) { dx = -tdy / len; dy = tdx / len; }
                } else if (i > 0) {
                    const prev = toCanvas(sentence.path[i - 1]);
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
                const alpha = 0.025 + (3 - layer) * 0.025;
                ctx.beginPath();
                upperPath.forEach((p, i) => {
                    const cp = toCanvas(sentence.path[i]);
                    const ex = cp.x + (p.x - cp.x) * scale;
                    const ey = cp.y + (p.y - cp.y) * scale;
                    if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
                });
                for (let i = lowerPath.length - 1; i >= 0; i--) {
                    const cp = toCanvas(sentence.path[i]);
                    const p = lowerPath[i];
                    const ex = cp.x + (p.x - cp.x) * scale;
                    const ey = cp.y + (p.y - cp.y) * scale;
                    ctx.lineTo(ex, ey);
                }
                ctx.closePath();

                // Color by temperature
                const hue = temp < 1.0 ? 220 : 280;
                ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`;
                ctx.fill();
            }

            // Inner envelope
            ctx.beginPath();
            upperPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            for (let i = lowerPath.length - 1; i >= 0; i--) ctx.lineTo(lowerPath[i].x, lowerPath[i].y);
            ctx.closePath();
            ctx.fillStyle = temp < 1.0 ? 'rgba(96, 165, 250, 0.06)' : 'rgba(168, 85, 247, 0.08)';
            ctx.fill();
            ctx.strokeStyle = temp < 1.0 ? 'rgba(96, 165, 250, 0.3)' : 'rgba(168, 85, 247, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Branches
        sentence.branches.forEach(branch => {
            if (visibleStep >= branch.atStep) {
                const origin = toCanvas(sentence.path[branch.atStep]);
                branch.alternatives.forEach(alt => {
                    const target = toCanvas(alt.path);
                    const altEnvelope = alt.entropy * temp * baseWidth * 0.5;

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
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
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
                const cp = toCanvas(sentence.path[i]);
                if (i === 0) ctx.moveTo(cp.x, cp.y); else ctx.lineTo(cp.x, cp.y);
            }
            ctx.strokeStyle = temp < 1.0 ? '#60a5fa' : '#a78bfa';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.strokeStyle = temp < 1.0 ? 'rgba(96, 165, 250, 0.25)' : 'rgba(167, 139, 250, 0.25)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // Token nodes
        for (let i = 0; i <= visibleStep; i++) {
            const cp = toCanvas(sentence.path[i]);
            const entropy = sentence.entropy[i];
            const radius = 5 + entropy * temp * 5;

            ctx.beginPath();
            ctx.arc(cp.x, cp.y, radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(96, 165, 250, ${0.08 + entropy * 0.08})`;
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
            ctx.fillText(sentence.tokens[i], cp.x, cp.y - radius - 10);
        }

        // Future tokens (faint)
        for (let i = visibleStep + 1; i < sentence.tokens.length; i++) {
            const cp = toCanvas(sentence.path[i]);
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
            ctx.fill();
            ctx.font = '10px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
            ctx.fillText(sentence.tokens[i], cp.x, cp.y - 10);
        }

        // Temperature indicator (top left)
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = temp < 1.0 ? '#60a5fa' : '#a78bfa';
        ctx.fillText(`Temperatur: ${temp.toFixed(2)}`, 14, 24);

        let tempLabel;
        if (temp < 0.5) tempLabel = '❄️ Sehr fokussiert';
        else if (temp < 1.0) tempLabel = '🧊 Fokussiert – enger Tunnel';
        else if (temp < 1.5) tempLabel = '🌡️ Warm – weiter Tunnel';
        else tempLabel = '🔥 Heiß – sehr weiter Tunnel';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.fillText(tempLabel, 14, 42);

        // Phase indicator (top right)
        ctx.textAlign = 'right';
        ctx.font = 'bold 11px system-ui, sans-serif';
        if (currentStep < TOKENS) {
            ctx.fillStyle = '#60a5fa';
            ctx.fillText('Phase 1: Niedrige Temperatur', W - 14, 24);
        } else if (currentStep < TOKENS * 2) {
            ctx.fillStyle = '#a78bfa';
            ctx.fillText('Phase 2: Hohe Temperatur', W - 14, 24);
        } else {
            ctx.fillStyle = '#10b981';
            ctx.fillText('Vergleich abgeschlossen', W - 14, 24);
        }

        // Entropy bar (right side)
        if (visibleStep < sentence.tokens.length) {
            const barX = W - 40;
            const barH = H - 100;
            const barW = 14;
            const barY = 60;

            ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);

            const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
            grad.addColorStop(0, '#3b82f6');
            grad.addColorStop(0.5, '#8b5cf6');
            grad.addColorStop(1, '#f59e0b');
            ctx.fillStyle = grad;
            ctx.fillRect(barX, barY, barW, barH);

            const currentEntropy = sentence.entropy[visibleStep];
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

        const visibleStep = Math.floor(displayState.step);
        const temp = displayState.temperature;

        // Sentence display
        let html = '';
        sentence.tokens.forEach((token, i) => {
            if (i < visibleStep) {
                html += `<span style="color:#1e293b; font-weight:bold;">${token}</span> `;
            } else if (i === visibleStep) {
                const entropy = sentence.entropy[i];
                const hue = 220 - entropy * 180;
                html += `<span style="background:hsl(${hue},80%,90%); color:hsl(${hue},80%,30%); font-weight:bold; padding:2px 6px; border-radius:4px; border:2px solid hsl(${hue},80%,60%);">${token}</span> `;
            } else {
                html += `<span style="color:#cbd5e1;">${token}</span> `;
            }
        });
        sentenceDisplay.innerHTML = html;

        // Info
        const entropy = sentence.entropy[visibleStep] || 0;
        const effective = Math.min(1, entropy * temp);
        const tunnelPct = (effective * 100).toFixed(0);

        let certainty, certColor;
        if (effective < 0.15) { certainty = 'Fast sicher'; certColor = '#3b82f6'; }
        else if (effective < 0.35) { certainty = 'Zuversichtlich'; certColor = '#10b981'; }
        else if (effective < 0.55) { certainty = 'Moderat'; certColor = '#f59e0b'; }
        else { certainty = 'Weit offen'; certColor = '#ef4444'; }

        // Branch info
        let branchHtml = '';
        sentence.branches.forEach(branch => {
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
                <b>Token:</b> <span style="font-size:1.1em; font-weight:bold;">"${sentence.tokens[visibleStep]}"</span>
            </div>
            <div style="margin-bottom:4px;">
                <b>Entropie:</b> ${entropy.toFixed(2)} × T${temp.toFixed(1)} = ${effective.toFixed(2)}
            </div>
            <div style="margin-bottom:4px;">
                <b>Tunnelbreite:</b>
                <div style="background:#1e293b; border-radius:4px; height:10px; width:100%; margin-top:2px; overflow:hidden;">
                    <div style="background:linear-gradient(90deg, #8b5cf6, #a78bfa); height:100%; width:${tunnelPct}%; border-radius:4px; transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="margin-bottom:6px;">
                <b>Sicherheit:</b> <span style="color:${certColor}; font-weight:bold;">${certainty}</span>
            </div>
            ${branchHtml}
            <hr style="border:none; border-top:1px solid #e2e8f0; margin:8px 0;">
            <div style="font-size:0.8em; color:#94a3b8;">
                Schritt ${currentStep + 1} / ${TOTAL_STEPS}
                ${currentStep < TOKENS ? '(Phase 1: T=0.7)' : currentStep < TOKENS * 2 ? '(Phase 2: T=1.8)' : '(Fertig)'}
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
