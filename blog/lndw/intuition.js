// ============================================================
// FORWARD PASS 3D VISUALIZATION
// ============================================================

const ForwardPassViz = {
    tokens: ['Die', 'Katze', 'saß', 'auf', 'der'],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    currentStep: 0,
    maxSteps: 5, // 0=embed, 1=layer1, 2=layer2, 3=layer3, 4=unembedding, 5=result
    plotDiv: null,
    animating: false,

    // Positions at each step (simulated 3D trajectory)
    positions: null,

    _generatePositions: function() {
        const rng = (seed) => { let s = seed; return () => { s = (s * 16807 + 7) % 2147483647; return (s - 1) / 2147483646; }; };
        this.positions = [];
        
        // Step 0: Embedding (spread out, no context)
        const embed = [
            [1.2, 0.5, -0.3],   // Die
            [-0.8, 1.5, 0.7],   // Katze
            [0.3, -1.2, 1.4],   // saß
            [1.8, 0.8, -1.0],   // auf
            [0.9, -0.5, 0.2],   // der
        ];
        this.positions.push(embed);

        // Step 1: After Layer 1 (local grouping, subword composition)
        this.positions.push([
            [1.0, 0.6, -0.1],
            [-0.5, 1.8, 0.9],
            [0.5, -0.8, 1.2],
            [1.5, 0.5, -0.7],
            [1.1, 0.0, 0.0],
        ]);

        // Step 2: After Layer 2 (semantic clustering)
        this.positions.push([
            [0.8, 0.9, 0.2],
            [-0.2, 2.1, 1.1],
            [0.7, -0.3, 0.8],
            [1.2, 0.3, -0.3],
            [1.0, 0.5, 0.3],
        ]);

        // Step 3: After Layer 3 (strong context, convergence)
        this.positions.push([
            [0.6, 1.1, 0.5],
            [0.1, 2.0, 1.3],
            [0.8, 0.2, 0.5],
            [0.9, 0.8, 0.1],
            [0.8, 1.0, 0.6],  // "der" accumulates context
        ]);

        // Step 4: Final (last token moves toward prediction region)
        this.positions.push([
            [0.5, 1.0, 0.5],
            [0.0, 1.9, 1.2],
            [0.7, 0.3, 0.5],
            [0.8, 0.9, 0.2],
            [1.5, 1.8, 1.0],  // "der" → prediction region
        ]);

        // Step 5: Unembedding (show result token)
        this.positions.push([
            [0.5, 1.0, 0.5],
            [0.0, 1.9, 1.2],
            [0.7, 0.3, 0.5],
            [0.8, 0.9, 0.2],
            [1.8, 2.0, 1.2],  // lands near "Matte"
        ]);
    },

    render: function() {
        const plotDiv = document.getElementById('forward-pass-3d');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;
        if (!this.positions) this._generatePositions();

        const step = this.currentStep;
        const pos = this.positions[Math.min(step, this.positions.length - 1)];
        const traces = [];

        // Token points
        traces.push({
            x: pos.map(p => p[0]),
            y: pos.map(p => p[1]),
            z: pos.map(p => p[2]),
            mode: 'markers+text',
            type: 'scatter3d',
            text: this.tokens,
            textposition: 'top center',
            textfont: { size: 12, color: this.colors },
            marker: { size: 10, color: this.colors, line: { width: 1, color: '#fff' } },
            hovertemplate: '<b>%{text}</b><br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>',
            name: 'Tokens'
        });

        // Movement trails (show path from embedding to current)
        if (step > 0) {
            for (let t = 0; t < this.tokens.length; t++) {
                const pathX = [], pathY = [], pathZ = [];
                for (let s = 0; s <= Math.min(step, this.positions.length - 1); s++) {
                    pathX.push(this.positions[s][t][0]);
                    pathY.push(this.positions[s][t][1]);
                    pathZ.push(this.positions[s][t][2]);
                }
                traces.push({
                    x: pathX, y: pathY, z: pathZ,
                    mode: 'lines',
                    type: 'scatter3d',
                    line: { color: this.colors[t], width: 3, dash: t === 4 ? 'solid' : 'dot' },
                    opacity: t === 4 ? 1 : 0.5,
                    showlegend: false,
                    hoverinfo: 'none'
                });
            }
        }

        // Prediction region (show at step 4+)
        if (step >= 4) {
            // Target words as faint points
            const targets = [
                { word: 'Matte', pos: [1.9, 2.1, 1.1] },
                { word: 'Bank', pos: [2.2, 1.5, 0.8] },
                { word: 'Straße', pos: [1.6, 2.3, 1.4] },
            ];
            traces.push({
                x: targets.map(t => t.pos[0]),
                y: targets.map(t => t.pos[1]),
                z: targets.map(t => t.pos[2]),
                mode: 'markers+text',
                type: 'scatter3d',
                text: targets.map(t => t.word),
                textposition: 'bottom center',
                textfont: { size: 10, color: '#94a3b8' },
                marker: { size: 6, color: '#cbd5e1', symbol: 'diamond' },
                showlegend: false,
                hovertemplate: '<b>%{text}</b> (Vokabular)<extra></extra>'
            });
        }

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'Dim 1', range: [-2, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                yaxis: { title: 'Dim 2', range: [-2, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                zaxis: { title: 'Dim 3', range: [-2, 2.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                camera: { eye: { x: 1.8, y: 1.2, z: 0.8 } },
                aspectratio: { x: 1, y: 1, z: 0.7 },
                dragmode: 'turntable'
            },
            showlegend: false,
            hovermode: 'closest'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true, scrollZoom: true });
        this._updateUI();
    },

    _updateUI: function() {
        const label = document.getElementById('forward-pass-step-label');
        const info = document.getElementById('forward-pass-info');
        const stepNames = ['Embedding', 'Layer 1 (Syntax)', 'Layer 2 (Semantik)', 'Layer 3 (Kontext)', 'Unembedding', 'Vorhersage: "Matte"'];
        const stepDescs = [
            'Jedes Token wird zu einem Punkt im Raum. Noch kein Kontext – "Katze" weiß noch nicht, dass sie sitzt.',
            '<b>Layer 1:</b> Lokale Verschiebung. "Die" und "Katze" rücken zusammen (Nominalphrase). Punkte bewegen sich nur wenig.',
            '<b>Layer 2:</b> Semantische Beziehungen. "saß" wird zum Subjekt "Katze" gezogen. Wer-tat-was wird kodiert.',
            '<b>Layer 3:</b> Voller Kontext akkumuliert im letzten Token "der". Es sammelt die Gesamtbedeutung des Satzes.',
            '<b>Unembedding:</b> Der finale Punkt von "der" wird mit allen Vokabular-Embeddings verglichen. Das nächste Wort, dessen Embedding am nächsten zeigt, gewinnt.',
            '🎯 <b>"Matte"</b> gewinnt! Der Punkt von "der" landet in der Region, die auf Orte/Oberflächen zeigt. → "Die Katze saß auf der <b>Matte</b>"'
        ];
        if (label) label.textContent = 'Schritt: ' + stepNames[Math.min(this.currentStep, 5)];
        if (info) info.innerHTML = stepDescs[Math.min(this.currentStep, 5)] + '<br><span style="font-size:0.8em; color:#64748b;">⚠️ 3D-Projektion eines 4096+-dimensionalen Raums. Abstände vereinfacht.</span>';
    },

    stepForward: function() {
        if (this.currentStep < this.maxSteps) {
            this.currentStep++;
            this.render();
        }
    },

    reset: function() {
        this.currentStep = 0;
        this.animating = false;
        this.render();
    },

    animateAll: function() {
        if (this.animating) return;
        this.animating = true;
        this.currentStep = 0;
        this.render();
        let step = 0;
        const interval = setInterval(() => {
            step++;
            this.currentStep = step;
            this.render();
            if (step >= this.maxSteps) {
                clearInterval(interval);
                this.animating = false;
            }
        }, 1200);
    }
};

// ============================================================
// EMBEDDING 3D VISUALIZATION
// ============================================================

const Embedding3DViz = {
    plotDiv: null,
    showClusters: true,
    showDirections: true,
    showArith: false,

    // Word positions in 3D (simulated projection)
    words: {
        'König': { pos: [2.0, -0.8, 1.5], color: '#3b82f6', cluster: 'royalty' },
        'Königin': { pos: [2.0, 0.8, 1.5], color: '#ec4899', cluster: 'royalty' },
        'Mann': { pos: [0.5, -1.2, 0.3], color: '#6366f1', cluster: 'people' },
        'Frau': { pos: [0.5, 1.2, 0.3], color: '#f43f5e', cluster: 'people' },
        'Katze': { pos: [-2.0, 0.3, -0.5], color: '#10b981', cluster: 'animals' },
        'Hund': { pos: [-2.2, -0.3, -0.7], color: '#f59e0b', cluster: 'animals' },
        'Hamburg': { pos: [-0.5, -0.2, 2.5], color: '#0ea5e9', cluster: 'geo' },
        'Elbe': { pos: [-0.3, 0.1, 2.3], color: '#06b6d4', cluster: 'geo' },
        'Spree': { pos: [0.8, 0.4, 2.1], color: '#14b8a6', cluster: 'geo' },
        'Berlin': { pos: [1.0, 0.2, 2.4], color: '#0284c7', cluster: 'geo' },
        'Liebe': { pos: [1.5, 2.0, -1.0], color: '#e11d48', cluster: 'abstract' },
        'Hass': { pos: [1.5, -2.0, -1.0], color: '#7f1d1d', cluster: 'abstract' },
        'schnell': { pos: [-1.0, -1.5, -2.0], color: '#84cc16', cluster: 'adj' },
        'langsam': { pos: [-1.0, 1.5, -2.0], color: '#65a30d', cluster: 'adj' },
    },

    clusters: {
        royalty: { center: [2.0, 0.0, 1.5], radius: 1.2, color: 'rgba(59,130,246,0.08)', label: 'Adel' },
        people: { center: [0.5, 0.0, 0.3], radius: 1.5, color: 'rgba(99,102,241,0.06)', label: 'Menschen' },
        animals: { center: [-2.1, 0.0, -0.6], radius: 1.0, color: 'rgba(16,185,129,0.08)', label: 'Tiere' },
        geo: { center: [0.3, 0.1, 2.3], radius: 1.3, color: 'rgba(14,165,233,0.07)', label: 'Geographie' },
        abstract: { center: [1.5, 0.0, -1.0], radius: 2.2, color: 'rgba(225,29,72,0.05)', label: 'Emotion' },
    },

    directions: [
        { from: [-0.5, -1.5, 0], to: [-0.5, 1.5, 0], label: 'Gender ♂→♀', color: '#a855f7' },
        { from: [-1.5, 0, 0], to: [2.5, 0, 0], label: 'Rang (gewöhnlich→königlich)', color: '#f59e0b' },
        { from: [0, 0, -2], to: [0, 0, 2.5], label: 'Konkretheit (abstrakt→konkret)', color: '#06b6d4' },
    ],

    arithStep: 0,
    arithInterval: null,

    render: function() {
        const plotDiv = document.getElementById('embedding-3d-plot');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;

        const traces = [];
        const wordEntries = Object.entries(this.words);

        // Word points
        traces.push({
            x: wordEntries.map(([_, w]) => w.pos[0]),
            y: wordEntries.map(([_, w]) => w.pos[1]),
            z: wordEntries.map(([_, w]) => w.pos[2]),
            mode: 'markers+text',
            type: 'scatter3d',
            text: wordEntries.map(([name]) => name),
            textposition: 'top center',
            textfont: { size: 11, color: wordEntries.map(([_, w]) => w.color) },
            marker: {
                size: 8,
                color: wordEntries.map(([_, w]) => w.color),
                line: { width: 1, color: '#fff' }
            },
            hovertemplate: '<b>%{text}</b><br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>',
            name: 'Wörter'
        });

        // Clusters (transparent spheres approximated with mesh3d)
        if (this.showClusters) {
            Object.values(this.clusters).forEach(cl => {
                // Approximate sphere with scatter points on surface
                const pts = 30;
                const cx = [], cy = [], cz = [];
                for (let i = 0; i < pts; i++) {
                    const phi = Math.acos(2 * Math.random() - 1);
                    const theta = Math.random() * Math.PI * 2;
                    cx.push(cl.center[0] + cl.radius * Math.sin(phi) * Math.cos(theta));
                    cy.push(cl.center[1] + cl.radius * Math.sin(phi) * Math.sin(theta));
                    cz.push(cl.center[2] + cl.radius * Math.cos(phi));
                }
                traces.push({
                    x: cx, y: cy, z: cz,
                    mode: 'markers',
                    type: 'scatter3d',
                    marker: { size: 3, color: cl.color.replace('0.0', '0.3'), opacity: 0.15 },
                    hoverinfo: 'none',
                    showlegend: false
                });
                // Cluster label
                traces.push({
                    x: [cl.center[0]], y: [cl.center[1]], z: [cl.center[2] + cl.radius + 0.2],
                    mode: 'text',
                    type: 'scatter3d',
                    text: [cl.label],
                    textfont: { size: 10, color: '#94a3b8' },
                    hoverinfo: 'none',
                    showlegend: false
                });
            });
        }

        // Direction arrows
        if (this.showDirections) {
            this.directions.forEach(dir => {
                traces.push({
                    x: [dir.from[0], dir.to[0]],
                    y: [dir.from[1], dir.to[1]],
                    z: [dir.from[2], dir.to[2]],
                    mode: 'lines',
                    type: 'scatter3d',
                    line: { color: dir.color, width: 4, dash: 'dash' },
                    hoverinfo: 'none',
                    showlegend: false
                });
                // Arrow label at endpoint
                traces.push({
                    x: [dir.to[0]], y: [dir.to[1]], z: [dir.to[2]],
                    mode: 'text',
                    type: 'scatter3d',
                    text: [dir.label],
                    textfont: { size: 9, color: dir.color },
                    hoverinfo: 'none',
                    showlegend: false
                });
            });
        }

        // Arithmetic visualization
        if (this.showArith && this.arithStep > 0) {
            this._renderArithTraces(traces);
        }

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'Dim 1', range: [-3.5, 3.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                yaxis: { title: 'Dim 2', range: [-3, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                zaxis: { title: 'Dim 3', range: [-3, 3.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                camera: { eye: { x: 1.6, y: 1.4, z: 0.9 } },
                aspectratio: { x: 1, y: 1, z: 0.8 },
                dragmode: 'turntable'
            },
            showlegend: false,
            hovermode: 'closest'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true, scrollZoom: true });
    },

    _renderArithTraces: function(traces) {
        const king = this.words['König'].pos;
        const man = this.words['Mann'].pos;
        const woman = this.words['Frau'].pos;

        // Step 1: König position
        const step1 = king;
        // Step 2: König - Mann
        const step2 = [king[0] - man[0], king[1] - man[1], king[2] - man[2]];
        // Step 3: + Frau
        const step3 = [step2[0] + woman[0], step2[1] + woman[1], step2[2] + woman[2]];

        const points = [step1];
        if (this.arithStep >= 2) points.push(step2);
        if (this.arithStep >= 3) points.push(step3);

        // Path
        if (points.length > 1) {
            traces.push({
                x: points.map(p => p[0]),
                y: points.map(p => p[1]),
                z: points.map(p => p[2]),
                mode: 'lines+markers',
                type: 'scatter3d',
                line: { color: '#ef4444', width: 5 },
                marker: { size: 6, color: '#ef4444' },
                hoverinfo: 'none',
                showlegend: false
            });
        }

        // Result point (step 3)
        if (this.arithStep >= 3) {
            traces.push({
                x: [step3[0]], y: [step3[1]], z: [step3[2]],
                mode: 'markers+text',
                type: 'scatter3d',
                text: ['≈ Königin!'],
                textposition: 'bottom center',
                textfont: { size: 13, color: '#ef4444', weight: 'bold' },
                marker: { size: 14, color: '#ef4444', symbol: 'diamond', line: { width: 2, color: '#fff' } },
                hoverinfo: 'none',
                showlegend: false
            });
        }
    },

    showArithmetic: function() {
        if (this.arithInterval) { clearInterval(this.arithInterval); this.arithInterval = null; }
        this.showArith = true;
        this.arithStep = 0;
        const info = document.getElementById('embedding-3d-info');

        const steps = [
            'Starte bei <b>König</b> (2.0, -0.8, 1.5)...',
            '<b>König − Mann</b>: Subtrahiere die "Mann-Richtung" → der Punkt verschiebt sich...',
            '<b>+ Frau</b>: Addiere die "Frau-Richtung" → der Punkt landet bei <b>≈ Königin!</b> Vektorarithmetik funktioniert, weil Bedeutung als Richtung kodiert ist.'
        ];

        let step = 0;
        this.arithInterval = setInterval(() => {
            step++;
            this.arithStep = step;
            if (info) info.innerHTML = '👑 ' + steps[Math.min(step - 1, steps.length - 1)];
            this.render();
            if (step >= 3) { clearInterval(this.arithInterval); this.arithInterval = null; }
        }, 1200);
    },

    toggleClusters: function() {
        this.showClusters = !this.showClusters;
        this.render();
    },

    toggleDirections: function() {
        this.showDirections = !this.showDirections;
        this.render();
    }
};

// ============================================================
// ATTENTION 3D VISUALIZATION
// ============================================================

const Attention3DViz = {
    tokens: ['Die', 'Katze', 'saß', 'auf', 'der'],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    currentLayer: 0,
    plotDiv: null,
    animating: false,

    // Base positions (embedding)
    basePositions: [
        [1.0, 0.5, -0.3],
        [-0.8, 1.5, 0.7],
        [0.3, -1.0, 1.2],
        [1.6, 0.8, -0.8],
        [0.8, -0.4, 0.1],
    ],

    // How much each token moves at each layer (simulated attention effect)
    // [layer][token] = displacement vector
    layerDisplacements: [
        // Layer 0: very local, subword composition
        [[0.05, 0.02, 0.01], [0.1, 0.05, 0.03], [0.02, 0.03, -0.02], [0.03, -0.02, 0.04], [0.08, 0.04, 0.02]],
        // Layer 1: moderate, syntactic grouping
        [[0.15, 0.1, 0.05], [0.2, 0.15, 0.1], [0.1, 0.2, -0.1], [0.08, -0.05, 0.12], [0.18, 0.12, 0.08]],
        // Layer 2: larger, semantic relationships
        [[0.3, 0.2, 0.15], [0.4, 0.3, 0.2], [0.25, 0.35, -0.15], [0.15, -0.1, 0.25], [0.35, 0.25, 0.2]],
        // Layer 3: strong context accumulation
        [[0.4, 0.3, 0.2], [0.5, 0.4, 0.3], [0.35, 0.45, -0.1], [0.2, -0.05, 0.35], [0.6, 0.5, 0.4]],
        // Layer 4: final, last token moves most
        [[0.4, 0.3, 0.2], [0.5, 0.4, 0.3], [0.35, 0.45, -0.1], [0.2, -0.05, 0.35], [0.9, 0.7, 0.6]],
    ],

    // Attention heads (which tokens attend to which, per layer)
    attentionHeads: [
        // Layer 0: local attention (adjacent tokens)
        [{ from: 1, to: 0, strength: 0.8, head: 'Syntax' }, { from: 4, to: 3, strength: 0.7, head: 'Syntax' }],
        // Layer 1: noun-verb links
        [{ from: 2, to: 1, strength: 0.9, head: 'Subjekt' }, { from: 4, to: 0, strength: 0.5, head: 'Artikel' }],
        // Layer 2: broader context
        [{ from: 4, to: 1, strength: 0.8, head: 'Semantik' }, { from: 4, to: 2, strength: 0.6, head: 'Verb' }, { from: 2, to: 1, strength: 0.7, head: 'Agens' }],
        // Layer 3: full context to last token
        [{ from: 4, to: 0, strength: 0.5, head: 'Kontext' }, { from: 4, to: 1, strength: 0.9, head: 'Kontext' }, { from: 4, to: 2, strength: 0.8, head: 'Kontext' }, { from: 4, to: 3, strength: 0.6, head: 'Kontext' }],
        // Layer 4: prediction focus
        [{ from: 4, to: 1, strength: 0.95, head: 'Vorhersage' }, { from: 4, to: 2, strength: 0.7, head: 'Vorhersage' }],
    ],

    getPositionAtLayer: function(tokenIdx, layer) {
        const base = this.basePositions[tokenIdx];
        let pos = [...base];
        for (let l = 0; l <= layer; l++) {
            const disp = this.layerDisplacements[l][tokenIdx];
            pos = pos.map((v, i) => v + disp[i]);
        }
        return pos;
    },

    render: function() {
        const plotDiv = document.getElementById('attention-3d-plot');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;

        const layer = this.currentLayer;
        const traces = [];

        // Current positions
        const positions = this.tokens.map((_, i) => this.getPositionAtLayer(i, layer));

        // Token points
        traces.push({
            x: positions.map(p => p[0]),
            y: positions.map(p => p[1]),
            z: positions.map(p => p[2]),
            mode: 'markers+text',
            type: 'scatter3d',
            text: this.tokens,
            textposition: 'top center',
            textfont: { size: 12, color: this.colors },
            marker: { size: 10, color: this.colors, line: { width: 1, color: '#fff' } },
            hovertemplate: '<b>%{text}</b><br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>',
            name: 'Tokens'
        });

        // Ghost positions (where they were at layer 0)
        if (layer > 0) {
            const ghostPos = this.tokens.map((_, i) => this.basePositions[i]);
            traces.push({
                x: ghostPos.map(p => p[0]),
                y: ghostPos.map(p => p[1]),
                z: ghostPos.map(p => p[2]),
                mode: 'markers',
                type: 'scatter3d',
                marker: { size: 5, color: '#e2e8f0', opacity: 0.4 },
                hoverinfo: 'none',
                showlegend: false
            });
            // Trails from ghost to current
            for (let t = 0; t < this.tokens.length; t++) {
                traces.push({
                    x: [ghostPos[t][0], positions[t][0]],
                    y: [ghostPos[t][1], positions[t][1]],
                    z: [ghostPos[t][2], positions[t][2]],
                    mode: 'lines',
                    type: 'scatter3d',
                    line: { color: this.colors[t], width: 2, dash: 'dot' },
                    opacity: 0.4,
                    hoverinfo: 'none',
                    showlegend: false
                });
            }
        }

        // Attention lines
        const headColors = { 'Syntax': '#3b82f6', 'Subjekt': '#10b981', 'Artikel': '#f59e0b', 'Semantik': '#8b5cf6', 'Verb': '#ec4899', 'Agens': '#06b6d4', 'Kontext': '#6366f1', 'Vorhersage': '#ef4444' };
        const heads = this.attentionHeads[layer] || [];

        heads.forEach(attn => {
            const fromPos = positions[attn.from];
            const toPos = positions[attn.to];
            const color = headColors[attn.head] || '#94a3b8';

            traces.push({
                x: [fromPos[0], toPos[0]],
                y: [fromPos[1], toPos[1]],
                z: [fromPos[2], toPos[2]],
                mode: 'lines',
                type: 'scatter3d',
                line: { color: color, width: Math.max(2, attn.strength * 6) },
                opacity: 0.7,
                hoverinfo: 'none',
                showlegend: false
            });
            // Midpoint label
            const mid = [(fromPos[0] + toPos[0]) / 2, (fromPos[1] + toPos[1]) / 2, (fromPos[2] + toPos[2]) / 2];
            traces.push({
                x: [mid[0]], y: [mid[1]], z: [mid[2]],
                mode: 'text',
                type: 'scatter3d',
                text: [attn.head],
                textfont: { size: 9, color: color },
                hoverinfo: 'none',
                showlegend: false
            });
        });

        // Causal mask visualization: show which tokens CAN'T attend
        // (faint X marks for future tokens)

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'Dim 1', range: [-2, 4], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                yaxis: { title: 'Dim 2', range: [-2, 3.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                zaxis: { title: 'Dim 3', range: [-2, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                camera: { eye: { x: 1.7, y: 1.3, z: 0.9 } },
                aspectratio: { x: 1, y: 1, z: 0.7 },
                dragmode: 'turntable'
            },
            showlegend: false,
            hovermode: 'closest'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true, scrollZoom: true });
        this._updateLabel();
    },

    _updateLabel: function() {
        const label = document.getElementById('attention-layer-label');
        const info = document.getElementById('attention-3d-info');
        const layerNames = ['Layer 0 (früh)', 'Layer 1', 'Layer 2', 'Layer 3', 'Layer 4 (spät)'];
        const layerDescs = [
            'Lokale Attention: Benachbarte Tokens gruppieren sich. "Die"→"Katze" (Nominalphrase). Verschiebung minimal.',
            'Syntaktische Rollen: "saß" erkennt "Katze" als Subjekt. Punkte bewegen sich stärker.',
            'Semantische Beziehungen: "der" beginnt Kontext zu sammeln. Breitere Attention-Muster.',
            'Voller Kontext: "der" (letztes Token) sammelt Information von ALLEN vorherigen Tokens. Starke Verschiebung.',
            'Vorhersage-Fokus: Das letzte Token akkumuliert die Gesamtbedeutung. Es bewegt sich am stärksten – bereit für Unembedding.'
        ];
        if (label) label.textContent = layerNames[this.currentLayer];
        if (info) info.innerHTML = '🧲 ' + layerDescs[this.currentLayer] + '<br><span style="font-size:0.8em; color:#64748b;">Farbige Linien = verschiedene Attention-Köpfe. Stärke = Linienstärke. Kausale Maske: nur links→rechts.</span>';
    },

    setLayer: function(layer) {
        this.currentLayer = layer;
        document.getElementById('attention-layer-slider').value = layer;
        this.render();
    },

    animateLayers: function() {
        if (this.animating) return;
        this.animating = true;
        this.currentLayer = 0;
        this.render();
        let layer = 0;
        const interval = setInterval(() => {
            layer++;
            this.currentLayer = layer;
            document.getElementById('attention-layer-slider').value = layer;
            this.render();
            if (layer >= 4) {
                clearInterval(interval);
                this.animating = false;
            }
        }, 1500);
    }
};

// ============================================================
// FFN 3D VISUALIZATION
// ============================================================

const FFN3DViz = {
    plotDiv: null,
    currentFact: 'rare',
    animating: false,

    // Point positions for different facts
    facts: {
        rare: {
            label: 'Selten: "Hauptstadt von Liechtenstein = Vaduz"',
            startPos: [0.5, 1.0, 0.3],
            endPos: [0.8, 1.3, 0.5],
            arrowLength: 0.5,
            activeNeurons: 3,
            totalNeurons: 20,
            description: '<b>Wenige Neuronen aktiv</b> (3 von tausenden) → kurzer, spezifischer Verschiebungsvektor. Seltenes Wissen ist <b>lokal kodiert</b>.',
            detectors: ['Hauptstadt?', 'Kleinstaat?', 'Europa?'],
            detectorStates: [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        common: {
            label: 'Häufig: "nach Artikel kommt Nomen"',
            startPos: [0.5, 1.0, 0.3],
            endPos: [1.8, 2.2, 1.5],
            arrowLength: 2.2,
            activeNeurons: 15,
            totalNeurons: 20,
            description: '<b>Viele Neuronen aktiv</b> (15 von tausenden) → langer, verteilter Verschiebungsvektor. Häufiges Muster ist <b>global kodiert</b>.',
            detectors: ['Artikel?', 'Nomen-Kontext?', 'Syntax?', 'Deutsch?', 'Singular?'],
            detectorStates: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false],
        },
        medium: {
            label: 'Mittel: "Katzen sind Tiere"',
            startPos: [0.5, 1.0, 0.3],
            endPos: [1.2, 1.7, 0.9],
            arrowLength: 1.2,
            activeNeurons: 8,
            totalNeurons: 20,
            description: '<b>Mittlere Aktivierung</b> (8 Neuronen) → mittlerer Verschiebungsvektor. Allgemeinwissen liegt auf dem Spektrum zwischen lokal und global.',
            detectors: ['Tier?', 'Lebewesen?', 'Kategorie?', 'Haustier?'],
            detectorStates: [true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false],
        }
    },

    render: function() {
        const plotDiv = document.getElementById('ffn-3d-plot');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;

        const fact = this.facts[this.currentFact];
        const traces = [];

        // Start point
        traces.push({
            x: [fact.startPos[0]], y: [fact.startPos[1]], z: [fact.startPos[2]],
            mode: 'markers+text',
            type: 'scatter3d',
            text: ['Punkt A (vorher)'],
            textposition: 'bottom center',
            textfont: { size: 11, color: '#64748b' },
            marker: { size: 10, color: '#94a3b8', line: { width: 1, color: '#fff' } },
            name: 'Start'
        });

        // End point
        traces.push({
            x: [fact.endPos[0]], y: [fact.endPos[1]], z: [fact.endPos[2]],
            mode: 'markers+text',
            type: 'scatter3d',
            text: ['Punkt B (nachher)'],
            textposition: 'top center',
            textfont: { size: 11, color: '#d97706', weight: 'bold' },
            marker: { size: 12, color: '#d97706', symbol: 'diamond', line: { width: 2, color: '#fff' } },
            name: 'Ende'
        });

        // Arrow (displacement vector)
        traces.push({
            x: [fact.startPos[0], fact.endPos[0]],
            y: [fact.startPos[1], fact.endPos[1]],
            z: [fact.startPos[2], fact.endPos[2]],
            mode: 'lines',
            type: 'scatter3d',
            line: { color: '#ef4444', width: 6 },
            hoverinfo: 'none',
            showlegend: false
        });

        // Neuron activation bar (visual representation)
        const neuronY = -1.5;
        for (let i = 0; i < fact.totalNeurons; i++) {
            const active = fact.detectorStates[i];
            traces.push({
                x: [-2 + i * 0.25], y: [neuronY], z: [-1.5],
                mode: 'markers',
                type: 'scatter3d',
                marker: {
                    size: active ? 8 : 4,
                    color: active ? '#f59e0b' : '#e2e8f0',
                    opacity: active ? 1 : 0.4
                },
                hovertemplate: active ? `Neuron ${i + 1}: AKTIV 🔥<extra></extra>` : `Neuron ${i + 1}: still<extra></extra>`,
                showlegend: false
            });
        }

        // Label for neuron bar
        traces.push({
            x: [-2], y: [neuronY], z: [-1.9],
            mode: 'text',
            type: 'scatter3d',
            text: [`${fact.activeNeurons}/${fact.totalNeurons} aktiv`],
            textfont: { size: 10, color: '#92400e' },
            hoverinfo: 'none',
            showlegend: false
        });

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'Dim 1', range: [-3, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                yaxis: { title: 'Dim 2', range: [-2, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                zaxis: { title: 'Dim 3', range: [-2.5, 2], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                camera: { eye: { x: 1.5, y: 1.3, z: 1.0 } },
                aspectratio: { x: 1, y: 1, z: 0.7 },
                dragmode: 'turntable'
            },
            showlegend: false,
            hovermode: 'closest'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true, scrollZoom: true });

        // Update info
        const info = document.getElementById('ffn-3d-info');
        if (info) info.innerHTML = fact.description;
    },

    setFact: function(factKey) {
        this.currentFact = factKey;
        this.render();
    },

    animateShift: function() {
        if (this.animating) return;
        this.animating = true;
        const fact = this.facts[this.currentFact];
        const plotDiv = this.plotDiv;
        if (!plotDiv) { this.animating = false; return; }

        // Animate the point moving from start to end
        const steps = 30;
        let step = 0;
        const interval = setInterval(() => {
            step++;
            const t = step / steps;
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
            const currentPos = fact.startPos.map((s, i) => s + (fact.endPos[i] - s) * eased);

            // Update just the start point position
            Plotly.restyle(plotDiv, {
                x: [[currentPos[0]]],
                y: [[currentPos[1]]],
                z: [[currentPos[2]]]
            }, [0]);

            if (step >= steps) {
                clearInterval(interval);
                this.animating = false;
            }
        }, 40);
    }
};

// ============================================================
// GRID WARP VISUALIZATION
// ============================================================

const GridWarpViz = {
    plotDiv: null,
    currentLayer: 0,
    animating: false,

    // Generate a grid and warp it based on layer depth
    generateGrid: function(layer) {
        const n = 12; // grid resolution
        const xLines = [];
        const yLines = [];

        for (let i = 0; i <= n; i++) {
            const t = (i / n) * 4 - 2; // range [-2, 2]
            const lineX = [], lineY = [], lineZ = [];
            const lineX2 = [], lineY2 = [], lineZ2 = [];

            for (let j = 0; j <= n; j++) {
                const s = (j / n) * 4 - 2;

                // Apply layer-dependent warping
                let x = s, y = t, z = 0;
                let x2 = t, y2 = s, z2 = 0;

                // Warp increases with layer
                const warpStrength = layer * 0.18;

                // ReLU-like folds
                if (layer > 0) {
                    const fold1 = Math.max(0, x + y - 0.5) * warpStrength;
                    const fold2 = Math.max(0, -x + y + 0.3) * warpStrength * 0.7;
                    const fold3 = Math.max(0, x * 0.5 - y + 1.0) * warpStrength * 0.5;
                    z = fold1 - fold2 + fold3;
                    x += Math.sin(y * warpStrength * 0.8) * warpStrength * 0.3;
                    y += Math.cos(x * warpStrength * 0.6) * warpStrength * 0.2;

                    const fold1b = Math.max(0, x2 + y2 - 0.5) * warpStrength;
                    const fold2b = Math.max(0, -x2 + y2 + 0.3) * warpStrength * 0.7;
                    const fold3b = Math.max(0, x2 * 0.5 - y2 + 1.0) * warpStrength * 0.5;
                    z2 = fold1b - fold2b + fold3b;
                    x2 += Math.sin(y2 * warpStrength * 0.8) * warpStrength * 0.3;
                    y2 += Math.cos(x2 * warpStrength * 0.6) * warpStrength * 0.2;
                }

                lineX.push(x); lineY.push(y); lineZ.push(z);
                lineX2.push(x2); lineY2.push(y2); lineZ2.push(z2);
            }
            xLines.push({ x: lineX, y: lineY, z: lineZ });
            yLines.push({ x: lineX2, y: lineY2, z: lineZ2 });
        }

        return { xLines, yLines };
    },

    render: function() {
        const plotDiv = document.getElementById('grid-warp-plot');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;

        const layer = this.currentLayer;
        const grid = this.generateGrid(layer);
        const traces = [];

        // X-direction lines
        const xColor = layer === 0 ? '#94a3b8' : `hsl(${220 + layer * 20}, 70%, ${55 - layer * 5}%)`;
        grid.xLines.forEach(line => {
            traces.push({
                x: line.x, y: line.y, z: line.z,
                mode: 'lines',
                type: 'scatter3d',
                line: { color: xColor, width: 2 },
                hoverinfo: 'none',
                showlegend: false
            });
        });

        // Y-direction lines
        const yColor = layer === 0 ? '#cbd5e1' : `hsl(${280 + layer * 15}, 60%, ${55 - layer * 5}%)`;
        grid.yLines.forEach(line => {
            traces.push({
                x: line.x, y: line.y, z: line.z,
                mode: 'lines',
                type: 'scatter3d',
                line: { color: yColor, width: 2 },
                hoverinfo: 'none',
                showlegend: false
            });
        });

        // Add some sample points that move with the grid
        const samplePoints = [
            { label: '"Katze"', baseX: -1, baseY: 0.5 },
            { label: '"König"', baseX: 1, baseY: -0.5 },
            { label: '"schnell"', baseX: 0, baseY: 1.5 },
        ];
        const pointColors = ['#10b981', '#3b82f6', '#f59e0b'];

        samplePoints.forEach((pt, i) => {
            let x = pt.baseX, y = pt.baseY, z = 0;
            const warpStrength = layer * 0.18;
            if (layer > 0) {
                const fold1 = Math.max(0, x + y - 0.5) * warpStrength;
                const fold2 = Math.max(0, -x + y + 0.3) * warpStrength * 0.7;
                const fold3 = Math.max(0, x * 0.5 - y + 1.0) * warpStrength * 0.5;
                z = fold1 - fold2 + fold3;
                x += Math.sin(y * warpStrength * 0.8) * warpStrength * 0.3;
                y += Math.cos(x * warpStrength * 0.6) * warpStrength * 0.2;
            }
            traces.push({
                x: [x], y: [y], z: [z + 0.1],
                mode: 'markers+text',
                type: 'scatter3d',
                text: [pt.label],
                textposition: 'top center',
                textfont: { size: 11, color: pointColors[i] },
                marker: { size: 8, color: pointColors[i], line: { width: 1, color: '#fff' } },
                hoverinfo: 'none',
                showlegend: false
            });
        });

        const zMax = Math.max(1, layer * 0.6);
        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: '', range: [-3, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa', showticklabels: false },
                yaxis: { title: '', range: [-3, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa', showticklabels: false },
                zaxis: { title: 'Verzerrung', range: [-zMax, zMax], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                camera: { eye: { x: 1.4, y: 1.4, z: 0.9 } },
                aspectratio: { x: 1, y: 1, z: 0.5 },
                dragmode: 'turntable'
            },
            showlegend: false
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true, scrollZoom: true });
        this._updateLabel();
    },

    _updateLabel: function() {
        const label = document.getElementById('grid-warp-label');
        const info = document.getElementById('grid-warp-info');
        const layerNames = ['Layer 0 (flach)', 'Layer 1', 'Layer 2', 'Layer 3', 'Layer 4', 'Layer 5 (stark verzerrt)'];
        if (label) label.textContent = layerNames[this.currentLayer];
        if (info) {
            const descs = [
                'Embedding-Raum: Das Gitter ist flach. Jeder Punkt hat seine Startposition. Noch keine Transformation.',
                'Erste leichte Verzerrung: ReLU-Knickpunkte erzeugen erste "Falten" im Raum. Punkte verschieben sich minimal.',
                'Stärkere Faltung: Der Raum beginnt sich zu "biegen". Bedeutungsregionen werden getrennt.',
                'Deutliche Verzerrung: Cluster bilden sich. Ähnliche Bedeutungen werden zusammengeschoben.',
                'Starke Transformation: Der Raum ist stark verzerrt. Die stückweise affinen Operationen sind sichtbar.',
                'Maximale Verzerrung: Nach vielen Layern ist der Raum kaum wiederzuerkennen. Die "Falten" kodieren komplexe Beziehungen.'
            ];
            info.innerHTML = '🌀 ' + descs[this.currentLayer] + '<br><span style="font-size:0.8em; color:#64748b;">Jeder Layer ist eine stückweise affine Transformation (Dense + ReLU). Die Knickpunkte der ReLU erzeugen die "Falten".</span>';
        }
    },

    setLayer: function(layer) {
        this.currentLayer = layer;
        document.getElementById('grid-warp-slider').value = layer;
        this.render();
    },

    animateLayers: function() {
        if (this.animating) return;
        this.animating = true;
        this.currentLayer = 0;
        this.render();
        let layer = 0;
        const interval = setInterval(() => {
            layer++;
            this.currentLayer = layer;
            document.getElementById('grid-warp-slider').value = layer;
            this.render();
            if (layer >= 5) {
                clearInterval(interval);
                this.animating = false;
            }
        }, 1000);
    }
};

// ============================================================
// BASINS 3D VISUALIZATION
// ============================================================

const Basins3DViz = {
    plotDiv: null,
    trajectories: [],
    animating: false,
    maxTrajectories: 8,

    // Different starting sentences about cats → all converge to "cat" region
    sentences: [
        { label: '"Die Katze schläft"', color: '#3b82f6' },
        { label: '"Meine Katze miaut"', color: '#10b981' },
        { label: '"Eine Katze jagt"', color: '#f59e0b' },
        { label: '"Die kleine Katze"', color: '#ef4444' },
        { label: '"Katzen sind süß"', color: '#8b5cf6' },
        { label: '"Das Kätzchen spielt"', color: '#ec4899' },
        { label: '"Unser Kater schnurrt"', color: '#06b6d4' },
        { label: '"Die Perserkatze"', color: '#84cc16' },
    ],

    // Target region (where all cat-related things converge)
    targetRegion: [0.5, 1.8, 0.8],

    _generateTrajectory: function(idx) {
        // Random start position (spread out)
        const angle = (idx / this.maxTrajectories) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const radius = 2.0 + Math.random() * 1.0;
        const startX = Math.cos(angle) * radius;
        const startY = Math.sin(angle) * radius;
        const startZ = (Math.random() - 0.5) * 2;

        // Generate path that converges to target
        const steps = 8;
        const path = [[startX, startY, startZ]];
        const target = this.targetRegion;

        for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            // Add some noise to make paths interesting
            const noise = (1 - t) * 0.3;
            const x = startX + (target[0] - startX) * eased + (Math.random() - 0.5) * noise;
            const y = startY + (target[1] - startY) * eased + (Math.random() - 0.5) * noise;
            const z = startZ + (target[2] - startZ) * eased + (Math.random() - 0.5) * noise;
            path.push([x, y, z]);
        }

        return path;
    },

    addTrajectory: function() {
        if (this.trajectories.length >= this.maxTrajectories) return;
        const idx = this.trajectories.length;
        const path = this._generateTrajectory(idx);
        this.trajectories.push({ path, sentence: this.sentences[idx], visible: true });
        this.render();
    },

    render: function() {
        const plotDiv = document.getElementById('basins-3d-plot');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;

        const traces = [];

        // Target region (transparent sphere approximation)
        const spherePts = 40;
        const cx = [], cy = [], cz = [];
        for (let i = 0; i < spherePts; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const r = 0.4;
            cx.push(this.targetRegion[0] + r * Math.sin(phi) * Math.cos(theta));
            cy.push(this.targetRegion[1] + r * Math.sin(phi) * Math.sin(theta));
            cz.push(this.targetRegion[2] + r * Math.cos(phi));
        }
        traces.push({
            x: cx, y: cy, z: cz,
            mode: 'markers',
            type: 'scatter3d',
            marker: { size: 4, color: 'rgba(16,185,129,0.15)' },
            hoverinfo: 'none',
            showlegend: false
        });

        // Target label
        traces.push({
            x: [this.targetRegion[0]], y: [this.targetRegion[1]], z: [this.targetRegion[2] + 0.6],
            mode: 'text',
            type: 'scatter3d',
            text: ['🎯 "Katze"-Region'],
            textfont: { size: 12, color: '#065f46' },
            hoverinfo: 'none',
            showlegend: false
        });

        // Trajectories
        this.trajectories.forEach((traj, idx) => {
            if (!traj.visible) return;
            const path = traj.path;
            const color = traj.sentence.color;

            // Path line
            traces.push({
                x: path.map(p => p[0]),
                y: path.map(p => p[1]),
                z: path.map(p => p[2]),
                mode: 'lines',
                type: 'scatter3d',
                line: { color: color, width: 3 },
                hoverinfo: 'none',
                showlegend: false
            });

            // Start point
            traces.push({
                x: [path[0][0]], y: [path[0][1]], z: [path[0][2]],
                mode: 'markers+text',
                type: 'scatter3d',
                text: [traj.sentence.label],
                textposition: 'top center',
                textfont: { size: 9, color: color },
                marker: { size: 7, color: color, symbol: 'circle', line: { width: 1, color: '#fff' } },
                hoverinfo: 'none',
                showlegend: false
            });

            // End point
            traces.push({
                x: [path[path.length - 1][0]], y: [path[path.length - 1][1]], z: [path[path.length - 1][2]],
                mode: 'markers',
                type: 'scatter3d',
                marker: { size: 5, color: color, symbol: 'diamond' },
                hoverinfo: 'none',
                showlegend: false
            });
        });

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'Dim 1', range: [-3.5, 3.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                yaxis: { title: 'Dim 2', range: [-3.5, 3.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                zaxis: { title: 'Dim 3', range: [-2.5, 2.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa' },
                camera: { eye: { x: 1.6, y: 1.4, z: 0.9 } },
                aspectratio: { x: 1, y: 1, z: 0.6 },
                dragmode: 'turntable'
            },
            showlegend: false
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true, scrollZoom: true });
    },

    animateAll: function() {
        if (this.animating) return;
        this.animating = true;
        this.trajectories = [];
        this.render();

        let idx = 0;
        const interval = setInterval(() => {
            this.addTrajectory();
            idx++;
            if (idx >= this.maxTrajectories) {
                clearInterval(interval);
                this.animating = false;
            }
        }, 600);
    },

    reset: function() {
        this.trajectories = [];
        this.animating = false;
        this.render();
    }
};

// ============================================================
// INTUITION (FINAL SLIDE) VISUALIZATION
// ============================================================

const IntuitionViz = {
    plotDiv: null,
    playing: false,
    animFrame: null,
    step: 0,
    maxSteps: 60,

    // A single token's journey through the network
    _generateJourney: function() {
        const steps = this.maxSteps;
        const path = [];
        // Start: embedding position
        let x = -2.0, y = -1.5, z = -1.0;

        for (let s = 0; s <= steps; s++) {
            const t = s / steps;

            // Simulate layer-by-layer transformation
            // Early: small local moves (attention)
            // Middle: larger moves (FFN knowledge injection)
            // Late: convergence to prediction region

            const phase = t < 0.3 ? 'early' : t < 0.7 ? 'middle' : 'late';

            if (phase === 'early') {
                x += 0.05 + Math.sin(s * 0.5) * 0.03;
                y += 0.04 + Math.cos(s * 0.7) * 0.02;
                z += 0.03;
            } else if (phase === 'middle') {
                x += 0.08 + Math.sin(s * 0.3) * 0.05;
                y += 0.1;
                z += 0.06 + Math.cos(s * 0.4) * 0.04;
            } else {
                // Converge toward target
                const target = [2.0, 2.5, 1.5];
                x += (target[0] - x) * 0.1;
                y += (target[1] - y) * 0.1;
                z += (target[2] - z) * 0.1;
            }

            path.push([x, y, z]);
        }
        return path;
    },

    render: function(currentStep) {
        const plotDiv = document.getElementById('intuition-3d-plot');
        if (!plotDiv) return;
        this.plotDiv = plotDiv;

        const journey = this._generateJourney();
        const step = currentStep !== undefined ? currentStep : this.maxSteps;
        const visiblePath = journey.slice(0, step + 1);

        const traces = [];

        // Path so far
        if (visiblePath.length > 1) {
            traces.push({
                x: visiblePath.map(p => p[0]),
                y: visiblePath.map(p => p[1]),
                z: visiblePath.map(p => p[2]),
                mode: 'lines',
                type: 'scatter3d',
                line: {
                    color: visiblePath.map((_, i) => i / visiblePath.length),
                    colorscale: [[0, '#3b82f6'], [0.5, '#8b5cf6'], [1, '#ef4444']],
                    width: 4
                },
                hoverinfo: 'none',
                showlegend: false
            });
        }

        // Current point
        const current = visiblePath[visiblePath.length - 1];
        traces.push({
            x: [current[0]], y: [current[1]], z: [current[2]],
            mode: 'markers',
            type: 'scatter3d',
            marker: { size: 12, color: '#ef4444', line: { width: 2, color: '#fff' } },
            hoverinfo: 'none',
            showlegend: false
        });

        // Start point
        traces.push({
            x: [journey[0][0]], y: [journey[0][1]], z: [journey[0][2]],
            mode: 'markers+text',
            type: 'scatter3d',
            text: ['Start (Embedding)'],
            textposition: 'bottom center',
            textfont: { size: 10, color: '#3b82f6' },
            marker: { size: 8, color: '#3b82f6', symbol: 'circle' },
            hoverinfo: 'none',
            showlegend: false
        });

        // Target region
        if (step > this.maxSteps * 0.7) {
            traces.push({
                x: [2.0], y: [2.5], z: [1.5],
                mode: 'markers+text',
                type: 'scatter3d',
                text: ['🎯 Vorhersage-Region'],
                textposition: 'top center',
                textfont: { size: 11, color: '#10b981' },
                marker: { size: 10, color: '#10b981', symbol: 'diamond', opacity: 0.7 },
                hoverinfo: 'none',
                showlegend: false
            });
        }

        // Phase labels
        const phaseMarkers = [
            { step: Math.floor(this.maxSteps * 0.15), label: 'Attention (lokal)', color: '#3b82f6' },
            { step: Math.floor(this.maxSteps * 0.5), label: 'FFN (Wissen)', color: '#8b5cf6' },
            { step: Math.floor(this.maxSteps * 0.85), label: 'Konvergenz', color: '#ef4444' },
        ];
        phaseMarkers.forEach(pm => {
            if (step >= pm.step) {
                const pos = journey[pm.step];
                traces.push({
                    x: [pos[0]], y: [pos[1]], z: [pos[2] + 0.3],
                    mode: 'text',
                    type: 'scatter3d',
                    text: [pm.label],
                    textfont: { size: 9, color: pm.color },
                    hoverinfo: 'none',
                    showlegend: false
                });
            }
        });

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: '', range: [-3, 3.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa', showticklabels: false },
                yaxis: { title: '', range: [-2.5, 3.5], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa', showticklabels: false },
                zaxis: { title: '', range: [-2, 3], gridcolor: '#f1f5f9', backgroundcolor: '#fafafa', showticklabels: false },
                camera: { eye: { x: 1.5, y: 1.2, z: 0.8 } },
                aspectratio: { x: 1, y: 1, z: 0.6 },
                dragmode: 'turntable'
            },
            showlegend: false
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true, scrollZoom: true });

        // Update info
        const info = document.getElementById('intuition-info');
        if (info) {
            const t = step / this.maxSteps;
            if (t < 0.1) {
                info.innerHTML = '📍 <b>Embedding:</b> Das Token wird zu einem Punkt im 4096-dimensionalen Raum.';
            } else if (t < 0.35) {
                info.innerHTML = '🧲 <b>Attention (frühe Layer):</b> Lokale Verschiebung – der Punkt wird zu relevanten Nachbarn gezogen.';
            } else if (t < 0.7) {
                info.innerHTML = '🔬 <b>FFN (mittlere Layer):</b> Wissens-Detektoren feuern, der Punkt wird stärker verschoben. Der Raum verzerrt sich.';
            } else if (t < 0.95) {
                info.innerHTML = '🎯 <b>Konvergenz (späte Layer):</b> Der Punkt nähert sich der Vorhersage-Region. Bassin-Effekt.';
            } else {
                info.innerHTML = '✅ <b>Fertig!</b> Der finale Punkt wird per Unembedding mit allen Token-Embeddings verglichen → nächstes Wort.';
            }
        }
    },

    play: function() {
        if (this.playing) {
            this.playing = false;
            const btn = document.getElementById('intuition-play-btn');
            if (btn) { btn.textContent = '▶ Abspielen'; btn.style.background = '#3b82f6'; }
            return;
        }

        this.playing = true;
        this.step = 0;
        const btn = document.getElementById('intuition-play-btn');
        if (btn) { btn.textContent = '⏸ Pause'; btn.style.background = '#ef4444'; }

        const animate = () => {
            if (!this.playing) return;
            this.step++;
            this.render(this.step);
            if (this.step >= this.maxSteps) {
                this.playing = false;
                if (btn) { btn.textContent = '▶ Abspielen'; btn.style.background = '#3b82f6'; }
                return;
            }
            this.animFrame = requestAnimationFrame(() => setTimeout(animate, 80));
        };
        animate();
    },

    reset: function() {
        this.playing = false;
        this.step = 0;
        const btn = document.getElementById('intuition-play-btn');
        if (btn) { btn.textContent = '▶ Abspielen'; btn.style.background = '#3b82f6'; }
        this.render(0);
    }
};

// ============================================================
// LAZY LOADING REGISTRATION FOR NEW SLIDES
// ============================================================

// Add to the existing lazy loading system for the new forward-pass slides

function initForwardPassSlides() {
    // Forward Pass Overview
    _lazyRegister('forward-pass-3d', () => {
        ForwardPassViz.render();
    });

    // Embedding 3D
    _lazyRegister('embedding-3d-plot', () => {
        Embedding3DViz.render();
    });

    // Attention 3D
    _lazyRegister('attention-3d-plot', () => {
        Attention3DViz.render();
    });

    // FFN 3D
    _lazyRegister('ffn-3d-plot', () => {
        FFN3DViz.render();
    });

    // Grid Warp
    _lazyRegister('grid-warp-plot', () => {
        GridWarpViz.render();
    });

    // Basins 3D
    _lazyRegister('basins-3d-plot', () => {
        Basins3DViz.render();
    });

    // Intuition (final slide)
    _lazyRegister('intuition-3d-plot', () => {
        IntuitionViz.render(0);
    });

    // Start observing
    _lazyCreateObserver();
}

// Hook into the existing DOMContentLoaded or call after loadIntuitionModule
// We check if loadIntuitionModule already ran; if so, just init directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initForwardPassSlides();
    });
} else {
    // DOM already loaded
    initForwardPassSlides();
}
