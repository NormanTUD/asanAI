function renderPESpecificityCone() {
    const el = document.getElementById('pe-specificity-cone');
    if (!el) return;
    const labels = [
        '"Do stuff"',
        '"Write code"',
        '"Write a Python sort"',
        '"Quicksort, O(n log n)"',
        '"Quicksort, inline comments, edge cases"'
    ];
    const entropies = [4.2, 3.1, 1.8, 0.9, 0.3];
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];
    Plotly.newPlot(el, [{
        x: entropies,
        y: labels.map(l => l.replace(/"/g, '')),
        type: 'bar',
        orientation: 'h',
        marker: { color: colors },
        text: entropies.map(e => e.toFixed(1) + ' bits'),
        textposition: 'outside',
        hovertemplate: 'Prompt: %{y}<br>Output Entropy: %{x:.1f} bits<extra></extra>',
    }], {
        title: { text: 'Prompt Specificity Reduces Output Uncertainty', font: { size: 14 } },
        xaxis: { title: 'Output Entropy (bits)', range: [0, 5.5] },
        yaxis: { title: '', automargin: true },
        margin: { t: 40, b: 40, l: 160, r: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'system-ui, sans-serif' },
    }, { responsive: true });
}

function renderPENegationSpace() {
    const el = document.getElementById('pe-negation-space');
    if (!el) return;
    const points = [
        { x: 0.0, y: 0.0, label: 'happy', color: '#22c55e', size: 14 },
        { x: 0.15, y: 0.08, label: '"not happy"', color: '#f59e0b', size: 10 },
        { x: -0.6, y: -0.5, label: 'sad', color: '#ef4444', size: 14 },
        { x: 0.9, y: 0.1, label: 'joyful', color: '#22c55e', size: 10 },
        { x: -0.4, y: -0.7, label: 'depressed', color: '#ef4444', size: 10 },
        { x: 0.3, y: -0.2, label: 'content', color: '#3b82f6', size: 10 },
    ];
    const traces = [
        {
            x: points.map(p => p.x), y: points.map(p => p.y),
            type: 'scatter', mode: 'markers+text',
            text: points.map(p => p.label),
            textposition: 'top center',
            marker: { size: points.map(p => p.size), color: points.map(p => p.color), line: { width: 1, color: themeColor('#fff') } },
            textfont: { size: 11 },
        },
        {
            x: [0, 0.15], y: [0, 0.08],
            type: 'scatter', mode: 'lines',
            line: { color: '#f59e0b', width: 2, dash: 'dash' },
            showlegend: false,
        },
        {
            x: [0, -0.6], y: [0, -0.5],
            type: 'scatter', mode: 'lines',
            line: { color: themeColor('#94a3b8'), width: 1.5, dash: 'dot' },
            showlegend: false,
        },
    ];
    Plotly.newPlot(el, traces, {
        title: { text: 'Why Negations Fail: "not happy" ≈ "happy" in Embedding Space', font: { size: 13 } },
        xaxis: { range: [-1, 1.2], zeroline: true, zerolinecolor: themeColor('#e2e8f0') },
        yaxis: { range: [-1, 0.8], zeroline: true, zerolinecolor: themeColor('#e2e8f0') },
        annotations: [
            { x: 0.07, y: 0.04, text: '← negation barely shifts the vector', showarrow: false, font: { size: 9, color: '#f59e0b' }, xanchor: 'left' },
            { x: -0.3, y: -0.25, text: '← true opposite is far away', showarrow: false, font: { size: 9, color: themeColor('#94a3b8') }, xanchor: 'right' },
        ],
        margin: { t: 40, b: 40, l: 40, r: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'system-ui, sans-serif' },
    }, { responsive: true });
}

function renderPETechRadar() {
    const el = document.getElementById('pe-tech-radar');
    if (!el) return;
    const categories = ['Accuracy', 'Creativity', 'Safety', 'Consistency', 'Speed', 'Robustness'];
    const techniques = [
        { name: 'Chain-of-Thought', values: [0.9, 0.1, 0.6, 0.85, 0.3, 0.7], color: '#6366f1' },
        { name: 'Few-Shot', values: [0.8, 0.2, 0.5, 0.9, 0.4, 0.6], color: '#22c55e' },
        { name: 'Role Prompting', values: [0.5, 0.7, 0.4, 0.6, 0.5, 0.3], color: '#f59e0b' },
        { name: 'Structured Output', values: [0.7, 0.1, 0.7, 0.95, 0.6, 0.8], color: '#ef4444' },
    ];
    const traces = techniques.map(t => ({
        type: 'scatterpolar',
        r: t.values,
        theta: categories,
        fill: 'toself',
        name: t.name,
        line: { color: t.color },
        fillcolor: t.color + '20',
    }));
    Plotly.newPlot(el, traces, {
        title: { text: 'Technique Effectiveness Profiles', font: { size: 13 } },
        polar: {
            radialaxis: { visible: true, range: [0, 1] },
            bgcolor: 'rgba(0,0,0,0)',
        },
        margin: { t: 40, b: 40, l: 60, r: 60 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'system-ui, sans-serif', size: 10 },
        legend: { orientation: 'h', y: -0.15 },
    }, { responsive: true });
}

function renderPECoTAccuracy() {
    const el = document.getElementById('pe-cot-accuracy');
    if (!el) return;
    const steps = ['Direct Answer', 'Step 1', 'Step 2', 'Step 3', 'Step 4', 'Final Answer'];
    const accuracies = [0.35, 0.52, 0.68, 0.79, 0.87, 0.92];
    const traces = [
        {
            x: steps, y: accuracies,
            type: 'scatter', mode: 'lines+markers',
            line: { color: '#6366f1', width: 3, shape: 'spline' },
            marker: { size: 10, color: accuracies.map(a => a > 0.8 ? '#22c55e' : a > 0.6 ? '#f59e0b' : '#ef4444'), line: { width: 1, color: themeColor('#fff') } },
            fill: 'tozeroy',
            fillcolor: 'rgba(99, 102, 241, 0.08)',
        },
    ];
    Plotly.newPlot(el, traces, {
        title: { text: 'Chain-of-Thought: Accuracy Builds Step by Step', font: { size: 13 } },
        xaxis: { title: '' },
        yaxis: { title: 'Accuracy', range: [0, 1], tickformat: '.0%' },
        annotations: [
            { x: 0, y: 0.35, text: 'Direct guess → low accuracy', showarrow: true, arrowhead: 2, ax: 40, ay: -30, font: { size: 9, color: '#ef4444' } },
            { x: 5, y: 0.92, text: 'After full reasoning → high accuracy', showarrow: true, arrowhead: 2, ax: -60, ay: -20, font: { size: 9, color: '#22c55e' } },
        ],
        margin: { t: 40, b: 40, l: 50, r: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'system-ui, sans-serif' },
    }, { responsive: true });
}

function renderPEPromptInjection() {
    const el = document.getElementById('pe-injection-heatmap');
    if (!el) return;
    const scenarios = ['Basic injection', 'With delimiters', 'Input sanitization', 'Layered defense', 'Least privilege'];
    const defenses = ['None', 'Delimiters', 'Sanitize', 'Layered', 'Full stack'];
    const z = [
        [0.95, 0.85, 0.7, 0.4, 0.1],
        [0.9, 0.3, 0.15, 0.05, 0.02],
        [0.85, 0.2, 0.3, 0.08, 0.01],
        [0.7, 0.15, 0.2, 0.05, 0.01],
        [0.6, 0.1, 0.1, 0.02, 0.005],
    ];
    Plotly.newPlot(el, [{
        z, type: 'heatmap',
        x: scenarios, y: defenses,
        colorscale: [
            [0, '#22c55e'], [0.25, '#84cc16'], [0.5, '#f59e0b'],
            [0.75, '#f97316'], [1, '#ef4444'],
        ],
        zmin: 0, zmax: 1,
        text: z.map(row => row.map(v => (v * 100).toFixed(0) + '%')),
        texttemplate: '%{text}',
        hovertemplate: 'Attack: %{x}<br>Defense: %{y}<br>Success Rate: %{z:.0%}<extra></extra>',
    }], {
        title: { text: 'Prompt Injection: Attack Success Rate by Defense Level', font: { size: 13 } },
        xaxis: { title: 'Attack Scenario' },
        yaxis: { title: 'Defense Strategy' },
        margin: { t: 40, b: 60, l: 80, r: 20 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'system-ui, sans-serif' },
    }, { responsive: true });
}

function renderPEContradictionIntersection() {
    const root = document.getElementById('pe-contradiction-intersection');
    if (!root || typeof Plotly === 'undefined') return;

    // Three semantic regions. Centre positions are placed in three different
    // quadrants of the cube so they read as distinct clusters in 3-D.
    const regions = {
        familiar:    { label: 'FAMILIAR',    color: '#f59e0b', center: [-1.10,  0.55,  0.40] },
        interesting: { label: 'INTERESTING', color: '#06b6d4', center: [ 1.05,  0.45, -0.55] },
        minimal:     { label: 'MINIMAL',     color: '#a78bfa', center: [-0.10, -1.05,  0.55] },
    };

    // -----------------------------------------------------------------------
    // Each point: word, hint, regions[], pos[x,y,z]
    // pos values are hand-tuned so each point lives inside the region(s) it
    // belongs to (i.e. closer to those centres than to any other).
    // -----------------------------------------------------------------------
    const points = [
        // ===== squarely inside FAMILIAR =====
        { word: 'home',           pos: [-1.20,  0.65,  0.55], regions: ['familiar'], hint: 'a place you do not have to explain' },
        { word: 'coffee',         pos: [-1.30,  0.30,  0.25], regions: ['familiar'], hint: 'the same cup every morning' },
        { word: 'mother tongue',  pos: [-0.95,  0.80,  0.20], regions: ['familiar'], hint: 'the language you dream in' },
        { word: 'old friend',     pos: [-1.40,  0.45,  0.65], regions: ['familiar'], hint: 'no small talk needed' },
        { word: 'kitchen',        pos: [-0.90,  0.35,  0.10], regions: ['familiar'], hint: 'smell of something cooking' },
        { word: 'hand-written',   pos: [-1.15,  0.70,  0.05], regions: ['familiar'], hint: 'a letter, in your own hand' },
        { word: 'lullaby',        pos: [-1.00,  0.20,  0.60], regions: ['familiar'], hint: 'sounds you fall asleep to' },

        // ===== squarely inside INTERESTING =====
        { word: 'paradox',        pos: [ 1.20,  0.60, -0.70], regions: ['interesting'], hint: 'true and false at once' },
        { word: 'twist',          pos: [ 0.85,  0.25, -0.80], regions: ['interesting'], hint: 'the ending you did not see' },
        { word: 'infinity',       pos: [ 1.30,  0.55, -0.30], regions: ['interesting'], hint: 'a line with no last point' },
        { word: 'glitch',         pos: [ 0.95,  0.75, -0.45], regions: ['interesting'], hint: 'a tear in the pattern' },
        { word: 'fractal',        pos: [ 1.10,  0.20, -0.55], regions: ['interesting'], hint: 'the same shape at every scale' },
        { word: 'reveal',         pos: [ 1.35,  0.70, -0.65], regions: ['interesting'], hint: 'the thing you missed before' },
        { word: 'palindrome',     pos: [ 0.90,  0.50, -0.30], regions: ['interesting'], hint: 'reads the same both ways' },

        // ===== squarely inside MINIMAL =====
        { word: 'void',           pos: [-0.10, -1.25,  0.65], regions: ['minimal'], hint: 'the absence of anything' },
        { word: 'silence',        pos: [ 0.05, -1.20,  0.35], regions: ['minimal'], hint: 'no signal at all' },
        { word: 'single dot',     pos: [-0.30, -0.95,  0.75], regions: ['minimal'], hint: 'one mark, no more' },
        { word: 'breath',         pos: [ 0.10, -1.10,  0.45], regions: ['minimal'], hint: 'one cycle in, one cycle out' },
        { word: 'white space',    pos: [-0.20, -0.85,  0.30], regions: ['minimal'], hint: 'what is not there, on purpose' },
        { word: 'ember',          pos: [-0.05, -1.30,  0.20], regions: ['minimal'], hint: 'a single point of warmth' },
        { word: 'pebble',         pos: [ 0.15, -1.00,  0.80], regions: ['minimal'], hint: 'a stone, smoothed by water' },

        // ===== pairwise overlaps =====
        // FAMILIAR ∩ INTERESTING
        { word: 'wabi-sabi',      pos: [-0.20,  0.75, -0.10], regions: ['familiar', 'interesting'], hint: 'imperfect, therefore beautiful' },
        { word: 'nostalgia',      pos: [-0.45,  0.85,  0.15], regions: ['familiar', 'interesting'], hint: 'a memory warmer than the thing' },
        { word: 'deja-vu',        pos: [-0.10,  0.70, -0.35], regions: ['familiar', 'interesting'], hint: 'I have been in this room before' },
        { word: 'old joke',       pos: [-0.55,  0.55, -0.20], regions: ['familiar', 'interesting'], hint: 'funnier the 50th time' },
        { word: 'folk song',      pos: [-0.30,  0.95,  0.30], regions: ['familiar', 'interesting'], hint: 'old melody, new feeling' },

        // FAMILIAR ∩ MINIMAL
        { word: 'morning ritual', pos: [-0.85, -0.25,  0.65], regions: ['familiar', 'minimal'], hint: 'the same three small things' },
        { word: 'prayer',         pos: [-0.65, -0.45,  0.50], regions: ['familiar', 'minimal'], hint: 'a handful of words you already know' },
        { word: 'tea ceremony',   pos: [-0.95, -0.55,  0.45], regions: ['familiar', 'minimal'], hint: 'familiar steps, almost nothing' },

        // INTERESTING ∩ MINIMAL
        { word: 'Bauhaus',        pos: [ 0.55, -0.30,  0.10], regions: ['interesting', 'minimal'], hint: 'less, but better' },
        { word: 'Mondrian',       pos: [ 0.70, -0.55, -0.10], regions: ['interesting', 'minimal'], hint: 'three lines, three colours' },
        { word: 'duchamp',        pos: [ 0.40, -0.10,  0.25], regions: ['interesting', 'minimal'], hint: 'a urinal, signed' },
        { word: 'Lichtenstein',   pos: [ 0.80, -0.40, -0.30], regions: ['interesting', 'minimal'], hint: 'one idea, one shape, no more' },
        { word: 'Oulipo',         pos: [ 0.30, -0.25, -0.20], regions: ['interesting', 'minimal'], hint: 'constraint as engine' },

        // ===== triple overlap (all three) =====
        { word: 'haiku',          pos: [-0.10, -0.05,  0.45], regions: ['familiar', 'interesting', 'minimal'], hint: '5-7-5, and somehow everything' },
        { word: 'ikebana',        pos: [-0.30, -0.20,  0.65], regions: ['familiar', 'interesting', 'minimal'], hint: 'three stems, a whole season' },
        { word: 'zen koan',       pos: [ 0.10,  0.05,  0.20], regions: ['familiar', 'interesting', 'minimal'], hint: 'a question that breaks the question' },
        { word: 'one-stroke',     pos: [-0.40,  0.10,  0.55], regions: ['familiar', 'interesting', 'minimal'], hint: 'one motion, no correction' },

        // ===== void points (far from all three centres) =====
        { word: 'liminal',        pos: [ 1.40, -0.85,  0.30], regions: [], hint: 'between, not yet, no longer' },
        { word: 'ineffable',      pos: [-1.30, -0.95, -0.40], regions: [], hint: 'would lose its shape if spoken' },
        { word: 'sublime',        pos: [ 1.10, -1.20,  0.60], regions: [], hint: 'too big to hold in one frame' },
        { word: 'aporia',         pos: [-0.85,  1.20, -0.65], regions: [], hint: 'a puzzle with no exit' },
        { word: 'fugue',          pos: [ 0.20,  1.30,  0.30], regions: [], hint: 'a voice answering itself' },
    ];

    // Colour for a point: single region → that region's colour; multi-region →
    // midpoint of the constituent colours; void → gray.
    function rgbFromHex(hex) {
        const h = hex.replace('#', '');
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16),
        ];
    }
    function pointColor(p) {
        if (p.regions.length === 0) return '#64748b';
        const cols = p.regions.map(id => rgbFromHex(regions[id].color));
        const r = Math.round(cols.reduce((a, c) => a + c[0], 0) / cols.length);
        const g = Math.round(cols.reduce((a, c) => a + c[1], 0) / cols.length);
        const b = Math.round(cols.reduce((a, c) => a + c[2], 0) / cols.length);
        return `rgb(${r},${g},${b})`;
    }
    function regionsLabel(p) {
        if (p.regions.length === 0) return '<i>void</i>';
        return p.regions.map(id => regions[id].label.toLowerCase()).join(' & ');
    }
    function buildHoverText(p) {
        const r = rgbFromHex(p.regions.length === 0 ? '#94a3b8' : regions[p.regions[0]].color);
        const band = `rgb(${r[0]},${r[1]},${r[2]})`;
        return `<span style="background:${band};color:#000;padding:1px 6px;border-radius:3px;font-weight:700;">${p.word}</span>` +
               `<br><span style="color:#1f2937;font-style:italic;">${p.hint}</span>` +
               `<br><span style="color:#374151;">lives in: ${regionsLabel(p)}</span>`;
    }

    // -----------------------------------------------------------------------
    // Cloud volumes. Two layers:
    //   1) Translucent ellipsoid MESH (mesh3d) — a real 3-D volume with
    //      visible boundary. Radii are large enough that neighbouring
    //      ellipsoids overlap, so the intersection regions appear naturally.
    //   2) Dense point cloud (scatter3d) inside each ellipsoid — gives the
    //      "dusty" texture on top of the smooth volume.
    // Both are unlabeled; the hoverable words sit on top.
    // -----------------------------------------------------------------------
    function gauss() {
        const u1 = Math.max(1e-9, Math.random());
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    function cloudFor(regionId, center, n, sigma) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            pts.push({
                x: center[0] + gauss() * sigma,
                y: center[1] + gauss() * sigma,
                z: center[2] + gauss() * sigma,
                color: regions[regionId].color,
            });
        }
        return pts;
    }
    // Ellipsoid radii are *larger than the region-to-region distance* so the
    // volumes visibly overlap at the boundaries.
    const ELLIPSOID_RADII = [0.85, 0.75, 0.80];

    // Inner core clouds — dense, high opacity
    const cloudInner = [
        ...cloudFor('familiar',    regions.familiar.center,    280, 0.40),
        ...cloudFor('interesting', regions.interesting.center, 280, 0.40),
        ...cloudFor('minimal',     regions.minimal.center,     280, 0.40),
    ];
    // Outer halo — extends past the ellipsoid boundary so the edge is soft
    const cloudOuter = [
        ...cloudFor('familiar',    regions.familiar.center,    180, 0.95),
        ...cloudFor('interesting', regions.interesting.center, 180, 0.95),
        ...cloudFor('minimal',     regions.minimal.center,     180, 0.95),
    ];
    // Volume markers — large, very transparent scatter3d points that simulate
    // a soft 3D cloud volume without using mesh3d (which would block hover
    // events on the labeled points behind it).
    const cloudVolume = [];
    for (const id of ['familiar', 'interesting', 'minimal']) {
        const center = regions[id].center;
        const color = regions[id].color;
        for (let i = 0; i < 100; i++) {
            cloudVolume.push({
                x: center[0] + gauss() * ELLIPSOID_RADII[0] * 0.95,
                y: center[1] + gauss() * ELLIPSOID_RADII[1] * 0.95,
                z: center[2] + gauss() * ELLIPSOID_RADII[2] * 0.95,
                color,
            });
        }
    }
    // Sparse void dust — random spread, gray
    const voidDust = [];
    for (let i = 0; i < 140; i++) {
        voidDust.push({
            x: (Math.random() * 2 - 1) * 1.7,
            y: (Math.random() * 2 - 1) * 1.7,
            z: (Math.random() * 2 - 1) * 1.5,
        });
    }

    const traces = [
        // -------- Cloud volume (large soft scatter3d markers, no hover) --------
        // Simulates the 3-D ellipsoid volume without using mesh3d, so it does
        // not intercept hover events on the labeled points behind it.
        {
            type: 'scatter3d',
            mode: 'markers',
            x: cloudVolume.map(p => p.x), y: cloudVolume.map(p => p.y), z: cloudVolume.map(p => p.z),
            marker: { size: 24, color: cloudVolume.map(p => p.color), opacity: 0.09, line: { width: 0 } },
            hoverinfo: 'skip', showlegend: false,
        },

        // -------- Cloud particles (two layers for soft edges) --------
        {
            type: 'scatter3d',
            mode: 'markers',
            x: cloudOuter.map(p => p.x), y: cloudOuter.map(p => p.y), z: cloudOuter.map(p => p.z),
            marker: { size: 5, color: cloudOuter.map(p => p.color), opacity: 0.12, line: { width: 0 } },
            hoverinfo: 'skip', showlegend: false,
        },
        {
            type: 'scatter3d',
            mode: 'markers',
            x: cloudInner.map(p => p.x), y: cloudInner.map(p => p.y), z: cloudInner.map(p => p.z),
            marker: { size: 4, color: cloudInner.map(p => p.color), opacity: 0.45, line: { width: 0 } },
            hoverinfo: 'skip', showlegend: false,
        },
        // -------- Void dust (sparse, gray) --------
        {
            type: 'scatter3d',
            mode: 'markers',
            x: voidDust.map(p => p.x), y: voidDust.map(p => p.y), z: voidDust.map(p => p.z),
            marker: { size: 2, color: '#475569', opacity: 0.35, line: { width: 0 } },
            hoverinfo: 'skip', showlegend: false,
        },

        // -------- Labeled single-region points (circles, bright) --------
        {
            type: 'scatter3d',
            mode: 'markers',
            x: points.filter(p => p.regions.length === 1 && p.regions[0] === 'familiar').map(p => p.pos[0]),
            y: points.filter(p => p.regions.length === 1 && p.regions[0] === 'familiar').map(p => p.pos[1]),
            z: points.filter(p => p.regions.length === 1 && p.regions[0] === 'familiar').map(p => p.pos[2]),
            text: points.filter(p => p.regions.length === 1 && p.regions[0] === 'familiar').map(buildHoverText),
            hoverinfo: 'text',
            marker: {
                size: 10, symbol: 'circle',
                color: points.filter(p => p.regions.length === 1 && p.regions[0] === 'familiar').map(pointColor),
                line: { color: '#ffffff', width: 1.5 },
                opacity: 1.0,
            },
            name: 'familiar',
            showlegend: true,
        },
        {
            type: 'scatter3d',
            mode: 'markers',
            x: points.filter(p => p.regions.length === 1 && p.regions[0] === 'interesting').map(p => p.pos[0]),
            y: points.filter(p => p.regions.length === 1 && p.regions[0] === 'interesting').map(p => p.pos[1]),
            z: points.filter(p => p.regions.length === 1 && p.regions[0] === 'interesting').map(p => p.pos[2]),
            text: points.filter(p => p.regions.length === 1 && p.regions[0] === 'interesting').map(buildHoverText),
            hoverinfo: 'text',
            marker: {
                size: 10, symbol: 'circle',
                color: points.filter(p => p.regions.length === 1 && p.regions[0] === 'interesting').map(pointColor),
                line: { color: '#ffffff', width: 1.5 },
                opacity: 1.0,
            },
            name: 'interesting',
            showlegend: true,
        },
        {
            type: 'scatter3d',
            mode: 'markers',
            x: points.filter(p => p.regions.length === 1 && p.regions[0] === 'minimal').map(p => p.pos[0]),
            y: points.filter(p => p.regions.length === 1 && p.regions[0] === 'minimal').map(p => p.pos[1]),
            z: points.filter(p => p.regions.length === 1 && p.regions[0] === 'minimal').map(p => p.pos[2]),
            text: points.filter(p => p.regions.length === 1 && p.regions[0] === 'minimal').map(buildHoverText),
            hoverinfo: 'text',
            marker: {
                size: 10, symbol: 'circle',
                color: points.filter(p => p.regions.length === 1 && p.regions[0] === 'minimal').map(pointColor),
                line: { color: '#ffffff', width: 1.5 },
                opacity: 1.0,
            },
            name: 'minimal',
            showlegend: true,
        },

        // -------- Overlap points (diamonds, larger, white rim) --------
        {
            type: 'scatter3d',
            mode: 'markers',
            x: points.filter(p => p.regions.length >= 2).map(p => p.pos[0]),
            y: points.filter(p => p.regions.length >= 2).map(p => p.pos[1]),
            z: points.filter(p => p.regions.length >= 2).map(p => p.pos[2]),
            text: points.filter(p => p.regions.length >= 2).map(buildHoverText),
            hoverinfo: 'text',
            marker: {
                size: points.filter(p => p.regions.length >= 2).map(p => p.regions.length === 3 ? 18 : 14),
                symbol: 'diamond',
                color: points.filter(p => p.regions.length >= 2).map(pointColor),
                line: { color: '#ffffff', width: 2 },
                opacity: 1.0,
            },
            name: 'overlap',
            showlegend: true,
        },

        // -------- Void points (gray crosses) --------
        {
            type: 'scatter3d',
            mode: 'markers',
            x: points.filter(p => p.regions.length === 0).map(p => p.pos[0]),
            y: points.filter(p => p.regions.length === 0).map(p => p.pos[1]),
            z: points.filter(p => p.regions.length === 0).map(p => p.pos[2]),
            text: points.filter(p => p.regions.length === 0).map(buildHoverText),
            hoverinfo: 'text',
            marker: {
                size: 8, symbol: 'cross',
                color: '#94a3b8',
                line: { color: '#cbd5e1', width: 1 },
                opacity: 0.8,
            },
            name: 'void',
            showlegend: true,
        },

        // -------- Region-centre labels (text on top) --------
        {
            type: 'scatter3d',
            mode: 'markers+text',
            x: Object.values(regions).map(r => r.center[0]),
            y: Object.values(regions).map(r => r.center[1]),
            z: Object.values(regions).map(r => r.center[2]),
            text: Object.values(regions).map(r => r.label),
            textposition: 'top center',
            textfont: { size: 13, color: '#f8fafc' },
            hoverinfo: 'skip',
            marker: {
                size: 5, symbol: 'diamond-open',
                color: Object.values(regions).map(r => r.color),
                line: { color: '#ffffff', width: 2 },
            },
            showlegend: false,
        },
    ];

    const layout = {
        paper_bgcolor: '#000000',
        plot_bgcolor:  '#000000',
        font: { family: 'system-ui, sans-serif', color: '#e2e8f0', size: 11 },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(15,16,32,0.6)',
            bordercolor: 'rgba(148,163,184,0.3)',
            borderwidth: 1,
            font: { color: '#e2e8f0', size: 10 },
            x: 0.02, y: 0.98, xanchor: 'left', yanchor: 'top',
        },
        // Global hoverlabel styling — light bg, dark text, high contrast
        hoverlabel: {
            bgcolor: '#fefce8',
            bordercolor: '#1f2937',
            borderwidth: 1,
            font: { family: 'system-ui, sans-serif', size: 12, color: '#1f2937' },
            align: 'left',
        },
        scene: {
            bgcolor: '#000000',
            xaxis: {
                title: { text: 'x', font: { color: '#f87171', size: 13 } },
                range: [-1.7, 1.7],
                gridcolor: 'rgba(255,255,255,0.18)',
                zerolinecolor: 'rgba(255,255,255,0.3)',
                showbackground: true,
                backgroundcolor: 'rgba(20,20,35,0.3)',
                tickfont: { color: '#94a3b8', size: 9 },
                linecolor: 'rgba(148,163,184,0.4)',
            },
            yaxis: {
                title: { text: 'y', font: { color: '#4ade80', size: 13 } },
                range: [-1.7, 1.7],
                gridcolor: 'rgba(255,255,255,0.18)',
                zerolinecolor: 'rgba(255,255,255,0.3)',
                showbackground: true,
                backgroundcolor: 'rgba(20,20,35,0.3)',
                tickfont: { color: '#94a3b8', size: 9 },
                linecolor: 'rgba(148,163,184,0.4)',
            },
            zaxis: {
                title: { text: 'z', font: { color: '#60a5fa', size: 13 } },
                range: [-1.7, 1.7],
                gridcolor: 'rgba(255,255,255,0.18)',
                zerolinecolor: 'rgba(255,255,255,0.3)',
                showbackground: true,
                backgroundcolor: 'rgba(20,20,35,0.3)',
                tickfont: { color: '#94a3b8', size: 9 },
                linecolor: 'rgba(148,163,184,0.4)',
            },
            camera: {
                eye: { x: 1.4, y: 1.1, z: 1.3 },
                center: { x: 0, y: 0, z: 0 },
            },
            aspectmode: 'cube',
        },
    };

    const config = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
    };

    Plotly.newPlot(root, traces, layout, config);
}

function renderPEInteractiveLab() {
    const container = document.getElementById('pe-interactive-lab');
    if (!container) return;
    let stepsUsed = 0;
    let isCoT = false;
    container.innerHTML = `
        <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:30px;">
            <div style="font-weight:bold;margin-bottom:12px;">Prompt Lab: "A farmer has 17 sheep. All but 9 die. How many are left?"</div>
            <div style="margin-bottom:12px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="pe-cot-toggle"> <strong>Add Chain-of-Thought</strong> <span style="color:#94a3b8;font-size:0.85em;">("Think step by step")</span>
                </label>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button id="pe-lab-run" class="btn btn-primary" style="padding:8px 20px;">Run Prompt</button>
                <button id="pe-lab-steps" class="btn btn-secondary" style="padding:8px 20px;">+ Add Reasoning Token</button>
            </div>
            <div id="pe-lab-output" style="min-height:80px;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;font-family:monospace;white-space:pre-wrap;"></div>
            <div id="pe-lab-vis" style="height:200px;margin-top:12px;"></div>
            <div style="margin-top:8px;display:flex;gap:16px;font-size:0.85em;color:#64748b;">
                <span>Reasoning steps: <span id="pe-step-count">0</span></span>
                <span>Confidence: <span id="pe-confidence">0%</span></span>
            </div>
        </div>
    `;
    const output = document.getElementById('pe-lab-output');
    const runBtn = document.getElementById('pe-lab-run');
    const stepBtn = document.getElementById('pe-lab-steps');
    const toggle = document.getElementById('pe-cot-toggle');
    const stepCount = document.getElementById('pe-step-count');
    const confidence = document.getElementById('pe-confidence');
    const visEl = document.getElementById('pe-lab-vis');
    const scenarios = {
        direct: [
            { text: 'The farmer has 17 sheep. All but 9 die. So 9 are left.', correct: true },
            { text: '17 - 9 = 8 sheep are left.', correct: false },
            { text: 'All but 9 means 9 survived. Answer: 9.', correct: true },
            { text: '17 sheep, all but 9 die means 8 die, so 9 remain.', correct: true },
            { text: '17 - all but 9 = 17 - 8 = 9 left.', correct: true },
        ],
        cot: [
            { text: 'Step 1: "All but 9 die" means 9 sheep survive.', correct: true },
            { text: 'Step 2: So the number left is 9.', correct: true },
            { text: 'Therefore, 9 sheep are left.', correct: true },
        ],
    };
    function runPrompt() {
        isCoT = toggle.checked;
        const set = isCoT ? scenarios.cot : scenarios.direct;
        const idx = Math.floor(Math.random() * set.length);
        const result = set[idx];
        output.textContent = result.text;
        stepsUsed = isCoT ? 3 : 1;
        stepCount.textContent = stepsUsed;
        const conf = Math.round((result.correct ? 0.7 + Math.random() * 0.25 : 0.2 + Math.random() * 0.3) * 100);
        confidence.textContent = conf + '%';
        if (result.correct) {
            output.style.borderLeft = '4px solid #22c55e';
        } else {
            output.style.borderLeft = '4px solid #ef4444';
        }
        updateLabVis();
    }
    function addStep() {
        stepsUsed++;
        stepCount.textContent = stepsUsed;
        output.textContent += `\n→ Additional reasoning step ${stepsUsed}...`;
        const confVal = Math.min(98, parseInt(confidence.textContent) + 5 + Math.floor(Math.random() * 10));
        confidence.textContent = Math.min(99, confVal) + '%';
        updateLabVis();
    }
    function updateLabVis() {
        const maxSteps = 12;
        const displaySteps = Math.min(stepsUsed, maxSteps);
        const probs = Array.from({length: displaySteps}, (_, i) => {
            const base = isCoT ? 0.3 : 0.15;
            const boost = isCoT ? 0.06 : 0.03;
            return Math.min(0.95, base + (i + 1) * boost + (Math.random() - 0.5) * 0.05);
        });
        const data = [{
            x: probs.map((_, i) => i + 1),
            y: probs,
            type: 'bar',
            marker: {
                color: probs.map(p => p > 0.8 ? '#22c55e' : p > 0.5 ? '#f59e0b' : '#ef4444'),
            },
            hovertemplate: 'Step %{x}<br>Confidence: %{y:.0%}<extra></extra>',
        }];
        Plotly.react(visEl, data, {
            title: { text: isCoT ? 'Chain-of-Thought: Confidence Builds Step by Step' : 'Direct Prompt: Low Confidence on First Guess', font: { size: 12 } },
            xaxis: { title: 'Reasoning Step', dtick: 1 },
            yaxis: { title: 'Confidence', range: [0, 1], tickformat: '.0%' },
            margin: { t: 30, b: 30, l: 40, r: 10 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'system-ui, sans-serif' },
            showlegend: false,
        }, { responsive: true });
    }
    runBtn.addEventListener('click', runPrompt);
    stepBtn.addEventListener('click', addStep);
    toggle.addEventListener('change', () => { if (output.textContent) runPrompt(); });
    runPrompt();
}

async function loadPromptengineeringModule() {
    updateLoadingStatus("Loading Prompt Engineering techniques...");
    Promise.all([
        renderPESpecificityCone(),
        renderPENegationSpace(),
        renderPETechRadar(),
        renderPECoTAccuracy(),
        renderPEPromptInjection(),
        renderPEContradictionIntersection(),
        renderPEInteractiveLab(),
    ]);
    const resizeAll = () => {
        ['pe-specificity-cone', 'pe-negation-space', 'pe-tech-radar', 'pe-cot-accuracy', 'pe-injection-heatmap'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.data && el.data.length) Plotly.Plots.resize(el);
        });
    };
    window.addEventListener('resize', resizeAll);
    return Promise.resolve();
}
