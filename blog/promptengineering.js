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
