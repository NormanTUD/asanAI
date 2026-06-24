// ============================================================
// POSITIONAL ENCODING ORBIT VISUALIZATION v4
// Fixes: aggressive re-render, context words, grayed-out base
// ============================================================

const PEOrbitViz = (() => {
    const WORD = "Katze";
    const BASE_EMBEDDING = [0.7, 0.3];
    const D_MODEL = 64;
    const MAX_POS = 12;
    let currentStep = 0;
    let renderTimer = null;

    const TOTAL_STEPS = MAX_POS + 2;

    // Context words — other tokens in the embedding space (outside the orbit)
    const CONTEXT_WORDS = [
    ];

    const POS_COLORS = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#f97316', '#14b8a6', '#a855f7', '#e11d48'
    ];

    function computePE(pos) {
        const freq = 1.0 / Math.pow(10000, 0 / D_MODEL);
        return [
            Math.sin(pos * freq) * 0.35,
            Math.cos(pos * freq) * 0.35
        ];
    }

    function finalVector(pos) {
        const pe = computePE(pos);
        return [BASE_EMBEDDING[0] + pe[0], BASE_EMBEDDING[1] + pe[1]];
    }

    function textPos(pos) {
        const angle = pos * (1.0 / Math.pow(10000, 0 / D_MODEL));
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        if (cos > 0.5) return 'top center';
        if (sin > 0.5) return 'middle right';
        if (cos < -0.5) return 'bottom center';
        return 'middle left';
    }

    function render() {
        const plotDiv = document.getElementById('pe-orbit-plot');
        if (!plotDiv) return;

        if (plotDiv.offsetWidth === 0 || plotDiv.offsetHeight === 0) {
            if (renderTimer) clearTimeout(renderTimer);
            renderTimer = setTimeout(render, 150);
            return;
        }

        renderPlot();
        renderCaption();
    }

    function renderPlot() {
        const plotDiv = document.getElementById('pe-orbit-plot');
        if (!plotDiv || plotDiv.offsetWidth === 0) return;

        const traces = [];

        // 1. Context words — always visible, faded
        const cwX = [], cwY = [], cwText = [];
        CONTEXT_WORDS.forEach(cw => {
            cwX.push(cw.pos[0]);
            cwY.push(cw.pos[1]);
            cwText.push(cw.word);
        });
        traces.push({
            x: cwX, y: cwY,
            mode: 'markers+text',
            marker: { size: 9, color: '#cbd5e1', symbol: 'circle', opacity: 0.5 },
            text: cwText,
            textposition: 'top center',
            textfont: { size: 10, color: '#94a3b8', family: 'system-ui, sans-serif' },
            hovertemplate: '%{text}<extra></extra>',
            showlegend: false
        });

        // 2. Orbit circle (from step 1)
        if (currentStep >= 1) {
            const cx = [], cy = [];
            for (let t = 0; t <= 120; t++) {
                const a = (t / 120) * 2 * Math.PI;
                cx.push(BASE_EMBEDDING[0] + Math.sin(a) * 0.35);
                cy.push(BASE_EMBEDDING[1] + Math.cos(a) * 0.35);
            }
            traces.push({
                x: cx, y: cy,
                mode: 'lines',
                line: { color: '#e2e8f0', width: 1.5, dash: 'dot' },
                hoverinfo: 'none', showlegend: false
            });
        }

        // 3. Base embedding — grayed out after first position shown
        const baseGrayed = currentStep >= 2;
        traces.push({
            x: [BASE_EMBEDDING[0]], y: [BASE_EMBEDDING[1]],
            mode: 'markers+text',
            marker: {
                size: currentStep === 0 ? 22 : 15,
                color: baseGrayed ? '#94a3b8' : '#1e293b',
                symbol: 'star',
                opacity: baseGrayed ? 0.4 : 1,
                line: { width: 2, color: baseGrayed ? '#cbd5e1' : '#fbbf24' }
            },
            text: [`"${WORD}"`],
            textposition: 'bottom center',
            textfont: {
                size: currentStep === 0 ? 14 : 11,
                color: baseGrayed ? '#94a3b8' : '#1e293b',
                family: 'system-ui, sans-serif'
            },
            hovertemplate: `<b>Embedding "${WORD}"</b><br>[${BASE_EMBEDDING[0]}, ${BASE_EMBEDDING[1]}]<extra></extra>`,
            showlegend: false
        });

        // 4. Position dots
        if (currentStep >= 1) {
            const shownPositions = Math.min(currentStep, MAX_POS);
            const isSummary = currentStep > MAX_POS;

            for (let p = 0; p < shownPositions; p++) {
                const vec = finalVector(p);
                const isCurrent = (p === shownPositions - 1) && !isSummary;

                const label = isCurrent ? `"${WORD}" @ Pos ${p}` : (isSummary ? `Pos ${p}` : '');

                traces.push({
                    x: [vec[0]], y: [vec[1]],
                    mode: 'markers+text',
                    marker: {
                        size: isCurrent ? 14 : (isSummary ? 10 : 8),
                        color: POS_COLORS[p],
                        opacity: isCurrent ? 1 : (isSummary ? 0.85 : 0.4),
                        line: { width: isCurrent ? 2.5 : 1, color: isCurrent ? '#1e293b' : 'rgba(255,255,255,0.6)' }
                    },
                    text: [label],
                    textposition: textPos(p),
                    textfont: {
                        size: isCurrent ? 11 : 9,
                        color: isCurrent ? POS_COLORS[p] : '#64748b',
                        family: 'system-ui, sans-serif'
                    },
                    hovertemplate: `<b>"${WORD}" @ Pos ${p}</b><br>[${vec[0].toFixed(3)}, ${vec[1].toFixed(3)}]<extra></extra>`,
                    showlegend: false
                });

                // Line from center to current point
                if (isCurrent) {
                    traces.push({
                        x: [BASE_EMBEDDING[0], vec[0]],
                        y: [BASE_EMBEDDING[1], vec[1]],
                        mode: 'lines',
                        line: { color: POS_COLORS[p], width: 2 },
                        hoverinfo: 'none', showlegend: false, opacity: 0.5
                    });
                }
            }

            // Summary: connect dots
            if (isSummary) {
                const px = [], py = [];
                for (let p = 0; p < MAX_POS; p++) {
                    const v = finalVector(p);
                    px.push(v[0]); py.push(v[1]);
                }
                traces.push({
                    x: px, y: py,
                    mode: 'lines',
                    line: { color: '#cbd5e1', width: 1.5, dash: 'dot' },
                    hoverinfo: 'none', showlegend: false
                });
            }
        }

        const layout = {
            margin: { l: 45, r: 25, b: 45, t: 25 },
            xaxis: {
                title: { text: 'Dimension 0', font: { size: 11, color: '#94a3b8' } },
                range: [-0.6, 1.7],
                gridcolor: '#f8fafc', zeroline: false,
                tickfont: { size: 9, color: '#cbd5e1' }
            },
            yaxis: {
                title: { text: 'Dimension 1', font: { size: 11, color: '#94a3b8' } },
                range: [-0.7, 1.1],
                gridcolor: '#f8fafc', zeroline: false, scaleanchor: 'x',
                tickfont: { size: 9, color: '#cbd5e1' }
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            showlegend: false
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
    }

    function renderCaption() {
        const div = document.getElementById('pe-orbit-caption');
        if (!div) return;

        let html = '';

        if (currentStep === 0) {
            html = `
                <span style="color:#1e293b;"><b>★ "${WORD}"</b> = Embedding-Punkt <code>[${BASE_EMBEDDING[0]}, ${BASE_EMBEDDING[1]}]</code></span>
            `;
        } else if (currentStep <= MAX_POS) {
            const pos = currentStep - 1;
            const pe = computePE(pos);
            const vec = finalVector(pos);
            html = `
                <span style="color:${POS_COLORS[pos]}; font-weight:bold;">"${WORD}" @ Position ${pos}</span>
                <span style="color:#475569;">
                    = [${BASE_EMBEDDING[0]}, ${BASE_EMBEDDING[1]}]
                    <span style="color:${POS_COLORS[pos]};">+ [${pe[0] >= 0 ? '+' : ''}${pe[0].toFixed(3)}, ${pe[1] >= 0 ? '+' : ''}${pe[1].toFixed(3)}]</span>
                    → <b>[${vec[0].toFixed(3)}, ${vec[1].toFixed(3)}]</b>
                </span>
            `;
        } else {
            html = `
                <span style="color:#1e293b; font-weight:bold;">✓ 12 Positionen — 12 einzigartige Punkte auf der Kreisbahn.</span><br>
                <span style="color:#64748b;">Das Token bleibt in der Nähe seiner Bedeutung, aber jede Position hat einen eigenen Fingerabdruck.</span>
            `;
        }

        div.innerHTML = html;
    }

    function next() {
        if (currentStep < TOTAL_STEPS - 1) { currentStep++; render(); }
    }

    function prev() {
        if (currentStep > 0) { currentStep--; render(); }
    }

    function reset() {
        currentStep = 0;
    }

    function canGoNext() {
        return isOnPEOrbitSlide() && currentStep < TOTAL_STEPS - 1;
    }

    function canGoPrev() {
        return isOnPEOrbitSlide() && currentStep > 0;
    }

    function isOnPEOrbitSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.querySelector('#pe-orbit-plot') !== null;
    }

    function init() {
        render();
    }

    // Aggressive re-render on slide change
    function watchSlides() {
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'class' && m.target.classList && m.target.classList.contains('slide')) {
                    if (m.target.classList.contains('active') && m.target.querySelector('#pe-orbit-plot')) {
                        setTimeout(render, 80);
                        setTimeout(render, 300);
                    }
                }
            }
        });

        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => {
            observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            watchSlides();
            setTimeout(() => { if (isOnPEOrbitSlide()) render(); }, 300);
        });
    } else {
        setTimeout(() => {
            watchSlides();
            if (isOnPEOrbitSlide()) render();
        }, 200);
    }

    return { next, prev, reset, render, init, canGoNext, canGoPrev, isOnPEOrbitSlide };
})();
