
// ─── Data Collection ────────────────────────────────────────

/**
 * At each processing stage, projects the hidden state of the
 * chosen token position onto the vocabulary to obtain a
 * softmax probability distribution.
 *
 * @returns {{ vocab: string[], stages: { name: string, probs: number[] }[] } | null}
 */
function _themeriver_collect_probs(tokenIdx, d_model) {
    const collector = window.tlab_trajectory_collector;
    if (!collector || !collector.steps) return null;

    const sortedKeys = Object.keys(collector.steps).sort();
    if (sortedKeys.length < 2) return null;

    const vocab = Object.keys(window.persistentEmbeddingSpace || {});
    if (vocab.length === 0) return null;

    const embMatrix = vocab.map(word =>
        window.persistentEmbeddingSpace[word] || new Array(d_model).fill(0)
    );

    const stages = [];

    sortedKeys.forEach(key => {
        const step = collector.steps[key];
        if (!step.data || !step.data[tokenIdx]) return;

        const h = step.data[tokenIdx];

        // logits = h · E^T  (dot product with every vocab embedding)
        const logits = embMatrix.map(embRow => {
            let sum = 0;
            for (let d = 0; d < h.length; d++) sum += h[d] * (embRow[d] || 0);
            return sum;
        });

        stages.push({ name: step.name, probs: softmax(logits) });
    });

    return stages.length >= 2 ? { vocab, stages } : null;
}

// ─── Rendering ──────────────────────────────────────────────

/**
 * Core ECharts rendering logic.
 */
function _execute_themeriver_render(d_model) {
    const containerId = 'transformer-themeriver-plot';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Read user selections
    const tokenSelect = document.getElementById('themeriver-token-select');
    const topNSelect  = document.getElementById('themeriver-topn-select');
    const tokenIdx    = tokenSelect ? parseInt(tokenSelect.value) || 0 : 0;
    const topNValue   = topNSelect  ? topNSelect.value : '8';

    // Collect probabilities at every stage
    const collected = _themeriver_collect_probs(tokenIdx, d_model);
    if (!collected) {
        container.innerHTML =
            '<div style="padding:40px;text-align:center;color:#94a3b8;">' +
            'Need at least 2 processing stages.</div>';
        return;
    }

    const { vocab, stages } = collected;

    // Determine which words to display
    const topN = topNValue === 'all'
        ? vocab.length
        : Math.min(parseInt(topNValue), vocab.length);

    const { topWords, topIndices, showOther } =
        _themeriver_select_top_words(vocab, stages, topN);

    // Assemble the data array: [stageName, probability, word]
    const riverData = _themeriver_build_data(stages, vocab, topWords, topIndices, showOther);

    // Token label for the title
    const collector = window.tlab_trajectory_collector;
    const labels = collector.displayTokens || collector.tokens;
    const tokenLabel = labels[tokenIdx] || `pos ${tokenIdx}`;

    // Render chart
    let chart = echarts.getInstanceByDom(container);
    if (!chart) chart = echarts.init(container);

    chart.setOption(
        _themeriver_build_option(riverData, stages, tokenLabel, tokenIdx, showOther),
        true   // full replace — safe when word count changes
    );

    _themeriver_wire_resize(container);
}

/**
 * Picks the top-N vocabulary words by their maximum probability
 * across all stages.
 */
function _themeriver_select_top_words(vocab, stages, topN) {
    const stats = vocab.map((word, i) => ({
        word, idx: i,
        maxProb: Math.max(...stages.map(s => s.probs[i]))
    }));
    stats.sort((a, b) => b.maxProb - a.maxProb);

    const topWords   = stats.slice(0, topN);
    const topIndices = new Set(topWords.map(w => w.idx));
    const showOther  = vocab.length > topN;

    return { topWords, topIndices, showOther };
}

/**
 * Builds the flat ThemeRiver data array.
 */
function _themeriver_build_data(stages, vocab, topWords, topIndices, showOther) {
    const data = [];

    stages.forEach((stage, stageIdx) => {
        // ★ Use numeric index, NOT the stage name string
        topWords.forEach(tw => {
            data.push([stageIdx, stage.probs[tw.idx], tw.word]);
        });

        if (showOther) {
            let otherProb = 0;
            vocab.forEach((_, i) => {
                if (!topIndices.has(i)) otherProb += stage.probs[i];
            });
            data.push([stageIdx, otherProb, '(other)']);
        }
    });

    return data;
}

/**
 * Returns the full ECharts option object for the ThemeRiver.
 */
function _themeriver_build_option(riverData, stages, tokenLabel, tokenIdx, showOther) {
    const palette = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
        '#06b6d4', '#e11d48', '#a855f7', '#22c55e', '#eab308'
    ];
    if (showOther) palette.push('#94a3b8');

    // Cache stage names for axis formatter + tooltip
    const stageNames = stages.map(s => s.name);

    return {
        title: {
            text: `Probability Flow — "${tokenLabel}" (position ${tokenIdx + 1})`,
            subtext: 'Band width = predicted probability at each processing stage',
            left: 'center',
            textStyle:    { fontSize: 13, color: '#1e293b', fontWeight: 'bold' },
            subtextStyle: { fontSize: 11, color: '#64748b' }
        },
        tooltip: {
            trigger: 'item',
            formatter: function (p) {
                const stageIdx = Math.round(p.data[0]);
                const stageName = stageNames[stageIdx] || `Stage ${stageIdx}`;
                return `<b>${p.data[2]}</b><br>` +
                       `Stage: ${stageName}<br>` +
                       `Probability: ${(p.data[1] * 100).toFixed(1)}%`;
            }
        },
        legend: {
            bottom: 5,
            left: 'center',
            textStyle: { fontSize: 11 }
        },
        singleAxis: {
            // ★ KEY FIX: 'value' instead of 'category'
            type: 'value',
            min: 0,
            max: stages.length - 1,
            left: '5%',
            right: '5%',
            top: 80,
            bottom: 65,      // room for legend
            splitNumber: stages.length - 1,
            axisLabel: {
                formatter: function (val) {
                    // Only show labels at integer positions
                    const idx = Math.round(val);
                    if (Math.abs(val - idx) < 0.01 && idx >= 0 && idx < stageNames.length) {
                        return stageNames[idx];
                    }
                    return '';
                },
                rotate: 25,
                fontSize: 10,
                color: '#475569',
                interval: 0
            },
            axisTick: {
                alignWithLabel: true
            },
            axisLine: { lineStyle: { color: '#cbd5e1' } }
        },
        series: [{
            type: 'themeRiver',
            data: riverData,
            label: {
                // ★ FIX: Disable inline labels to prevent overlap.
                // Words are identified via legend + tooltip instead.
                show: false
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 20,
                    shadowColor: 'rgba(0, 0, 0, 0.25)'
                }
            }
        }],
        color: palette
    };
}

/**
 * Wires a resize handler (once) for the ThemeRiver container.
 */
function _themeriver_wire_resize(container) {
    if (container._ecThemeRiverResize) return;
    container._ecThemeRiverResize = () => {
        const c = echarts.getInstanceByDom(container);
        if (c) c.resize();
    };
    window.addEventListener('resize', container._ecThemeRiverResize);
}

/**
 * Forces re-render of the ThemeRiver if it is already visible
 * (needed during training, where the observer won't re-fire).
 */
function forceRerenderVisibleThemeRiver(d_model) {
    const id = 'transformer-themeriver-plot';
    const entry = themeRiverRegistry.get(id);
    if (entry && !entry.rendered) {
        const el = document.getElementById(id);
        if (el && isElementInViewport(el)) {
            _execute_themeriver_render(d_model);
            entry.rendered = true;
        }
    }
}

/**
 * Entry point: ensures the DOM container exists, populates the
 * token selector, and registers the chart for lazy rendering.
 */
function tlab_render_themeriver(d_model) {
    if (!window.tlab_trajectory_collector) return;

    const sortedKeys = Object.keys(window.tlab_trajectory_collector.steps || {}).sort();
    if (sortedKeys.length < 2) return;

    const containerId = 'transformer-themeriver-plot';
    _themeriver_ensure_dom(containerId);
    _themeriver_populate_token_selector();

    registerLazyRenderable(
        containerId,
        themeRiverRegistry,
        themeRiverObserver,
        { d_model },
        () => _execute_themeriver_render(d_model),
        `<div style="padding:30px; color:#94a3b8; text-align:center;">
            Loading Probability Flow (ThemeRiver)…
        </div>`
    );
}

// ─── DOM Setup ──────────────────────────────────────────────

/**
 * Creates the ThemeRiver wrapper (toolbar + chart div) if it
 * doesn't already exist.
 */
function _themeriver_ensure_dom(containerId) {
    if (document.getElementById(containerId)) return;

    const parent = document.getElementById('transformer-migration-plots-container');
    if (!parent) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'themeriver-wrapper';
    wrapper.style.cssText = `
        border: 2px solid #8b5cf6; border-radius: 12px;
        background: #faf5ff; margin-top: 24px; overflow: hidden;
    `;
    wrapper.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; padding:12px 16px;
                    background:#ede9fe; border-bottom:1px solid #c4b5fd; flex-wrap:wrap;">
            <span style="font-weight:700; color:#5b21b6; font-size:0.95rem;">
                🌊 Probability Flow (ThemeRiver)
            </span>
            <label style="color:#7c3aed; font-size:0.8rem;">Token position:</label>
            <select id="themeriver-token-select"
                    onchange="window._themeriver_on_change()"
                    style="padding:4px 8px; border:1px solid #c4b5fd;
                           border-radius:6px; font-size:0.82rem; background:#fff;">
            </select>
            <label style="color:#7c3aed; font-size:0.8rem; margin-left:auto;">Show top</label>
            <select id="themeriver-topn-select"
                    onchange="window._themeriver_on_change()"
                    style="padding:4px 8px; border:1px solid #c4b5fd;
                           border-radius:6px; font-size:0.82rem; background:#fff;">
                <option value="5">5</option>
                <option value="8" selected>8</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="all">All</option>
            </select>
            <span style="color:#7c3aed; font-size:0.8rem;">words</span>
        </div>
        <div id="${containerId}" style="width:100%; height:520px;"></div>
    `;
    //                                              ↑ 520px statt 420px
    parent.appendChild(wrapper);
}

/**
 * Populates the token-position dropdown from the trajectory collector.
 */
function _themeriver_populate_token_selector() {
    const select = document.getElementById('themeriver-token-select');
    if (!select) return;

    const collector = window.tlab_trajectory_collector;
    if (!collector) return;

    const labels = collector.displayTokens || collector.tokens.map((t, i) =>
        typeof t === 'string' ? t : `Token ${i}`
    );

    const prevValue = select.value;
    select.innerHTML = '';

    labels.forEach((label, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i}: "${label}"` + (i === labels.length - 1 ? ' ← last' : '');
        select.appendChild(opt);
    });

    // Default: last token (the prediction target)
    select.value = (prevValue && parseInt(prevValue) < labels.length)
        ? prevValue
        : String(labels.length - 1);
}
