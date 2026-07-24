// ============================================================
// ISOSURFACES.JS – Wahrscheinlichkeits-Isoflächen (Truth Tunnels)
// "Es war einmal..." – Abspaltungen an JEDEM Token,
// auch auf nicht-gewählten Pfaden. Fixe Temperatur, Temperature-Demo am Ende.
// ============================================================

const IsosurfaceDemo = (() => {
    let canvas = null;
    let ctx = null;
    let W = 0, H = 0;
    let currentStep = 0;
    let tweenActive = false;
    let tweenStart = 0;
    let tweenFrom = {};
    let tweenTo = {};
    let displayState = { step: 0, temperature: 0.7 };

    // ── Prompt (User-Input) ────────────────────────────────────
    const prompt = ['Es', 'war', 'einmal'];

    // ── Generierte Tokens ──────────────────────────────────────
    const generated = ['ein', 'Drache', ',', 'der', 'über', 'die', 'Berge', 'flog', '.'];

    const allTokens = [...prompt, ...generated];

    const entropy = [0.0, 0.0, 0.0, 0.90, 0.65, 0.05, 0.25, 0.50, 0.08, 0.62, 0.50, 0.04];

    const path = [
        { x: 0.04, y: 0.50 },
        { x: 0.10, y: 0.48 },
        { x: 0.16, y: 0.46 },
        { x: 0.24, y: 0.47 },
        { x: 0.33, y: 0.42 },
        { x: 0.40, y: 0.42 },
        { x: 0.47, y: 0.43 },
        { x: 0.55, y: 0.39 },
        { x: 0.63, y: 0.40 },
        { x: 0.72, y: 0.35 },
        { x: 0.82, y: 0.33 },
        { x: 0.92, y: 0.34 },
    ];

    // ── Mini-Splits: an JEDEM generierten Token ────────────────
    // Alternativen die STATT DIESES TOKENS hätten stehen können
    const miniSplits = [
        // Index 3: "ein" – hier hätte auch "eine" oder "der" stehen können
        { atStep: 3, alts: [
            { token: 'eine', dir: { dx: 0.01, dy: 0.06 } },
            { token: 'der', dir: { dx: 0.01, dy: -0.06 } },
        ]},
        // Index 4: "Drache" – große Gabelung (König, Mädchen, Zauberer via branches)
        // Zusätzlich noch kleinere Alternativen
        { atStep: 4, alts: [
            { token: 'Ritter', dir: { dx: 0.01, dy: 0.05 } },
            { token: 'Riese', dir: { dx: 0.01, dy: -0.04 } },
        ]},
        // Index 5: ","
        { atStep: 5, alts: [
            { token: '.', dir: { dx: 0.01, dy: 0.03 } },
            { token: 'namens', dir: { dx: 0.01, dy: -0.03 } },
        ]},
        // Index 6: "der" – Relativpronomen
        { atStep: 6, alts: [
            { token: 'welcher', dir: { dx: 0.01, dy: 0.05 } },
            { token: 'und', dir: { dx: 0.01, dy: -0.04 } },
        ]},
        // Index 7: "über"
        { atStep: 7, alts: [
            { token: 'durch', dir: { dx: 0.01, dy: 0.05 } },
            { token: 'in', dir: { dx: 0.01, dy: -0.04 } },
            { token: 'unter', dir: { dx: 0.02, dy: 0.06 } },
        ]},
        // Index 8: "die" – Artikel
        { atStep: 8, alts: [
            { token: 'den', dir: { dx: 0.01, dy: 0.05 } },
            { token: 'das', dir: { dx: 0.01, dy: -0.05 } },
        ]},
        // Index 9: "Berge" – große Gabelung (Wälder, Meere via branches)
        // Zusätzlich kleinere Alternativen
        { atStep: 9, alts: [
            { token: 'Täler', dir: { dx: 0.01, dy: 0.05 } },
            { token: 'Wolken', dir: { dx: 0.01, dy: -0.05 } },
        ]},
        // Index 10: "flog"
        { atStep: 10, alts: [
            { token: 'glitt', dir: { dx: 0.01, dy: 0.04 } },
            { token: 'schwebte', dir: { dx: 0.01, dy: -0.04 } },
        ]},
        // Index 11: "."
        { atStep: 11, alts: [
            { token: ',', dir: { dx: 0.01, dy: 0.03 } },
        ]},
    ];

    // ── Große Branches mit divergierenden Pfaden + Sub-Splits ──
    const branches = [
        {
            atStep: 3,
            chosen: 'Drache',
            alternatives: [
                {
                    token: 'König',
                    path: [
                        { x: 0.33, y: 0.57 },
                        { x: 0.40, y: 0.63 },
                        { x: 0.47, y: 0.68 },
                        { x: 0.55, y: 0.72 },
                        { x: 0.63, y: 0.75 },
                        { x: 0.72, y: 0.77 },
                        { x: 0.82, y: 0.78 },
                        { x: 0.92, y: 0.79 },
                    ],
                    futureTokens: ['König', ',', 'der', 'sein', 'Volk', 'regierte', '…'],
                    entropy: 0.60,
                    // Sub-Splits auf diesem Pfad (an jedem Punkt)
                    subSplits: [
                        { atLocal: 1, alts: [{ token: 'und', dir: { dx: 0, dy: 0.04 } }] },
                        { atLocal: 2, alts: [{ token: 'welcher', dir: { dx: 0, dy: 0.04 } }, { token: 'dessen', dir: { dx: 0, dy: -0.03 } }] },
                        { atLocal: 3, alts: [{ token: 'das', dir: { dx: 0, dy: 0.04 } }, { token: 'ein', dir: { dx: 0, dy: -0.04 } }] },
                        { atLocal: 4, alts: [{ token: 'Reich', dir: { dx: 0, dy: 0.04 } }, { token: 'Land', dir: { dx: 0, dy: -0.03 } }] },
                        { atLocal: 5, alts: [{ token: 'beherrschte', dir: { dx: 0, dy: 0.04 } }] },
                    ],
                },
                {
                    token: 'Mädchen',
                    path: [
                        { x: 0.33, y: 0.28 },
                        { x: 0.40, y: 0.22 },
                        { x: 0.47, y: 0.18 },
                        { x: 0.55, y: 0.15 },
                        { x: 0.63, y: 0.13 },
                        { x: 0.72, y: 0.12 },
                        { x: 0.82, y: 0.12 },
                        { x: 0.92, y: 0.13 },
                    ],
                    futureTokens: ['Mädchen', ',', 'das', 'im', 'Wald', 'lebte', '…'],
                    entropy: 0.55,
                    subSplits: [
                        { atLocal: 1, alts: [{ token: 'das', dir: { dx: 0, dy: -0.03 } }] },
                        { atLocal: 2, alts: [{ token: 'welches', dir: { dx: 0, dy: -0.04 } }] },
                        { atLocal: 3, alts: [{ token: 'am', dir: { dx: 0, dy: -0.03 } }, { token: 'beim', dir: { dx: 0, dy: 0.03 } }] },
                        { atLocal: 4, alts: [{ token: 'Turm', dir: { dx: 0, dy: -0.04 } }, { token: 'Schloss', dir: { dx: 0, dy: 0.04 } }] },
                        { atLocal: 5, alts: [{ token: 'wohnte', dir: { dx: 0, dy: -0.03 } }] },
                    ],
                },
                {
                    token: 'Zauberer',
                    path: [
                        { x: 0.35, y: 0.53 },
                        { x: 0.43, y: 0.58 },
                        { x: 0.51, y: 0.61 },
                        { x: 0.59, y: 0.63 },
                        { x: 0.67, y: 0.64 },
                        { x: 0.76, y: 0.64 },
                        { x: 0.84, y: 0.63 },
                        { x: 0.92, y: 0.62 },
                    ],
                    futureTokens: ['Zauberer', ',', 'der', 'Sterne', 'beschwor', '…'],
                    entropy: 0.52,
                    subSplits: [
                        { atLocal: 1, alts: [{ token: 'und', dir: { dx: 0, dy: 0.04 } }] },
                        { atLocal: 2, alts: [{ token: 'welcher', dir: { dx: 0, dy: 0.04 } }] },
                        { atLocal: 3, alts: [{ token: 'Tränke', dir: { dx: 0, dy: 0.05 } }, { token: 'Flüche', dir: { dx: 0, dy: -0.04 } }] },
                        { atLocal: 4, alts: [{ token: 'braute', dir: { dx: 0, dy: 0.04 } }] },
                    ],
                },
            ]
        },
        {
            atStep: 8,
            chosen: 'Berge',
            alternatives: [
                {
                    token: 'Wälder',
                    path: [
                        { x: 0.72, y: 0.48 },
                        { x: 0.82, y: 0.53 },
                        { x: 0.92, y: 0.56 },
                    ],
                    futureTokens: ['Wälder', 'streifte', '…'],
                    entropy: 0.58,
                    subSplits: [
                        { atLocal: 1, alts: [{ token: 'flog', dir: { dx: 0, dy: 0.04 } }, { token: 'jagte', dir: { dx: 0, dy: -0.03 } }] },
                    ],
                },
                {
                    token: 'Meere',
                    path: [
                        { x: 0.72, y: 0.24 },
                        { x: 0.82, y: 0.20 },
                        { x: 0.92, y: 0.18 },
                    ],
                    futureTokens: ['Meere', 'segelte', '…'],
                    entropy: 0.53,
                    subSplits: [
                        { atLocal: 1, alts: [{ token: 'flog', dir: { dx: 0, dy: -0.03 } }, { token: 'glitt', dir: { dx: 0, dy: 0.03 } }] },
                    ],
                },
            ]
        }
    ];

    // ── Schritte ───────────────────────────────────────────────
    const GEN_TOKENS = generated.length; // 9
    const TOTAL_STEPS = GEN_TOKENS + 1; // 10 (letzter = Temp-Demo)

    const BASE_TEMP = 0.7;
    const HIGH_TEMP = 1.8;

    function getDisplayTarget(step) {
        if (step < GEN_TOKENS) {
            return { step: step + prompt.length, temperature: BASE_TEMP, phase: 'generate' };
        } else {
            return { step: prompt.length + 1, temperature: HIGH_TEMP, phase: 'temp-demo' };
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
        return currentStep < TOTAL_STEPS - 1;
    }

    function canGoPrev() {
        if (!isOnIsoSlide()) return false;
        return currentStep > 0;
    }

    function next() {
        if (!canGoNext()) return;
        currentStep++;
        if (tweenActive) finishTween();
        startTween();
    }

    function prev() {
        if (!canGoPrev()) return;
        currentStep--;
        if (tweenActive) finishTween();
        startTween();
    }

    function reset() {
        currentStep = 0;
        tweenActive = false;
        displayState = { step: prompt.length, temperature: BASE_TEMP, phase: 'generate' };
        if (canvas) render();
        updateInfoPanel();
    }

    // ── Tween Engine ───────────────────────────────────────────
    function finishTween() {
        displayState.step = tweenTo.step;
        displayState.temperature = tweenTo.temperature;
        displayState.phase = tweenTo.phase;
        tweenActive = false;
    }

    function startTween() {
        const target = getDisplayTarget(currentStep);
        tweenFrom = { ...displayState };
        tweenTo = target;
        tweenStart = performance.now();
        tweenActive = true;
        requestAnimationFrame(tweenLoop);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function tweenLoop() {
        if (!tweenActive) return;
        const elapsed = performance.now() - tweenStart;
        const duration = 500;
        let t = Math.min(elapsed / duration, 1.0);
        const eased = easeOutCubic(t);

        displayState.step = tweenFrom.step + (tweenTo.step - tweenFrom.step) * eased;
        displayState.temperature = tweenFrom.temperature + (tweenTo.temperature - tweenFrom.temperature) * eased;
        displayState.phase = tweenTo.phase;

        render();
        updateInfoPanel();

        if (t >= 1.0) {
            finishTween();
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

        displayState = { step: prompt.length, temperature: BASE_TEMP, phase: 'generate' };
        render();
        updateInfoPanel();
    }

    // ── Rendering ──────────────────────────────────────────────
    function render() {
        if (!ctx) return;

        const step = displayState.step;
        const temp = displayState.temperature;
        const visibleStep = Math.floor(step);
        const phase = displayState.phase;

        const hueBase = phase === 'temp-demo' ? 280 : 220;
        const mainColor = phase === 'temp-demo' ? '#a78bfa' : '#60a5fa';
        const envelopeRgba = phase === 'temp-demo' ? 'rgba(167, 139, 250, ' : 'rgba(96, 165, 250, ';

        // Clear
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(51,65,85,0.12)';
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx < W; gx += 60) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 60) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }

        function toCanvas(p) { return { x: p.x * W, y: p.y * H }; }

        // ── Mini-Splits auf dem Hauptpfad ──────────────────────
        miniSplits.forEach(ms => {
            if (visibleStep >= ms.atStep) {
                const origin = toCanvas(path[ms.atStep]);
                const age = visibleStep - ms.atStep;
                const fade = Math.max(0.08, 0.7 - age * 0.08);
                ms.alts.forEach(alt => {
                    drawMiniSplit(origin, alt, temp, fade);
                });
            }
        });

        // ── Große divergierende Pfade + Sub-Splits ─────────────
        branches.forEach(branch => {
            if (visibleStep >= branch.atStep) {
                const stepsAfterBranch = visibleStep - branch.atStep;
                const branchOrigin = toCanvas(path[branch.atStep]);

                branch.alternatives.forEach(alt => {
                    const maxPoints = Math.min(stepsAfterBranch, alt.path.length);
                    if (maxPoints < 1) return;

                    const fadeBase = Math.max(0.06, 0.50 - stepsAfterBranch * 0.04);

                    // Divergierender Pfad
                    ctx.beginPath();
                    ctx.moveTo(branchOrigin.x, branchOrigin.y);
                    for (let i = 0; i < maxPoints; i++) {
                        const dp = toCanvas(alt.path[i]);
                        ctx.lineTo(dp.x, dp.y);
                    }
                    ctx.strokeStyle = `rgba(251, 191, 36, ${fadeBase})`;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Envelope am letzten Punkt
                    const lastPt = toCanvas(alt.path[maxPoints - 1]);
                    const altEnvelope = alt.entropy * temp * 30 * Math.max(0.2, 1 - stepsAfterBranch * 0.05);

                    ctx.beginPath();
                    ctx.arc(lastPt.x, lastPt.y, altEnvelope, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(251, 191, 36, ${fadeBase * 0.08})`;
                    ctx.fill();
                    ctx.strokeStyle = `rgba(251, 191, 36, ${fadeBase * 0.35})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Token-Labels entlang des Pfads
                    for (let i = 0; i < maxPoints; i++) {
                        const pt = toCanvas(alt.path[i]);
                        const ptFade = Math.max(0.04, fadeBase - i * 0.03);
                        if (ptFade > 0.06 && alt.futureTokens[i]) {
                            ctx.font = `${Math.max(8, 10 - i * 0.3)}px system-ui, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.fillStyle = `rgba(251, 191, 36, ${ptFade})`;
                            ctx.fillText(alt.futureTokens[i], pt.x, pt.y - 10);
                        }
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(251, 191, 36, ${ptFade * 0.6})`;
                        ctx.fill();

                        // ── Sub-Splits auf dem Alternativpfad ──────
                        if (alt.subSplits) {
                            alt.subSplits.forEach(ss => {
                                if (ss.atLocal === i) {
                                    const subFade = Math.max(0.12, ptFade * 0.8);
                                    ss.alts.forEach(subAlt => {
                                        const subTarget = { x: pt.x + subAlt.dir.dx * W * 2, y: pt.y + subAlt.dir.dy * H * 2 };

                                        ctx.beginPath();
                                        ctx.moveTo(pt.x, pt.y);
                                        ctx.lineTo(subTarget.x, subTarget.y);
                                        ctx.strokeStyle = `rgba(251, 146, 60, ${subFade * 0.5})`;
                                        ctx.lineWidth = 0.8;
                                        ctx.setLineDash([2, 3]);
                                        ctx.stroke();
                                        ctx.setLineDash([]);

                                        ctx.beginPath();
                                        ctx.arc(subTarget.x, subTarget.y, 2, 0, Math.PI * 2);
                                        ctx.fillStyle = `rgba(251, 146, 60, ${subFade * 0.6})`;
                                        ctx.fill();

                                        if (subFade > 0.1) {
                                            const label = subAlt.token;
                                            ctx.font = '8px system-ui, sans-serif';
                                            ctx.textAlign = 'center';
                                            const tw = ctx.measureText(label).width;
                                            // Hintergrund für Lesbarkeit
                                            ctx.fillStyle = `rgba(15, 23, 42, ${subFade * 0.6})`;
                                            ctx.fillRect(subTarget.x - tw / 2 - 2, subTarget.y - 13, tw + 4, 11);
                                            // Text in Orange statt Pink (besser lesbar)
                                            ctx.fillStyle = `rgba(253, 186, 116, ${Math.min(1, subFade * 1.3)})`;
                                            ctx.fillText(label, subTarget.x, subTarget.y - 4);
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });

        // ── Main envelope ──────────────────────────────────────
        const baseWidth = 75;
        if (visibleStep >= 1) {
            const upperPath = [];
            const lowerPath = [];

            for (let i = 0; i <= visibleStep && i < path.length; i++) {
                const cp = toCanvas(path[i]);
                let envelope = entropy[i] * temp * baseWidth;

                let dx = 0, dy = -1;
                if (i < path.length - 1) {
                    const nxt = toCanvas(path[i + 1]);
                    const tdx = nxt.x - cp.x;
                    const tdy = nxt.y - cp.y;
                    const len = Math.hypot(tdx, tdy);
                    if (len > 0) { dx = -tdy / len; dy = tdx / len; }
                } else if (i > 0) {
                    const prev2 = toCanvas(path[i - 1]);
                    const tdx = cp.x - prev2.x;
                    const tdy = cp.y - prev2.y;
                    const len = Math.hypot(tdx, tdy);
                    if (len > 0) { dx = -tdy / len; dy = tdx / len; }
                }

                upperPath.push({ x: cp.x + dx * envelope, y: cp.y + dy * envelope });
                lowerPath.push({ x: cp.x - dx * envelope, y: cp.y - dy * envelope });
            }

            // Glow
            for (let layer = 3; layer >= 0; layer--) {
                const scale = 1 + layer * 0.3;
                const alpha = 0.012 + (3 - layer) * 0.015;
                ctx.beginPath();
                upperPath.forEach((p, i) => {
                    const cp = toCanvas(path[i]);
                    const ex = cp.x + (p.x - cp.x) * scale;
                    const ey = cp.y + (p.y - cp.y) * scale;
                    if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
                });
                for (let i = lowerPath.length - 1; i >= 0; i--) {
                    const cp = toCanvas(path[i]);
                    const p = lowerPath[i];
                    const ex = cp.x + (p.x - cp.x) * scale;
                    const ey = cp.y + (p.y - cp.y) * scale;
                    ctx.lineTo(ex, ey);
                }
                ctx.closePath();
                ctx.fillStyle = `hsla(${hueBase}, 70%, 55%, ${alpha})`;
                ctx.fill();
            }

            // Inner envelope
            ctx.beginPath();
            upperPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            for (let i = lowerPath.length - 1; i >= 0; i--) ctx.lineTo(lowerPath[i].x, lowerPath[i].y);
            ctx.closePath();
            ctx.fillStyle = envelopeRgba + '0.05)';
            ctx.fill();
            ctx.strokeStyle = envelopeRgba + '0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // ── Main trajectory ────────────────────────────────────
        if (visibleStep >= 1) {
            ctx.beginPath();
            for (let i = 0; i <= visibleStep && i < path.length; i++) {
                const cp = toCanvas(path[i]);
                if (i === 0) ctx.moveTo(cp.x, cp.y); else ctx.lineTo(cp.x, cp.y);
            }
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.strokeStyle = envelopeRgba + '0.15)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // ── Token nodes ────────────────────────────────────────
        for (let i = 0; i <= visibleStep && i < allTokens.length; i++) {
            const cp = toCanvas(path[i]);
            const ent = entropy[i];
            const radius = 4 + ent * temp * 4;
            const isPrompt = i < prompt.length;

            ctx.beginPath();
            ctx.arc(cp.x, cp.y, radius + 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(148, 163, 184, ${0.04 + ent * 0.04})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cp.x, cp.y, radius, 0, Math.PI * 2);
            if (isPrompt) {
                ctx.fillStyle = '#94a3b8';
            } else {
                const nodeHue = 220 - ent * 180;
                ctx.fillStyle = `hsl(${nodeHue}, 75%, 58%)`;
            }
            ctx.fill();
            ctx.strokeStyle = isPrompt ? '#cbd5e1' : '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label
            ctx.font = isPrompt ? '11px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = isPrompt ? '#94a3b8' : '#e2e8f0';
            ctx.fillText(allTokens[i], cp.x, cp.y - radius - 9);

            // "User Input" label for prompt tokens
            if (isPrompt && i === 0) {
                ctx.font = '9px system-ui, sans-serif';
                ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.fillText('User-Input →', cp.x - 2, cp.y + radius + 14);
            }
        }

        // ── Mini-Splits an jedem generierten Token ─────────────
        miniSplits.forEach(ms => {
            if (visibleStep >= ms.atStep) {
                const origin = toCanvas(path[ms.atStep]);
                const age = visibleStep - ms.atStep;
                const fade = Math.max(0.06, 0.65 - age * 0.07);
                ms.alts.forEach(alt => {
                    drawMiniSplit(origin, alt, temp, fade);
                });
            }
        });

        // ── HUD ────────────────────────────────────────────────
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = mainColor;
        ctx.fillText(`Temperatur: ${temp.toFixed(2)}`, 14, 24);

        // Temperature bar
        const barWidth = 120;
        const barX = 14;
        const barY = 32;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        ctx.fillRect(barX, barY, barWidth, 6);
        const fillWidth = Math.min(1, (temp - 0.2) / 2.0) * barWidth;
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        barGrad.addColorStop(0, '#3b82f6');
        barGrad.addColorStop(0.5, '#8b5cf6');
        barGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = barGrad;
        ctx.fillRect(barX, barY, fillWidth, 6);

        let tempLabel;
        if (temp < 0.6) tempLabel = '❄️ Sehr fokussiert';
        else if (temp < 1.0) tempLabel = '🧊 Fokussiert – enger Tunnel';
        else if (temp < 1.4) tempLabel = '🌡️ Warm – weiter Tunnel';
        else tempLabel = '🔥 Heiß – sehr weiter Tunnel';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillText(tempLabel, 14, 52);

        // Phase indicator
        ctx.textAlign = 'right';
        ctx.font = 'bold 11px system-ui, sans-serif';
        if (phase === 'temp-demo') {
            ctx.fillStyle = '#a78bfa';
            ctx.fillText('🔥 Temperature-Demo: Was wäre bei T=1.8?', W - 14, 24);
        } else {
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.fillText(`Schritt ${currentStep + 1} / ${TOTAL_STEPS}`, W - 14, 24);
        }

        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.fillText('→ Pfeiltaste für nächstes Token', W - 14, 40);

        // ── Entropy bar ────────────────────────────────────────
        if (visibleStep < allTokens.length) {
            const eBarX = W - 34;
            const eBarH = H - 90;
            const eBarW = 10;
            const eBarY = 55;

            ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
            ctx.fillRect(eBarX - 2, eBarY - 2, eBarW + 4, eBarH + 4);

            const grad = ctx.createLinearGradient(0, eBarY, 0, eBarY + eBarH);
            grad.addColorStop(0, '#3b82f6');
            grad.addColorStop(0.5, '#8b5cf6');
            grad.addColorStop(1, '#f59e0b');
            ctx.fillStyle = grad;
            ctx.fillRect(eBarX, eBarY, eBarW, eBarH);

            const currentEntropy = entropy[visibleStep] || 0;
            const effectiveEntropy = Math.min(1, currentEntropy * temp);
            const markerY = eBarY + (1 - effectiveEntropy) * eBarH;

            ctx.beginPath();
            ctx.moveTo(eBarX - 5, markerY);
            ctx.lineTo(eBarX, markerY - 3);
            ctx.lineTo(eBarX, markerY + 3);
            ctx.closePath();
            ctx.fillStyle = '#fff';
            ctx.fill();

            ctx.font = '8px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Sicher', eBarX + eBarW / 2, eBarY - 6);
            ctx.fillText('Unsicher', eBarX + eBarW / 2, eBarY + eBarH + 12);
        }
    }

    function drawMiniSplit(origin, alt, temp, fade) {
        const target = { x: origin.x + alt.dir.dx * W * 2.5, y: origin.y + alt.dir.dy * H * 2.5 };

        // Gestrichelte Linie
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(148, 163, 184, ${fade * 0.5})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Kleiner Punkt
        ctx.beginPath();
        ctx.arc(target.x, target.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${fade * 0.5})`;
        ctx.fill();

        // Label mit Hintergrund für Lesbarkeit
        if (fade > 0.08) {
            const label = alt.token;
            ctx.font = '9px system-ui, sans-serif';
            ctx.textAlign = 'center';
            const textWidth = ctx.measureText(label).width;
            // Hintergrund
            ctx.fillStyle = `rgba(15, 23, 42, ${fade * 0.7})`;
            ctx.fillRect(target.x - textWidth / 2 - 3, target.y - 14, textWidth + 6, 12);
            // Text
            ctx.fillStyle = `rgba(203, 213, 225, ${Math.min(1, fade * 1.2)})`;
            ctx.fillText(label, target.x, target.y - 5);
        }
    }

    // ── Info Panel ─────────────────────────────────────────────
    function updateInfoPanel() {
        const sentenceDisplay = document.getElementById('iso-tunnel-sentence');
        const infoDisplay = document.getElementById('iso-tunnel-info');
        if (!sentenceDisplay || !infoDisplay) return;

        const visibleStep = Math.min(Math.floor(displayState.step), allTokens.length - 1);
        const temp = displayState.temperature;
        const phase = displayState.phase;

        // Sentence display: Prompt immer sichtbar, generierte Tokens nur bis visibleStep
        let html = '';
        prompt.forEach(token => {
            html += `<span style="color:#94a3b8; font-style:italic;">${token}</span> `;
        });

        for (let i = 0; i < generated.length; i++) {
            const globalIdx = i + prompt.length;
            if (globalIdx < visibleStep) {
                html += `<span style="color:#1e293b; font-weight:bold;">${generated[i]}</span> `;
            } else if (globalIdx === visibleStep) {
                const ent = entropy[globalIdx];
                const hue = 220 - ent * 180;
                html += `<span style="background:hsl(${hue},80%,92%); color:hsl(${hue},80%,30%); font-weight:bold; padding:2px 6px; border-radius:4px; border:2px solid hsl(${hue},80%,60%);">${generated[i]}</span> `;
            } else {
                html += `<span style="color:#e2e8f0;">?</span> `;
            }
        }
        sentenceDisplay.innerHTML = html;

        // Info
        const currentEntropy = entropy[visibleStep] || 0;
        const effective = Math.min(1, currentEntropy * temp);
        const tunnelPct = (effective * 100).toFixed(0);

        let certainty, certColor;
        if (effective < 0.10) { certainty = 'Fast sicher'; certColor = '#3b82f6'; }
        else if (effective < 0.28) { certainty = 'Zuversichtlich'; certColor = '#10b981'; }
        else if (effective < 0.50) { certainty = 'Moderat'; certColor = '#f59e0b'; }
        else { certainty = 'Weit offen'; certColor = '#ef4444'; }

        // Branch info
        let branchHtml = '';
        branches.forEach(branch => {
            if (branch.atStep === visibleStep) {
                branchHtml += `<div style="margin-top:8px; padding:6px 8px; background:rgba(251,191,36,0.1); border-radius:4px; border-left:3px solid #fbbf24;">
                    <b style="color:#f59e0b;">🔀 Gabelung!</b><br>
                    <span style="color:#475569; font-size:0.82em;">Gewählt: <b>${branch.chosen}</b></span><br>`;
                branch.alternatives.forEach(alt => {
                    branchHtml += `<span style="color:#f59e0b; font-size:0.82em;">→ "${alt.token}" (verworfen)</span><br>`;
                });
                branchHtml += `</div>`;
            }
        });

        // Mini-split info
        let splitHtml = '';
        miniSplits.forEach(ms => {
            if (ms.atStep === visibleStep && ms.alts.length > 0) {
                splitHtml += `<div style="margin-top:6px; padding:5px 8px; background:rgba(148,163,184,0.08); border-radius:4px; font-size:0.78em; color:#94a3b8;">
                    <span style="color:#64748b;">Alternativen:</span> `;
                ms.alts.forEach((alt, i) => {
                    splitHtml += `"${alt.token}"`;
                    if (i < ms.alts.length - 1) splitHtml += ', ';
                });
                splitHtml += `</div>`;
            }
        });

        // Diverging paths info
        let divergeHtml = '';
        branches.forEach(branch => {
            if (visibleStep > branch.atStep) {
                const dist = visibleStep - branch.atStep;
                if (dist <= branch.alternatives[0].path.length) {
                    divergeHtml += `<div style="margin-top:6px; padding:5px 8px; background:rgba(251,191,36,0.05); border-radius:4px; font-size:0.78em; color:#94a3b8;">
                        <span style="color:#f59e0b;">⤳</span> Verworfene Pfade entfernen sich:<br>`;
                    branch.alternatives.forEach(alt => {
                        const futureToken = alt.futureTokens && alt.futureTokens[dist] ? alt.futureTokens[dist] : '…';
                        divergeHtml += `<span style="color:#fbbf24; font-size:0.9em;">"${alt.token}" → "${futureToken}"</span><br>`;
                    });
                    divergeHtml += `</div>`;
                }
            }
        });

        // Temperature demo info
        let tempDemoHtml = '';
        if (phase === 'temp-demo') {
            tempDemoHtml = `<div style="margin-top:8px; padding:6px 8px; background:rgba(167,139,250,0.1); border-radius:4px; border-left:3px solid #a78bfa;">
                <b style="color:#7c3aed;">🔥 Temperature-Demo</b><br>
                <span style="color:#475569; font-size:0.82em;">Gleicher Punkt, aber T=1.8 statt T=0.7.<br>
                Der Tunnel ist jetzt viel weiter → "Mädchen" oder "Zauberer" wären genauso plausibel gewesen!</span>
            </div>`;
        }

        const mainCol = phase === 'temp-demo' ? '#a78bfa' : '#60a5fa';

        infoDisplay.innerHTML = `
            <div style="margin-bottom:6px;">
                <b>Token:</b> <span style="font-size:1.1em; font-weight:bold;">"${allTokens[visibleStep]}"</span>
            </div>
            <div style="margin-bottom:4px;">
                <b>Entropie:</b> ${currentEntropy.toFixed(2)} × T${temp.toFixed(1)} = <b>${effective.toFixed(2)}</b>
            </div>
            <div style="margin-bottom:4px;">
                <b>Tunnelbreite:</b>
                <div style="background:#1e293b; border-radius:4px; height:8px; width:100%; margin-top:2px; overflow:hidden;">
                    <div style="background:linear-gradient(90deg, ${mainCol}, ${mainCol}88); height:100%; width:${tunnelPct}%; border-radius:4px; transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="margin-bottom:4px;">
                <b>Sicherheit:</b> <span style="color:${certColor}; font-weight:bold;">${certainty}</span>
            </div>
            ${branchHtml}
            ${splitHtml}
            ${divergeHtml}
            ${tempDemoHtml}
            <hr style="border:none; border-top:1px solid #e2e8f0; margin:6px 0;">
            <div style="font-size:0.72em; color:#94a3b8;">
                Schritt ${currentStep + 1} / ${TOTAL_STEPS} ${phase === 'temp-demo' ? '(🔥 Was wäre bei hoher Temperatur?)' : ''}
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
