const NormLab = {
    data: [
        [10, 2, 8, 5],
        [40, 10, 32, 25],
        [15, 25, 5, 12]
    ],

    // Color palette
    palette: {
        indigo:  '#6366f1',
        emerald: '#10b981',
        amber:   '#f59e0b',
        rose:    '#f43f5e',
        violet:  '#8b5cf6',
        sky:     '#0ea5e9',
    },

    init: function () {
        this.renderTable('input-table', this.data);
        this.process();

        document.getElementById('input-table').addEventListener('input', () => {
            this.syncData();
            this.process();
        });

        document.getElementById('gamma-input').addEventListener('input', () => this.process());
        document.getElementById('beta-input').addEventListener('input', () => this.process());
    },

    syncData: function () {
        const rows = document.querySelectorAll('#input-table tr:not(:first-child)');
        this.data = Array.from(rows).map(row => {
            const cells = Array.from(row.querySelectorAll('td[contenteditable]'));
            return cells.map(td => {
                const val = parseFloat(td.innerText);
                return isNaN(val) ? 0 : val;
            });
        });
    },

    // ─── Animated number counter ────────────────────────────────
    animateValue: function (el, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = (start + range * eased).toFixed(2);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    },

    // ─── Core processing ────────────────────────────────────────
    process: function () {
        const container = document.getElementById('math-display');
        const epsilon = 1e-5;
        const gamma = parseFloat(document.getElementById('gamma-input').value) || 0;
        const beta  = parseFloat(document.getElementById('beta-input').value)  || 0;

        let html = '';

        const results = this.data.map((row, i) => {
            const sum      = row.reduce((a, b) => a + b, 0);
            const mean     = sum / row.length;
            const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;
            const stdDev   = Math.sqrt(variance + epsilon);
            const normalizedRow = row.map(x => (gamma * ((x - mean) / stdDev)) + beta);

            // Row accent colors cycle
            const accents = ['#6366f1', '#8b5cf6', '#0ea5e9'];
            const accent  = accents[i % accents.length];

            html += `
            <div class="norm-row-group" style="
                position: relative;
                background: ${themeColor('#ffffff')};
                border-radius: 20px;
                padding: 28px;
                margin-bottom: 32px;
                border: 1px solid ${themeColor('#e2e8f0')};
                box-shadow:
                    0 8px 32px -8px rgba(99,102,241,0.07),
                    0 1px 4px rgba(0,0,0,0.03);
                overflow: hidden;
                animation: normFadeUp 0.45s ${i * 0.08}s both cubic-bezier(0.22, 1, 0.36, 1);
            ">
                <!-- Top accent bar -->
                <div style="
                    position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, ${accent}, ${accent}88, transparent);
                "></div>

                <!-- Header -->
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 22px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid ${themeColor('#f1f5f9')};
                ">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="
                            width: 36px; height: 36px;
                            background: linear-gradient(135deg, ${accent}18, ${accent}08);
                            border: 2px solid ${accent}30;
                            border-radius: 10px;
                            display: flex; align-items: center; justify-content: center;
                            font-weight: 800; font-size: 0.85rem; color: ${accent};
                        ">${i + 1}</div>
                        <span style="font-size: 1.1rem; font-weight: 700; color: ${themeColor('#1e293b')};">Row Group #${i + 1}</span>
                    </div>
                    <div style="
                        display: flex; gap: 12px; align-items: center;
                    ">
                        <div style="
                            padding: 6px 14px;
                            background: linear-gradient(135deg, ${accent}12, ${accent}06);
                            border: 1px solid ${accent}20;
                            border-radius: 10px;
                            font-size: 0.85rem; color: ${themeColor('#475569')};
                        ">$\\mu = ${mean.toFixed(2)}$</div>
                        <div style="
                            padding: 6px 14px;
                            background: linear-gradient(135deg, #8b5cf612, #8b5cf606);
                            border: 1px solid #8b5cf620;
                            border-radius: 10px;
                            font-size: 0.85rem; color: ${themeColor('#475569')};
                        ">$\\sigma = ${stdDev.toFixed(2)}$</div>
                    </div>
                </div>

                <!-- Feature rows -->
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    ${row.map((val, idx) => {
                        const diff         = val - mean;
                        const standardized = diff / stdDev;
                        const final_val    = (gamma * standardized) + beta;

                        const featureColors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];
                        const fc = featureColors[idx % featureColors.length];

                        return `
                        <div style="
                            display: grid;
                            grid-template-columns: 100px 1fr 100px;
                            align-items: center;
                            background: linear-gradient(135deg, ${fc}04, transparent);
                            border-radius: 16px;
                            padding: 18px;
                            border: 1px solid ${fc}12;
                            position: relative;
                            overflow: hidden;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        " onmouseover="this.style.borderColor='${fc}30'; this.style.boxShadow='0 4px 20px -4px ${fc}15'"
                           onmouseout="this.style.borderColor='${fc}12'; this.style.boxShadow='none'">

                            <!-- Left: Input -->
                            <div style="text-align: center;">
                                <div style="
                                    font-size: 0.62rem;
                                    font-weight: 700;
                                    letter-spacing: 0.08em;
                                    text-transform: uppercase;
                                    color: #94a3b8;
                                    margin-bottom: 4px;
                                ">Input $x_{${idx + 1}}$</div>
                                <div style="
                                    font-size: 1.5rem;
                                    font-weight: 800;
                                    color: #1e293b;
                                    font-variant-numeric: tabular-nums;
                                ">${val}</div>
                            </div>

                            <!-- Center: Steps -->
                            <div style="
                                padding: 0 24px;
                                border-left: 1px solid ${themeColor('#f1f5f9')};
                                border-right: 1px solid ${themeColor('#f1f5f9')};
                            ">
                                <!-- Step 1 -->
                                <div style="margin-bottom: 10px;">
                                    <div style="display:flex; align-items:center; gap:6px; margin-bottom: 3px;">
                                        <span style="
                                            display: inline-block;
                                            width: 18px; height: 18px;
                                            background: linear-gradient(135deg, #be185d, #e11d48);
                                            border-radius: 5px;
                                            font-size: 0.6rem; font-weight: 800; color: white;
                                            text-align: center; line-height: 18px;
                                        ">1</span>
                                        <span style="font-size: 0.78rem; font-weight: 700; color: #be185d;">Center</span>
                                    </div>
                                    <div style="font-size: 1rem; padding: 2px 0 2px 24px; color: ${themeColor('#334155')};">
                                        $${val} - ${mean.toFixed(2)} = ${diff.toFixed(2)}$
                                    </div>
                                </div>

                                <!-- Step 2 -->
                                <div style="margin-bottom: 10px;">
                                    <div style="display:flex; align-items:center; gap:6px; margin-bottom: 3px;">
                                        <span style="
                                            display: inline-block;
                                            width: 18px; height: 18px;
                                            background: linear-gradient(135deg, #2563eb, #3b82f6);
                                            border-radius: 5px;
                                            font-size: 0.6rem; font-weight: 800; color: white;
                                            text-align: center; line-height: 18px;
                                        ">2</span>
                                        <span style="font-size: 0.78rem; font-weight: 700; color: #2563eb;">Standardize</span>
                                    </div>
                                    <div style="font-size: 1rem; padding: 2px 0 2px 24px; color: ${themeColor('#334155')};">
                                        $\\frac{${diff.toFixed(2)}}{${stdDev.toFixed(2)}} = ${standardized.toFixed(3)}$
                                    </div>
                                </div>

                                <!-- Step 3 -->
                                <div>
                                    <div style="display:flex; align-items:center; gap:6px; margin-bottom: 3px;">
                                        <span style="
                                            display: inline-block;
                                            width: 18px; height: 18px;
                                            background: linear-gradient(135deg, #059669, #10b981);
                                            border-radius: 5px;
                                            font-size: 0.6rem; font-weight: 800; color: white;
                                            text-align: center; line-height: 18px;
                                        ">3</span>
                                        <span style="font-size: 0.78rem; font-weight: 700; color: #059669;">Scale & Shift</span>
                                    </div>
                                    <div style="font-size: 1rem; padding: 2px 0 2px 24px; color: ${themeColor('#334155')};">
                                        $\\underbrace{(${gamma.toFixed(1)})}_{\\gamma} \\times ${standardized.toFixed(3)} + \\underbrace{${beta.toFixed(1)}}_{\\beta} = ${final_val.toFixed(2)}$
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Output -->
                            <div style="text-align: center;">
                                <div style="
                                    font-size: 0.62rem;
                                    font-weight: 700;
                                    letter-spacing: 0.08em;
                                    text-transform: uppercase;
                                    color: #94a3b8;
                                    margin-bottom: 4px;
                                ">Output $y_{${idx + 1}}$</div>
                                <div style="
                                    font-size: 1.5rem;
                                    font-weight: 800;
                                    color: #10b981;
                                    font-variant-numeric: tabular-nums;
                                ">${final_val.toFixed(2)}</div>
                            </div>

                            <!-- Watermark -->
                            <div style="
                                position: absolute;
                                right: -5px; bottom: -8px;
                                font-size: 3.5rem;
                                opacity: 0.025;
                                font-weight: 900;
                                pointer-events: none;
                                color: ${fc};
                                letter-spacing: -0.04em;
                            ">F${idx + 1}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;

            return normalizedRow;
        });

        // Inject keyframe animation once
        if (!document.getElementById('norm-animations')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'norm-animations';
            styleEl.textContent = `
                @keyframes normFadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(styleEl);
        }

        container.innerHTML = html;
        this.renderPlot('input-plot', this.data, 'Raw Magnitudes');
        this.renderPlot('output-plot', results, `Layer Normalized (γ=${gamma}, β=${beta})`);
        render_temml();
    },

    // ─── Table rendering ────────────────────────────────────────
    renderTable: function (id, data) {
        let h = `<tr style="background: linear-gradient(135deg, ${themeColor('#f1f5f9')}, ${themeColor('#eef2ff')}); border-bottom: 2px solid ${themeColor('#e2e8f0')};">
            <th style="padding:10px 12px; font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#6366f1;">#</th>
            <th style="padding:10px 12px; font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#6366f1;">F1</th>
            <th style="padding:10px 12px; font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#10b981;">F2</th>
            <th style="padding:10px 12px; font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#f59e0b;">F3</th>
            <th style="padding:10px 12px; font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#f43f5e;">F4</th>
        </tr>`;

        data.forEach((r, i) => {
            h += `<tr style="transition: background 0.2s;" onmouseover="this.style.background='${themeColor('#f1f5f9')}'" onmouseout="this.style.background='${themeColor('#ffffff')}'">
                <td style="
                    padding: 10px 12px;
                    border-bottom: 1px solid ${themeColor('#f1f5f9')};
                    font-weight: 800;
                    font-size: 0.82rem;
                    color: #6366f1;
                ">${i + 1}</td>`;
            const featureColors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];
            
            r.forEach((val, j) => {
                const fc = featureColors[j % featureColors.length];
                h += `<td contenteditable="true" style="
                    padding: 10px 12px;
                    border-bottom: 1px solid ${themeColor('#e2e8f0')};
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: ${themeColor('#1e293b')};
                    outline: none;
                    cursor: text;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    font-variant-numeric: tabular-nums;
                " onfocus="this.style.background='${fc}10'; this.style.boxShadow='inset 0 -2px 0 ${fc}'"
                   onblur="this.style.background='${themeColor('#ffffff')}'; this.style.boxShadow='none'"
                >${val}</td>`;
            });
            h += `</tr>`;
        });
        document.getElementById(id).innerHTML = h;
    },

    // ─── Plot rendering ─────────────────────────────────────────
    renderPlot: function (id, data, title) {
        const colors = [
            ['#6366f1', '#818cf8'],
            ['#10b981', '#34d399'],
            ['#f59e0b', '#fbbf24'],
            ['#f43f5e', '#fb7185'],
        ];

        const traces = [];
        for (let f = 0; f < (data[0] ? data[0].length : 0); f++) {
            traces.push({
                x: data.map((_, i) => `Sample ${i + 1}`),
                y: data.map(row => row[f]),
                name: `Feature ${f + 1}`,
                type: 'bar',
                marker: {
                    color: colors[f][0],
                    line: { color: colors[f][1], width: 1.5 },
                    opacity: 0.88,
                },
                hovertemplate: '<b>%{x}</b><br>Feature ' + (f + 1) + ': %{y:.3f}<extra></extra>',
            });
        }

        const layout = {
            title: {
                text: title,
                font: { size: 13, color: themeColor('#64748b'), family: 'system-ui, sans-serif', weight: 700 },
                x: 0.01,
                xanchor: 'left',
            },
            barmode: 'group',
            bargap: 0.25,
            bargroupgap: 0.08,
            margin: { t: 44, b: 36, l: 44, r: 16 },
            legend: {
                orientation: 'h',
                y: -0.22,
                font: { size: 11, color: themeColor('#64748b') },
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            yaxis: {
                range: id === 'output-plot' ? [-2.5, 2.5] : null,
                zeroline: true,
                zerolinecolor: themeColor('#94a3b8'),
                zerolinewidth: 1.5,
                gridcolor: themeColor('#f1f5f9'),
                gridwidth: 1,
                tickfont: { size: 11, color: themeColor('#94a3b8') },
            },
            xaxis: {
                tickfont: { size: 11, color: themeColor('#64748b'), weight: 600 },
            },
        };

        const config = {
            displayModeBar: false,
            responsive: true,
        };

        Plotly.newPlot(id, traces, layout, config);
    },
};

// ============================================================
// LAZY LOADING FOR NORMALIZATION MODULE
// ============================================================

const _normLazyRegistry = [];
let _normLazyObserver = null;

function _normLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _normLazyRegistry.push({ el, initFn, initialized: false });
}

function _normLazyCreateObserver() {
    if (_normLazyObserver) return;

    _normLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _normLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _normLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin
    });

    _normLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _normLazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// REPLACEMENT: loadNormalizationModule (drop-in replacement)
// ============================================================

async function loadNormalizationModule() {
    updateLoadingStatus("Loading section about normalization...");

    _normLazyRegister('input-table', () => {
        NormLab.init();
    });

    _normLazyRegister('gn-lab', () => {
        initGroupNormLab();
    });

    _normLazyCreateObserver();

    // Re-render plots when the user toggles dark/light mode so themeColor()
    // picks up the new palette on the next call.
    if (window.__MN_DARK) {
        window.__MN_DARK.onChange(() => {
            try { NormLab.process(); } catch (e) { /* ignore */ }
            try { if (typeof initGroupNormLab === 'function') initGroupNormLab(); } catch (e) { /* ignore */ }
        });
    }

    return Promise.resolve();
}

// ============================================================
// GROUP NORM LAB
// Interactive visualization: 8 channels × 16 spatial positions.
// Slider for G. Two heatmaps (input / after GroupNorm) and one
// stats card per group, all share the same group color.
// ============================================================
function initGroupNormLab() {
    const container = document.getElementById('gn-lab');
    if (!container) return;
    if (container.dataset.init === '1') { renderGroupNorm(); return; }
    container.dataset.init = '1';

    const C = 8;
    const S = 16;
    const groupHues = [
        '#6366f1', '#ec4899', '#10b981', '#f59e0b',
        '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'
    ];

    // 8 channels with deliberately different baselines, so within-group
    // normalization visibly flattens them to ~0 mean / ~1 std.
    const bases = [0, 5, 10, -3, 8, 2, -8, 15];
    const data = [];
    for (let c = 0; c < C; c++) {
        const row = [];
        for (let s = 0; s < S; s++) {
            row.push(bases[c] + Math.sin(s * 0.7 + c) * 2 + (s % 3 - 1) * 1.5);
        }
        data.push(row);
    }

    function channelsToGroups(G) {
        const groupOf = new Array(C);
        const per = Math.floor(C / G);
        const rem = C % G;
        let idx = 0;
        for (let g = 0; g < G; g++) {
            const size = per + (g < rem ? 1 : 0);
            for (let i = 0; i < size; i++) groupOf[idx++] = g;
        }
        return groupOf;
    }

    function inputCellColor(v, vmin, vmax) {
        const t = (v - vmin) / (vmax - vmin || 1);
        const mag = Math.abs(t * 2 - 1);
        const alpha = 0.10 + 0.75 * mag;
        return v >= 0
            ? `rgba(59, 130, 246, ${alpha.toFixed(3)})`
            : `rgba(239, 68, 68, ${alpha.toFixed(3)})`;
    }

    function outputCellColor(v) {
        const mag = Math.min(1, Math.abs(v) / 3);
        const alpha = 0.10 + 0.75 * mag;
        return v >= 0
            ? `rgba(59, 130, 246, ${alpha.toFixed(3)})`
            : `rgba(239, 68, 68, ${alpha.toFixed(3)})`;
    }

    function renderGroupNorm() {
        const slider = document.getElementById('gn-G');
        if (!slider) return;
        const G = parseInt(slider.value, 10);
        const groupOf = channelsToGroups(G);
        document.getElementById('gn-G-val').textContent = G;

        // Hint text
        const hint = document.getElementById('gn-hint');
        let hintText;
        if (G === 1) hintText = 'G = 1 — this is LayerNorm (every channel pooled together).';
        else if (G === C) hintText = 'G = ' + C + ' — this is InstanceNorm (each channel alone).';
        else hintText = 'G = ' + G + ' — ' + (C / G) + ' channels per group. (Stable Diffusion uses the same idea with C = 320 or 640 and G = 32, i.e. groups of 10–20 channels.)';
        hint.textContent = hintText;

        // Per-group stats and normalized output
        const stats = [];
        for (let g = 0; g < G; g++) {
            const vals = [];
            for (let c = 0; c < C; c++) {
                if (groupOf[c] === g) vals.push(...data[c]);
            }
            const n = vals.length;
            const mean = vals.reduce((a, b) => a + b, 0) / n;
            const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
            stats.push({ mean, std: Math.sqrt(variance), n });
        }
        const normalized = data.map((row, c) => {
            const s = stats[groupOf[c]];
            return row.map(v => (v - s.mean) / s.std);
        });

        // Global value range for input
        let vmin = Infinity, vmax = -Infinity;
        for (const row of data) for (const v of row) { if (v < vmin) vmin = v; if (v > vmax) vmax = v; }

        // Render input heatmap
        const inputEl = document.getElementById('gn-input');
        let html = '<table style="border-collapse:separate; border-spacing:2px; font-family:Menlo,Consolas,monospace; font-size:10px;">';
        for (let c = 0; c < C; c++) {
            const gIdx = groupOf[c];
            html += '<tr>';
            html += `<td style="background:${groupHues[gIdx]}; color:#fff; font-weight:700; padding:5px 7px; border-radius:4px; text-align:center; min-width:32px;">c${c}</td>`;
            for (let s = 0; s < S; s++) {
                const v = data[c][s];
                const bg = inputCellColor(v, vmin, vmax);
                const s_g = stats[gIdx];
                const tip = `channel ${c}, position ${s}:  x = ${v.toFixed(2)}\\ngroup ${gIdx}:  μ = ${s_g.mean.toFixed(2)},  σ = ${s_g.std.toFixed(2)}\\n→ (x − μ) / σ = ${((v - s_g.mean) / s_g.std).toFixed(2)}`;
                html += `<td title="${tip}" style="background:${bg}; padding:5px 6px; text-align:center; min-width:30px; border-radius:3px; cursor:help; color:var(--mn-text);">${v.toFixed(0)}</td>`;
            }
            html += '</tr>';
        }
        html += '</table>';
        inputEl.innerHTML = html;

        // Render output heatmap
        const outputEl = document.getElementById('gn-output');
        html = '<table style="border-collapse:separate; border-spacing:2px; font-family:Menlo,Consolas,monospace; font-size:10px;">';
        for (let c = 0; c < C; c++) {
            const gIdx = groupOf[c];
            html += '<tr>';
            html += `<td style="background:${groupHues[gIdx]}; color:#fff; font-weight:700; padding:5px 7px; border-radius:4px; text-align:center; min-width:32px;">c${c}</td>`;
            for (let s = 0; s < S; s++) {
                const v = normalized[c][s];
                const bg = outputCellColor(v);
                const txt = Math.abs(v) > 1.5 ? '#fff' : 'var(--mn-text)';
                html += `<td title="(x − μ) / σ = ${v.toFixed(2)}" style="background:${bg}; padding:5px 6px; text-align:center; min-width:30px; border-radius:3px; cursor:help; color:${txt};">${v.toFixed(1)}</td>`;
            }
            html += '</tr>';
        }
        html += '</table>';
        outputEl.innerHTML = html;

        // Stats cards
        const statsEl = document.getElementById('gn-stats');
        let shtml = '';
        for (let g = 0; g < G; g++) {
            const s = stats[g];
            const chans = [];
            for (let c = 0; c < C; c++) if (groupOf[c] === g) chans.push(c);
            shtml += `
                <div style="background:var(--mn-surface); border:2px solid ${groupHues[g]}; border-radius:10px; padding:10px 12px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <div style="width:14px; height:14px; background:${groupHues[g]}; border-radius:3px; flex-shrink:0;"></div>
                        <strong style="color:var(--mn-text);">Group ${g}</strong>
                        <span style="font-size:10px; color:var(--mn-text-secondary); margin-left:auto; font-family:Menlo,Consolas,monospace;">c: ${chans.join(', ')}</span>
                    </div>
                    <div style="display:grid; grid-template-columns:auto 1fr; column-gap:10px; row-gap:2px; font-family:Menlo,Consolas,monospace; font-size:12px; color:var(--mn-text);">
                        <span style="color:var(--mn-text-secondary);">μ =</span><span>${s.mean.toFixed(2)}</span>
                        <span style="color:var(--mn-text-secondary);">σ =</span><span>${s.std.toFixed(2)}</span>
                        <span style="color:var(--mn-text-secondary);">n =</span><span>${s.n}</span>
                    </div>
                </div>`;
        }
        statsEl.innerHTML = shtml;
    }

    const slider = document.getElementById('gn-G');
    slider.addEventListener('input', renderGroupNorm);
    renderGroupNorm();
}

