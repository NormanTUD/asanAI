/**
 * Part A: Logic to calculate and render the injection tables
 */
function calculate_positional_injection(tokens, d_model) {
    const resultsContainer = document.getElementById('transformer-pe-integration-results');
    if (!resultsContainer) return;

    let html = `<h3>Vector Injection (Inference Sequence)</h3>`;
    
    tokens.forEach((token, pos) => {
        const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
        const semanticVec = Array.from({length: d_model}, (_, i) => 
            parseFloat(((Math.abs(hash * (i + 1)) % 1000) / 500 - 1).toFixed(3))
        );

        const peVec = [];
        for (let i = 0; i < d_model; i += 2) {
            let div_term = Math.pow(10000, (2 * i) / d_model);
            peVec[i] = Math.sin(pos / div_term);
            if (i + 1 < d_model) peVec[i + 1] = Math.cos(pos / div_term);
        }

        const combined = semanticVec.map((val, i) => (val + peVec[i]).toFixed(3));
        
        html += `
            <div style="margin-bottom: 10px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: #fff;">
                <strong>Pos ${pos}: ${token}</strong>
                <table style="width:100%; font-family: monospace; font-size: 11px; margin-top: 5px;">
                    <tr><td>PE (Sin/Cos)</td>${peVec.map(v => `<td>${v.toFixed(3)}</td>`).join('')}</tr>
                    <tr style="font-weight:bold;"><td>Combined</td>${combined.map(v => `<td>${v}</td>`).join('')}</tr>
                </table>
            </div>`;
    });
    resultsContainer.innerHTML = html;
}

/**
 * Part B: Logic to render the Wave Plot (Sinusoidal Patterns)
 */
function render_positional_waves(d_model, tokens) {
    const traces = [];
    const resolution = 0.1;
    const maxPos = Math.max(10, tokens.length);

    for (let i = 0; i < d_model; i++) {
        let x = [], y = [];
        for (let p = 0; p <= maxPos; p += resolution) {
            let div_term = Math.pow(10000, (2 * (Math.floor(i/2))) / d_model);
            let val = (i % 2 === 0) ? Math.sin(p / div_term) : Math.cos(p / div_term);
            x.push(p);
            y.push(val);
        }
        traces.push({
            x: x, y: y, mode: 'lines', 
            name: `Dim ${i} ${i%2===0?'Sin':'Cos'}`,
            line: { shape: 'spline', width: 2 }
        });
    }

    // Add markers for actual token positions
    tokens.forEach((token, pos) => {
        traces.push({
            x: [pos], y: [0], mode: 'markers+text',
            text: [token], textposition: 'top center',
            marker: { size: 12, color: '#3b82f6' },
            name: `Pos ${pos}: ${token}`, showlegend: false
        });
    });

    const layout = {
        title: 'Sinusoidal Positional Waves',
        margin: { t: 40, b: 40, l: 40, r: 20 },
        xaxis: { title: 'Token Position (pos)' },
        yaxis: { title: 'PE Value', range: [-1.1, 1.1] }
    };

    Plotly.newPlot('transformer-pe-wave-plot', traces, layout);
}

/**
 * Controller: Updated transformer_tokenize
 */
function transformer_tokenize() {
    const masterInput = document.getElementById('transformer-master-token-input');
    const trainingInput = document.getElementById('transformer-training-data');
    const dimSlider = document.getElementById('transformer-dimension-model');
    
    if (!masterInput || !trainingInput || !dimSlider) return;

    const text = masterInput.value; // The Prediction/Inference text
    const trainingText = trainingInput.value;
    const d_model = parseInt(dimSlider.value);

    // 1. Process Tokens
    const trainingTokens = transformer_tokenize_render(trainingText, "transformer-viz-bpe", true);
    const vocabulary = new Set(trainingTokens);
    const inputTokens = transformer_tokenize_render(text, "transformer-viz-bpe-inference", false);
    const knownTokens = inputTokens.filter(token => vocabulary.has(token));

    // 2. Call Modular Components
    calculate_positional_injection(knownTokens, d_model);
    render_positional_waves(d_model, knownTokens);
    render_embedding_plot(knownTokens, d_model);
}

function render_embedding_plot(tokens, dimensions) {
    const plotData = [];

    tokens.forEach((token) => {
        // Deterministic hash for "random" but stable coordinates
        const hash = token.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);

        const getCoord = (seed) => (((Math.abs(hash) * seed) % 200) - 100) / 100;

        const x = [getCoord(1)];
        const y = dimensions >= 2 ? [getCoord(2)] : [0];
        const z = dimensions >= 3 ? [getCoord(3)] : [0];

        plotData.push({
            x: x, y: y, z: z,
            mode: 'markers+text',
            type: dimensions === 3 ? 'scatter3d' : 'scatter',
            name: token,
            text: [token],
            textposition: 'top center',
            marker: {
                size: 8,
                color: `hsl(${Math.abs(hash) % 360}, 70%, 50%)`,
                opacity: 0.8
            }
        });
    });

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        scene: { // For 3D
            xaxis: { range: [-1, 1], title: 'Dim 1' },
            yaxis: { range: [-1, 1], title: 'Dim 2' },
            zaxis: { range: [-1, 1], title: 'Dim 3' }
        },
        xaxis: { range: [-1.2, 1.2], title: 'Dim 1' }, // For 1D/2D
        yaxis: { range: [-1.2, 1.2], title: 'Dim 2' }
    };

    Plotly.newPlot('transformer-plotly-space', plotData, layout, { responsive: true });
}

/**
 * Renders the vectors in the Feature Space
 * Origin: Vector Space Models in NLP
 */
function render_embedding_space(tokens, dimensions) {
    const container = document.getElementById('transformer-viz-embeddings');
    if (!container) return;

    container.innerHTML = tokens.map(t => {
        // Create a deterministic seed based on the token string
        const hash = t.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
        
        // Generate pseudo-random coordinates based on the hash
        const coords = [];
        for (let i = 0; i < dimensions; i++) {
            // Generates a value between -1.00 and 1.00
            const val = (((Math.abs(hash) * (i + 1)) % 200) - 100) / 100;
            coords.push(val.toFixed(2));
        }

        const hue = Math.abs(hash) % 360;

        return `
            <div style="border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; background: white; min-width: 120px; box-shadow: 2px 2px 5px rgba(0,0,0,0.05);">
                <div style="font-weight: bold; color: hsl(${hue}, 70%, 30%); margin-bottom: 5px; border-bottom: 1px solid #eee;">
                    "${t}"
                </div>
                <div style="font-family: 'Courier New', monospace; font-size: 0.8rem; color: #475569;">
                    [${coords.join(', ')}]
                </div>
                <div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px;">
                    $\in \mathbb{R}^{${dimensions}}$
                </div>
            </div>
        `;
    }).join('');
}

// Modify existing transformer_tokenize_render to return the tokens array
function transformer_tokenize_render(text) {
    const container = document.getElementById(`transformer-viz-bpe`);
    if (!container) return [];

    let tokens = [];
    const subUnits = ["tion", "ing", "haus", "er", "ly", "is", "ment", "ness", "ation"];
    const words = text.split(/\s+/);
    
    words.forEach(word => {
        let found = false;
        for (let unit of subUnits) {
            if (word.toLowerCase().endsWith(unit) && word.length > unit.length) {
                tokens.push(word.substring(0, word.length - unit.length));
                tokens.push("##" + unit);
                found = true;
                break;
            }
        }
        if (!found && word.length > 0) tokens.push(word);
    });

    container.innerHTML = tokens.map(t => {
        const hash = t.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
        const hue = Math.abs(hash) % 360;
        return `
            <div style="background: hsl(${hue}, 65%, 40%); color: white; padding: 5px 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center;">
                ${t}
                <span style="font-size: 0.6rem; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); width: 100%; text-align: center;">ID: ${Math.abs(hash) % 1000}</span>
            </div>
        `;
    }).join('');

    return tokens; // Return for the embedding function
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");
	//TransformerLab.init();
	transformer_tokenize()
	return Promise.resolve();
}
