/**
 * Circuits Inside LLMs - Interactive Visualization
 *
 * Demonstrates:
 * 1. Residual stream communication
 * 2. Induction head circuits
 * 3. Attention pattern visualization
 * 4. Activation patching
 * 5. Superposition geometry
 * 6. QKV decomposition
 */

(function() {
    "use strict";

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    function createElement(tag, attrs, parent) {
        const el = document.createElement(tag);
        if (attrs) {
            for (const [k, v] of Object.entries(attrs)) {
                if (k === 'style' && typeof v === 'object') {
                    Object.assign(el.style, v);
                } else if (k === 'className') {
                    el.className = v;
                } else if (k === 'innerHTML') {
                    el.innerHTML = v;
                } else if (k === 'textContent') {
                    el.textContent = v;
                } else {
                    el.setAttribute(k, v);
                }
            }
        }
        if (parent) parent.appendChild(el);
        return el;
    }

    function createSlider(parent, label, min, max, value, step, callback) {
        const container = createElement('div', {className: 'slider-container', style: {margin: '8px 0'}}, parent);
        const lbl = createElement('label', {
            innerHTML: `<strong>${label}:</strong> <span class="slider-val">${value}</span>`,
            style: {display: 'block', marginBottom: '4px', fontSize: '14px'}
        }, container);
        const input = createElement('input', {
            type: 'range', min, max, value, step,
            style: {width: '100%'}
        }, container);
        input.addEventListener('input', () => {
            lbl.querySelector('.slider-val').textContent = parseFloat(input.value).toFixed(step < 1 ? 2 : 0);
            callback(parseFloat(input.value));
        });
        return input;
    }

    function createCanvas(parent, width, height) {
        const canvas = createElement('canvas', {width, height, style: {border: '1px solid #ccc', borderRadius: '4px', display: 'block', margin: '8px auto'}}, parent);
        return canvas;
    }

    function softmax(arr) {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sum);
    }

    function matMul(A, B, rowsA, colsA, colsB) {
        const C = new Array(rowsA * colsB).fill(0);
        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                for (let k = 0; k < colsA; k++) {
                    C[i * colsB + j] += A[i * colsA + k] * B[k * colsB + j];
                }
            }
        }
        return C;
    }

    function randomMatrix(rows, cols, scale) {
        scale = scale || 0.5;
        const M = [];
        for (let i = 0; i < rows * cols; i++) {
            M.push((Math.random() - 0.5) * 2 * scale);
        }
        return M;
    }

    function dotProduct(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
        return sum;
    }

    function vecAdd(a, b) {
        return a.map((v, i) => v + b[i]);
    }

    function vecScale(a, s) {
        return a.map(v => v * s);
    }

    function norm(a) {
        return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    }

    function normalize(a) {
        const n = norm(a);
        return n > 0 ? a.map(v => v / n) : a;
    }

    function colorInterp(val, minVal, maxVal) {
        const t = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal + 1e-8)));
        // Blue (0) -> White (0.5) -> Red (1)
        if (t < 0.5) {
            const s = t * 2;
            return `rgb(${Math.round(s * 255)}, ${Math.round(s * 255)}, 255)`;
        } else {
            const s = (t - 0.5) * 2;
            return `rgb(255, ${Math.round((1 - s) * 255)}, ${Math.round((1 - s) * 255)})`;
        }
    }

    function heatColor(val) {
        // 0 = white, 1 = deep blue
        const r = Math.round(255 * (1 - val));
        const g = Math.round(255 * (1 - val * 0.7));
        const b = 255;
        return `rgb(${r}, ${g}, ${b})`;
    }

    // ============================================================
    // SECTION 1: RESIDUAL STREAM VISUALIZATION
    // ============================================================

    function initResidualStream() {
        const container = document.getElementById('circuits-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: '#f9f9ff', borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '🔬 Interactive: Residual Stream & Component Contributions', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'This visualization shows how the residual stream accumulates contributions from each layer. <strong>Toggle components on/off</strong> to see how the final prediction changes. Each colored bar represents a component\'s additive contribution to the residual stream.'}, section);

        const controls = createElement('div', {style: {display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px'}}, section);

        const numLayers = 4;
        const numHeads = 2;
        const dModel = 8;
        const seqLen = 5;
        const tokens = ['The', 'cat', 'sat', 'on', 'the'];

        // Generate random contributions for each component
        const components = [];
        const componentStates = [];
        for (let l = 0; l < numLayers; l++) {
            for (let h = 0; h < numHeads; h++) {
                const contrib = [];
                for (let s = 0; s < seqLen; s++) {
                    contrib.push(randomMatrix(1, dModel, 0.3 + Math.random() * 0.4));
                }
                components.push({type: 'attn', layer: l, head: h, contrib, label: `L${l}H${h}`});
                componentStates.push(true);
            }
            const mlpContrib = [];
            for (let s = 0; s < seqLen; s++) {
                mlpContrib.push(randomMatrix(1, dModel, 0.2 + Math.random() * 0.3));
            }
            components.push({type: 'mlp', layer: l, contrib: mlpContrib, label: `L${l}MLP`});
            componentStates.push(true);
        }

        // Embedding
        const embedding = [];
        for (let s = 0; s < seqLen; s++) {
            embedding.push(randomMatrix(1, dModel, 1.0));
        }

        // Create toggle buttons
        components.forEach((comp, idx) => {
            const btn = createElement('button', {
                textContent: comp.label,
                style: {
                    padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
                    border: '2px solid ' + (comp.type === 'attn' ? '#4a90d9' : '#d94a4a'),
                    background: comp.type === 'attn' ? '#e8f0fe' : '#fee8e8',
                    fontSize: '12px', fontWeight: 'bold'
                }
            }, controls);
            btn.addEventListener('click', () => {
                componentStates[idx] = !componentStates[idx];
                btn.style.opacity = componentStates[idx] ? '1' : '0.3';
                btn.style.textDecoration = componentStates[idx] ? 'none' : 'line-through';
                drawResidualStream();
            });
        });

        const canvas = createCanvas(section, 700, 320);
        const ctx = canvas.getContext('2d');

        // Unembedding: simple dot product with a "next token" direction
        const unembed = randomMatrix(1, dModel, 1.0);

        function computeResidualStream() {
            const streams = []; // streams[position] = final residual
            for (let s = 0; s < seqLen; s++) {
                let residual = [...embedding[s]];
                const contributions = [{label: 'Embed', val: [...residual]}];
                components.forEach((comp, idx) => {
                    if (componentStates[idx]) {
                        residual = vecAdd(residual, comp.contrib[s]);
                        contributions.push({label: comp.label, val: [...comp.contrib[s]]});
                    }
                });
                streams.push({residual, contributions});
            }
            return streams;
        }

        function drawResidualStream() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const streams = computeResidualStream();

            const posWidth = canvas.width / seqLen;
            const barHeight = 20;

            // Draw each position
            for (let s = 0; s < seqLen; s++) {
                const x = s * posWidth + 10;
                const stream = streams[s];

                // Token label
                ctx.fillStyle = '#333';
                ctx.font = 'bold 13px monospace';
                ctx.fillText(tokens[s], x + posWidth / 2 - 15, 20);

                // Draw contribution bars stacked
                let yOffset = 35;
                stream.contributions.forEach((c, ci) => {
                    const magnitude = norm(c.val);
                    const barWidth = Math.min(magnitude * 40, posWidth - 25);
                    const avgSign = c.val.reduce((a, b) => a + b, 0);
                    ctx.fillStyle = avgSign > 0 ? `rgba(74, 144, 217, ${Math.min(magnitude, 1)})` : `rgba(217, 74, 74, ${Math.min(magnitude, 1)})`;
                    ctx.fillRect(x, yOffset, barWidth, barHeight - 2);
                    ctx.fillStyle = '#333';
                    ctx.font = '9px monospace';
                    if (barWidth > 30) {
                        ctx.fillText(c.label, x + 2, yOffset + 12);
                    }
                    yOffset += barHeight;
                });

                // Final residual magnitude and "logit"
                const logit = dotProduct(stream.residual, unembed);
                ctx.fillStyle = '#333';
                ctx.font = '11px monospace';
                ctx.fillText(`logit: ${logit.toFixed(2)}`, x, yOffset + 15);

                // Draw residual stream arrow
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + posWidth / 2 - 5, 25);
                ctx.lineTo(x + posWidth / 2 - 5, yOffset + 5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + posWidth / 2 - 10, yOffset);
                ctx.lineTo(x + posWidth / 2 - 5, yOffset + 5);
                ctx.lineTo(x + posWidth / 2, yOffset);
                ctx.stroke();
            }

            // Legend
            ctx.fillStyle = '#333';
            ctx.font = '11px sans-serif';
            ctx.fillText('Blue = positive contribution, Red = negative. Toggle components above to ablate them.', 10, canvas.height - 10);
        }

        drawResidualStream();
    }

    // ============================================================
    // SECTION 2: QKV EXPLORER
    // ============================================================

    function initQKVExplorer() {
        const container = document.getElementById('qkv-explorer-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: '#f9fff9', borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '🔍 Interactive: QKV Mechanism & Attention Patterns', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'Adjust the <strong>Query</strong> and <strong>Key</strong> vectors to see how attention patterns form. The attention heatmap shows which tokens attend to which. The <strong>Value</strong> vectors determine what information gets moved.'}, section);

        const dHead = 4;
        const seqLen = 6;
        const tokens = ['When', 'Mary', 'and', 'John', 'went', 'to'];

        // Initialize QKV matrices
        let W_Q = randomMatrix(dHead, dHead, 0.8);
        let W_K = randomMatrix(dHead, dHead, 0.8);
        let W_V = randomMatrix(dHead, dHead, 0.8);

        // Token embeddings (random but fixed)
        const embeddings = [];
        for (let i = 0; i < seqLen; i++) {
            embeddings.push(randomMatrix(1, dHead, 1.0));
        }

        const controlRow = createElement('div', {style: {display: 'flex', gap: '20px', flexWrap: 'wrap'}}, section);
        const sliderPanel = createElement('div', {style: {flex: '1', minWidth: '250px'}}, controlRow);
        const canvasPanel = createElement('div', {style: {flex: '2', minWidth: '350px'}}, controlRow);

        createElement('h4', {textContent: 'Temperature & Head Parameters', style: {margin: '0 0 10px 0'}}, sliderPanel);

        let temperature = 1.0;
        let qkScale = 1.0;
        let ovScale = 1.0;

        createSlider(sliderPanel, 'Temperature (1/√d_k scale)', 0.1, 5.0, 1.0, 0.1, (v) => { temperature = v; draw(); });
        createSlider(sliderPanel, 'QK Circuit Strength', 0.1, 3.0, 1.0, 0.1, (v) => { qkScale = v; W_Q = randomMatrix(dHead, dHead, 0.8 * v); draw(); });
        createSlider(sliderPanel, 'OV Circuit Strength', 0.1, 3.0, 1.0, 0.1, (v) => { ovScale = v; W_V = randomMatrix(dHead, dHead, 0.8 * v); draw(); });

        // Positional bias slider
        let posBias = 0;
        createSlider(sliderPanel, 'Positional Bias (causal)', -2.0, 2.0, 0, 0.1, (v) => { posBias = v; draw(); });

        // Pattern type selector
        const patternDiv = createElement('div', {style: {margin: '10px 0'}}, sliderPanel);
        createElement('strong', {textContent: 'Head Type: '}, patternDiv);
        const select = createElement('select', {style: {padding: '4px'}}, patternDiv);
        ['Random', 'Previous Token', 'Induction', 'Uniform'].forEach(opt => {
            createElement('option', {textContent: opt, value: opt}, select);
        });
        select.addEventListener('change', () => {
            setHeadType(select.value);
            draw();
        });

        function setHeadType(type) {
            if (type === 'Previous Token') {
                // Make QK circuit favor position i-1
                W_Q = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                W_K = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                // Override embeddings to encode position
                for (let i = 0; i < seqLen; i++) {
                    embeddings[i] = [Math.cos(i * 0.5), Math.sin(i * 0.5), Math.cos(i * 1.0), Math.sin(i * 1.0)];
                }
                posBias = -1.5;
            } else if (type === 'Induction') {
                // Simulate induction: strong diagonal + offset pattern
                W_Q = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0.1, 0, 0, 0, 0, 0.1];
                W_K = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0.1, 0, 0, 0, 0, 0.1];
                for (let i = 0; i < seqLen; i++) {
                    embeddings[i] = [Math.cos(i * 1.2), Math.sin(i * 1.2), (i % 2) * 0.5, ((i + 1) % 3) * 0.3];
                }
                posBias = 0;
            } else if (type === 'Uniform') {
                W_Q = new Array(dHead * dHead).fill(0);
                W_K = new Array(dHead * dHead).fill(0);
                posBias = 0;
            } else {
                W_Q = randomMatrix(dHead, dHead, 0.8);
                W_K = randomMatrix(dHead, dHead, 0.8);
                for (let i = 0; i < seqLen; i++) {
                    embeddings[i] = randomMatrix(1, dHead, 1.0);
                }
                posBias = 0;
            }
        }

        const canvas = createCanvas(canvasPanel, 500, 350);
        const ctx = canvas.getContext('2d');

        function computeAttention() {
            // Q = embeddings * W_Q, K = embeddings * W_K
            const queries = [];
            const keys = [];
            for (let i = 0; i < seqLen; i++) {
                queries.push(matMul(embeddings[i], W_Q, 1, dHead, dHead));
                keys.push(matMul(embeddings[i], W_K, 1, dHead, dHead));
            }

            // Attention scores: A[i][j] = Q[i] . K[j] / temperature
            const attnScores = [];
            for (let i = 0; i < seqLen; i++) {
                const row = [];
                for (let j = 0; j < seqLen; j++) {
                    let score = dotProduct(queries[i], keys[j]) / temperature;
                    // Causal mask
                    if (j > i) score = -1e9;
                    // Positional bias (favor nearby/previous)
                    else score += posBias * (i - j);
                    row.push(score);
                }
                attnScores.push(row);
            }

            // Softmax each row
            const attnWeights = attnScores.map(row => softmax(row));
            return attnWeights;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const attn = computeAttention();

            const cellSize = 40;
            const offsetX = 100;
            const offsetY = 60;

            // Title
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('Attention Pattern (row=query, col=key)', offsetX, 20);

            // Column headers (keys)
            ctx.font = '11px monospace';
            for (let j = 0; j < seqLen; j++) {
                ctx.save();
                ctx.translate(offsetX + j * cellSize + cellSize / 2, offsetY - 5);
                ctx.rotate(-0.5);
                ctx.fillStyle = '#555';
                ctx.fillText(tokens[j], 0, 0);
                ctx.restore();
            }

            // Row headers (queries) and heatmap
            for (let i = 0; i < seqLen; i++) {
                ctx.fillStyle = '#555';
                ctx.font = '11px monospace';
                ctx.fillText(tokens[i], 10, offsetY + i * cellSize + cellSize / 2 + 4);

                for (let j = 0; j < seqLen; j++) {
                    const val = attn[i][j];
                    ctx.fillStyle = heatColor(val);
                    ctx.fillRect(offsetX + j * cellSize, offsetY + i * cellSize, cellSize - 1, cellSize - 1);

                    // Show value
                    ctx.fillStyle = val > 0.5 ? '#fff' : '#333';
                    ctx.font = '10px monospace';
                    ctx.fillText(val.toFixed(2), offsetX + j * cellSize + 4, offsetY + i * cellSize + cellSize / 2 + 3);
                }
            }

            // Draw arrow showing information flow for strongest attention
            ctx.strokeStyle = 'rgba(200, 50, 50, 0.6)';
            ctx.lineWidth = 2;
            const lastRow = attn[seqLen - 1];
            const maxIdx = lastRow.indexOf(Math.max(...lastRow));
            const fromX = offsetX + maxIdx * cellSize + cellSize / 2;
            const fromY = offsetY + seqLen * cellSize + 20;
            ctx.beginPath();
            ctx.moveTo(fromX, offsetY + (seqLen - 1) * cellSize + cellSize);
            ctx.lineTo(fromX, fromY);
            ctx.stroke();
            ctx.fillStyle = '#c33';
            ctx.font = '11px sans-serif';
            ctx.fillText(`Last token attends most to "${tokens[maxIdx]}" (${lastRow[maxIdx].toFixed(2)})`, 10, fromY + 15);

            // OV circuit visualization
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('OV Circuit: What gets copied', 10, canvas.height - 50);
            ctx.font = '11px sans-serif';
            ctx.fillText(`If attending to "${tokens[maxIdx]}", the OV circuit moves its representation to the output.`, 10, canvas.height - 30);
            const ovMag = norm(matMul(embeddings[maxIdx], W_V, 1, dHead, dHead));
            ctx.fillText(`|OV output| = ${(ovMag * ovScale).toFixed(3)}`, 10, canvas.height - 12);
        }

        draw();
    }

    // ============================================================
    // SECTION 3: SUPERPOSITION VISUALIZATION
    // ============================================================

    function initSuperposition() {
        const container = document.getElementById('superposition-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: '#fff9f0', borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '🌀 Interactive: Superposition & Feature Geometry', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'In <strong>superposition</strong>, a model packs more features than dimensions by using nearly-orthogonal directions. Adjust the number of features and model dimensions to see how features interfere with each other. When features outnumber dimensions, they can\'t all be perfectly orthogonal — this creates <em>interference</em>.'}, section);

        const controlRow = createElement('div', {style: {display: 'flex', gap: '20px', flexWrap: 'wrap'}}, section);
        const sliderPanel = createElement('div', {style: {flex: '1', minWidth: '250px'}}, controlRow);
        const canvasPanel = createElement('div', {style: {flex: '2', minWidth: '400px'}}, controlRow);

        let numFeatures = 5;
        let numDims = 2;
        let sparsity = 0.7;
        let featureImportance = 1.0;

        createSlider(sliderPanel, 'Number of Features', 2, 20, 5, 1, (v) => { numFeatures = Math.round(v); regenerate(); draw(); });
        createSlider(sliderPanel, 'Model Dimensions', 2, 10, 2, 1, (v) => { numDims = Math.round(v); regenerate(); draw(); });
        createSlider(sliderPanel, 'Feature Sparsity', 0.0, 0.99, 0.7, 0.01, (v) => { sparsity = v; draw(); });
        createSlider(sliderPanel, 'Feature Importance', 0.1, 3.0, 1.0, 0.1, (v) => { featureImportance = v; draw(); });

        // Info panel
        const infoPanel = createElement('div', {style: {marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '12px'}}, sliderPanel);

        const canvas = createCanvas(canvasPanel, 450, 400);
        const ctx = canvas.getContext('2d');

        let featureDirections = [];

        function regenerate() {
            featureDirections = [];
            for (let i = 0; i < numFeatures; i++) {
                const dir = randomMatrix(1, numDims, 1.0);
                featureDirections.push(normalize(dir));
            }
        }
        regenerate();

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = 150;

            // Title
            ctx.fillStyle = '#333';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(`${numFeatures} features in ${numDims} dimensions`, 10, 20);

            // Draw unit circle (for 2D projection)
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw axes
            ctx.strokeStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(cx - radius - 20, cy);
            ctx.lineTo(cx + radius + 20, cy);
            ctx.moveTo(cx, cy - radius - 20);
            ctx.lineTo(cx, cy + radius + 20);
            ctx.stroke();

            // Compute interference matrix
            let totalInterference = 0;
            let maxInterference = 0;
            const interferences = [];

            for (let i = 0; i < numFeatures; i++) {
                for (let j = i + 1; j < numFeatures; j++) {
                    const dot = Math.abs(dotProduct(featureDirections[i], featureDirections[j]));
                    interferences.push({i, j, dot});
                    totalInterference += dot;
                    maxInterference = Math.max(maxInterference, dot);
                }
            }

            // Draw feature directions (project to 2D if needed)
            const colors = [];
            for (let i = 0; i < numFeatures; i++) {
                const hue = (i / numFeatures) * 360;
                colors.push(`hsl(${hue}, 70%, 50%)`);
            }

            for (let i = 0; i < numFeatures; i++) {
                const dir = featureDirections[i];
                // Project to first 2 dims for visualization
                const px = dir[0] || 0;
                const py = dir[1] || 0;

                const endX = cx + px * radius;
                const endY = cy - py * radius;

                // Draw interference lines (faint)
                for (let j = i + 1; j < numFeatures; j++) {
                    const dot = Math.abs(dotProduct(featureDirections[i], featureDirections[j]));
                    if (dot > 0.3) {
                        const dir2 = featureDirections[j];
                        const px2 = dir2[0] || 0;
                        const py2 = dir2[1] || 0;
                        ctx.strokeStyle = `rgba(255, 0, 0, ${dot * 0.5})`;
                        ctx.lineWidth = dot * 3;
                        ctx.beginPath();
                        ctx.moveTo(endX, endY);
                        ctx.lineTo(cx + px2 * radius, cy - py2 * radius);
                        ctx.stroke();
                    }
                }

                // Draw feature arrow
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Arrowhead
                const angle = Math.atan2(-(py), px);
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - 10 * Math.cos(angle - 0.3), endY + 10 * Math.sin(angle - 0.3));
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - 10 * Math.cos(angle + 0.3), endY + 10 * Math.sin(angle + 0.3));
                ctx.stroke();

                // Label
                ctx.fillStyle = colors[i];
                ctx.font = 'bold 11px monospace';
                ctx.fillText(`f${i}`, endX + 5, endY - 5);
            }

            // Compute reconstruction loss with sparsity
            const lossWithSuperposition = totalInterference * (1 - sparsity) * featureImportance;
            const lossWithoutSuperposition = Math.max(0, numFeatures - numDims) * featureImportance;

            // Info
            const ratio = numFeatures / numDims;

            infoPanel.innerHTML = `
                <strong>Feature/Dimension Ratio:</strong> ${ratio.toFixed(1)}x<br>
                <strong>Total Interference:</strong> ${totalInterference.toFixed(3)}<br>
                <strong>Max Pairwise Interference:</strong> ${maxInterference.toFixed(3)}<br>
                <strong>Effective Loss (with sparsity ${sparsity.toFixed(2)}):</strong> ${lossWithSuperposition.toFixed(3)}<br>
                <strong>Loss without superposition:</strong> ${lossWithoutSuperposition.toFixed(3)}<br>
                <hr style="margin:5px 0">
                <em>${ratio > 1 ? '⚠️ More features than dimensions — superposition is necessary!' : '✅ Enough dimensions for all features.'}</em><br>
                <em>${sparsity > 0.8 ? '🎯 High sparsity makes superposition cheap (low interference cost).' : sparsity < 0.3 ? '💥 Low sparsity means high interference cost!' : ''}</em>
            `;

            // Draw loss comparison bar
            const barY = canvas.height - 60;
            ctx.fillStyle = '#333';
            ctx.font = '11px sans-serif';
            ctx.fillText('Superposition tradeoff:', 10, barY);

            const barWidth = 200;
            const barHeight = 15;

            // Bar: interference cost
            ctx.fillStyle = '#ff6b6b';
            const intBar = Math.min(lossWithSuperposition / 5, 1) * barWidth;
            ctx.fillRect(10, barY + 8, intBar, barHeight);
            ctx.fillStyle = '#333';
            ctx.font = '10px monospace';
            ctx.fillText('interference cost', 15, barY + 20);

            // Bar: capacity benefit
            ctx.fillStyle = '#51cf66';
            const capBar = Math.min(ratio / 5, 1) * barWidth;
            ctx.fillRect(10, barY + 30, capBar, barHeight);
            ctx.fillStyle = '#333';
            ctx.fillText('capacity benefit', 15, barY + 42);

            // Annotation
            ctx.fillStyle = '#666';
            ctx.font = '10px sans-serif';
            ctx.fillText('(Red lines between arrows = interference between features)', 10, canvas.height - 5);
        }

        draw();
    }

    // ============================================================
    // SECTION 4: COMPOSITION EXPLORER
    // ============================================================

    function initComposition() {
        const container = document.getElementById('composition-explorer-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: '#f0f9ff', borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '🔗 Interactive: Head Composition (Q, K, V Composition)', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'This demonstrates how two attention heads compose. <strong>Head A</strong> (Layer 0) writes to the residual stream, and <strong>Head B</strong> (Layer 1) reads from it. Adjust the composition type and strengths to see how Head A\'s output influences Head B\'s behavior.'}, section);

        const controlRow = createElement('div', {style: {display: 'flex', gap: '20px', flexWrap: 'wrap'}}, section);
        const sliderPanel = createElement('div', {style: {flex: '1', minWidth: '280px'}}, controlRow);
        const canvasPanel = createElement('div', {style: {flex: '2', minWidth: '400px'}}, controlRow);

        let compositionType = 'K'; // Q, K, or V composition
        let headAStrength = 1.0;
        let headBStrength = 1.0;
        let showWithout = true;

        // Composition type selector
        const typeDiv = createElement('div', {style: {margin: '10px 0'}}, sliderPanel);
        createElement('strong', {textContent: 'Composition Type: '}, typeDiv);
        ['Q-Composition', 'K-Composition', 'V-Composition'].forEach(opt => {
            const btn = createElement('button', {
                textContent: opt,
                style: {padding: '5px 10px', margin: '0 5px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #4a90d9', background: opt === 'K-Composition' ? '#4a90d9' : '#fff', color: opt === 'K-Composition' ? '#fff' : '#333'}
            }, typeDiv);
            btn.addEventListener('click', () => {
                compositionType = opt.charAt(0);
                typeDiv.querySelectorAll('button').forEach(b => { b.style.background = '#fff'; b.style.color = '#333'; });
                btn.style.background = '#4a90d9';
                btn.style.color = '#fff';
                draw();
            });
        });

        createSlider(sliderPanel, 'Head A Output Strength', 0.0, 3.0, 1.0, 0.1, (v) => { headAStrength = v; draw(); });
        createSlider(sliderPanel, 'Head B Sensitivity', 0.0, 3.0, 1.0, 0.1, (v) => { headBStrength = v; draw(); });

        const toggleDiv = createElement('div', {style: {margin: '10px 0'}}, sliderPanel);
        const checkbox = createElement('input', {type: 'checkbox', checked: true}, toggleDiv);
        createElement('label', {textContent: ' Show attention WITHOUT Head A (comparison)', style: {fontSize: '13px'}}, toggleDiv);
        checkbox.addEventListener('change', () => { showWithout = checkbox.checked; draw(); });

        // Explanation panel
        const explPanel = createElement('div', {style: {marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '12px', lineHeight: '1.5'}}, sliderPanel);

        const canvas = createCanvas(canvasPanel, 500, 400);
        const ctx = canvas.getContext('2d');

        const seqLen = 5;
        const dHead = 4;
        const tokens = ['[A]', '[B]', '...', '[A]', '→?'];

        // Fixed embeddings representing the induction pattern
        const embeddings = [
            [1.0, 0.2, 0.0, 0.5],   // A (first occurrence)
            [0.2, 1.0, 0.3, 0.0],   // B
            [0.0, 0.0, 0.5, 0.5],   // ...
            [1.0, 0.2, 0.0, 0.5],   // A (second occurrence)
            [0.3, 0.3, 0.3, 0.3],   // query position
        ];

        // Head A: previous token head (writes "what came before me")
        const headA_WQ = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const headA_WK = [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
        const headA_WV = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const headA_WO = [0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5];

        // Head B: induction head
        const headB_WQ = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const headB_WK = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const headB_WV = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        function computeHeadA() {
            // Head A attends to previous token and copies its value
            const outputs = [];
            for (let i = 0; i < seqLen; i++) {
                const q = matMul(embeddings[i], headA_WQ, 1, dHead, dHead);
                const scores = [];
                for (let j = 0; j <= i; j++) {
                    const k = matMul(embeddings[j], headA_WK, 1, dHead, dHead);
                    scores.push(dotProduct(q, k));
                }
                // Add positional bias for "previous token"
                for (let j = 0; j < scores.length; j++) {
                    scores[j] += (j === i - 1) ? 2.0 : -1.0;
                }
                const attn = softmax(scores);
                // Compute output
                let output = new Array(dHead).fill(0);
                for (let j = 0; j <= i; j++) {
                    const v = matMul(embeddings[j], headA_WV, 1, dHead, dHead);
                    output = vecAdd(output, vecScale(v, attn[j]));
                }
                output = matMul(output, headA_WO, 1, dHead, dHead);
                outputs.push(vecScale(output, headAStrength));
            }
            return outputs;
        }

        function computeHeadB(headAOutputs, useComposition) {
            // Residual after Head A
            const residuals = embeddings.map((emb, i) => {
                if (useComposition && headAOutputs) {
                    return vecAdd(emb, headAOutputs[i]);
                }
                return [...emb];
            });

            // Head B computes attention using the (possibly enriched) residual
            const attnPatterns = [];
            for (let i = 0; i < seqLen; i++) {
                let q, scores = [];

                if (compositionType === 'Q' && useComposition) {
                    q = matMul(residuals[i], headB_WQ, 1, dHead, dHead);
                    q = vecScale(q, headBStrength);
                } else {
                    q = matMul(embeddings[i], headB_WQ, 1, dHead, dHead);
                    q = vecScale(q, headBStrength);
                }

                for (let j = 0; j <= i; j++) {
                    let k;
                    if (compositionType === 'K' && useComposition) {
                        k = matMul(residuals[j], headB_WK, 1, dHead, dHead);
                    } else {
                        k = matMul(embeddings[j], headB_WK, 1, dHead, dHead);
                    }
                    scores.push(dotProduct(q, k) / 2.0);
                }

                // Pad with -inf for causal
                while (scores.length < seqLen) scores.push(-1e9);
                attnPatterns.push(softmax(scores.slice(0, i + 1)));
            }
            return attnPatterns;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const headAOutputs = computeHeadA();
            const attnWith = computeHeadB(headAOutputs, true);
            const attnWithout = computeHeadB(null, false);

            const cellSize = 35;
            const offsetX = 80;

            // Draw "With Composition" attention
            let offsetY = 40;
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`Head B Attention (WITH ${compositionType}-Composition from Head A)`, offsetX, offsetY - 10);

            // Column headers
            ctx.font = '10px monospace';
            for (let j = 0; j < seqLen; j++) {
                ctx.fillStyle = '#555';
                ctx.fillText(tokens[j], offsetX + j * cellSize + 5, offsetY + 12);
            }
            offsetY += 20;

            for (let i = 0; i < seqLen; i++) {
                ctx.fillStyle = '#555';
                ctx.font = '10px monospace';
                ctx.fillText(tokens[i], 10, offsetY + i * cellSize + cellSize / 2 + 3);

                for (let j = 0; j < seqLen; j++) {
                    const val = j <= i ? (attnWith[i][j] || 0) : 0;
                    ctx.fillStyle = heatColor(val);
                    ctx.fillRect(offsetX + j * cellSize, offsetY + i * cellSize, cellSize - 1, cellSize - 1);
                    if (val > 0.01) {
                        ctx.fillStyle = val > 0.5 ? '#fff' : '#333';
                        ctx.font = '9px monospace';
                        ctx.fillText(val.toFixed(2), offsetX + j * cellSize + 3, offsetY + i * cellSize + cellSize / 2 + 3);
                    }
                }
            }

            // Draw "Without Composition" attention
            if (showWithout) {
                const offsetY2 = offsetY + seqLen * cellSize + 40;
                ctx.fillStyle = '#999';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('Head B Attention (WITHOUT composition — baseline)', offsetX, offsetY2 - 10);

                ctx.font = '10px monospace';
                for (let j = 0; j < seqLen; j++) {
                    ctx.fillStyle = '#999';
                    ctx.fillText(tokens[j], offsetX + j * cellSize + 5, offsetY2 + 12);
                }
                const offsetY2b = offsetY2 + 20;

                for (let i = 0; i < seqLen; i++) {
                    ctx.fillStyle = '#999';
                    ctx.font = '10px monospace';
                    ctx.fillText(tokens[i], 10, offsetY2b + i * cellSize + cellSize / 2 + 3);

                    for (let j = 0; j < seqLen; j++) {
                        const val = j <= i ? (attnWithout[i][j] || 0) : 0;
                        ctx.fillStyle = heatColor(val * 0.6); // dimmer
                        ctx.fillRect(offsetX + j * cellSize, offsetY2b + i * cellSize, cellSize - 1, cellSize - 1);
                        if (val > 0.01) {
                            ctx.fillStyle = val > 0.4 ? '#fff' : '#666';
                            ctx.font = '9px monospace';
                            ctx.fillText(val.toFixed(2), offsetX + j * cellSize + 3, offsetY2b + i * cellSize + cellSize / 2 + 3);
                        }
                    }
                }
            }

            // Update explanation
            const explanations = {
                'Q': `<strong>Q-Composition:</strong> Head A's output changes <em>what Head B looks for</em>. The query of Head B now incorporates information written by Head A, so Head B can search for patterns that depend on Head A's computation.`,
                'K': `<strong>K-Composition:</strong> Head A's output changes <em>what Head B attends to</em>. The keys seen by Head B now contain information from Head A. This is how induction heads work: Head A writes "my predecessor was X" and Head B uses that to find matching patterns.`,
                'V': `<strong>V-Composition:</strong> Head A's output changes <em>what information Head B moves</em>. When Head B attends to a position, it now copies a mixture of the original embedding AND Head A's output at that position.`
            };
            explPanel.innerHTML = explanations[compositionType] + `<br><br><em>Compare the two attention matrices: composition changes how Head B distributes attention!</em>`;
        }

        draw();
    }

    // ============================================================
    // SECTION 5: ACTIVATION PATCHING
    // ============================================================

    function initPatching() {
        const container = document.getElementById('patching-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: '#f9f0ff', borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '🔧 Interactive: Activation Patching', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'Activation patching reveals which components are <strong>causally important</strong> for a prediction. Click on any component to "patch" it (replace its corrupted activation with the clean one). Watch how the logit difference recovers!'}, section);

        const numLayers = 4;
        const numHeads = 3;
        const dModel = 6;

        // Simulate clean and corrupted runs
        const cleanInput = "The Eiffel Tower is in [Paris]";
        const corruptedInput = "The Colosseum is in [Rome]";

        // Generate random "importance" scores for each component
        // (In reality these come from actual patching experiments)
        const importance = [];
        const componentLabels = [];
        for (let l = 0; l < numLayers; l++) {
            for (let h = 0; h < numHeads; h++) {
                // Some heads are more important (simulate IOI-like structure)
                let imp = Math.random() * 0.3;
                // Make certain heads very important (like name movers, S-inhibition)
                if (l === 2 && h === 1) imp = 0.85; // "Name mover head"
                if (l === 1 && h === 2) imp = 0.6;  // "S-inhibition head"
                if (l === 3 && h === 0) imp = 0.7;  // "Backup name mover"
                if (l === 0 && h === 1) imp = 0.45; // "Duplicate token head"
                importance.push(imp);
                componentLabels.push(`L${l}H${h}`);
            }
            // MLP
            let mlpImp = Math.random() * 0.2;
            if (l === 2) mlpImp = 0.4;
            importance.push(mlpImp);
            componentLabels.push(`L${l}MLP`);
        }

        const patchedState = new Array(importance.length).fill(false);
        let totalRecovery = 0;

        const infoDiv = createElement('div', {style: {margin: '10px 0', padding: '10px', background: '#fff', borderRadius: '4px'}}, section);
        infoDiv.innerHTML = `
            <strong>Clean input:</strong> "${cleanInput}" → predicts <span style="color:green;font-weight:bold">Paris</span><br>
            <strong>Corrupted input:</strong> "${corruptedInput}" → predicts <span style="color:red;font-weight:bold">Rome</span><br>
            <strong>Goal:</strong> Patch components to recover the "Paris" prediction. Click components below!
        `;

        const canvas = createCanvas(section, 700, 350);
        const ctx = canvas.getContext('2d');

        const recoveryDiv = createElement('div', {style: {margin: '10px 0', padding: '15px', background: '#fff', borderRadius: '4px', fontSize: '16px', textAlign: 'center'}}, section);

        // Reset button
        const resetBtn = createElement('button', {textContent: '🔄 Reset All Patches', style: {padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #666', margin: '10px 0'}}, section);
        resetBtn.addEventListener('click', () => {
            patchedState.fill(false);
            totalRecovery = 0;
            draw();
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Check which component was clicked
            const colWidth = canvas.width / numLayers;
            const rowHeight = 40;
            const startY = 80;

            const col = Math.floor(mx / colWidth);
            if (col < 0 || col >= numLayers) return;

            const row = Math.floor((my - startY) / rowHeight);
            const componentsPerLayer = numHeads + 1;
            if (row < 0 || row >= componentsPerLayer) return;

            const idx = col * componentsPerLayer + row;
            if (idx >= 0 && idx < patchedState.length) {
                patchedState[idx] = !patchedState[idx];
                // Recalculate total recovery
                totalRecovery = 0;
                for (let i = 0; i < patchedState.length; i++) {
                    if (patchedState[i]) {
                        totalRecovery += importance[i];
                    }
                }
                totalRecovery = Math.min(totalRecovery, 1.0);
                draw();
            }
        });

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const colWidth = canvas.width / numLayers;
            const rowHeight = 40;
            const startY = 80;
            const boxWidth = colWidth - 20;
            const boxHeight = 32;
            const componentsPerLayer = numHeads + 1;

            // Layer headers
            ctx.fillStyle = '#333';
            ctx.font = 'bold 13px sans-serif';
            for (let l = 0; l < numLayers; l++) {
                ctx.fillText(`Layer ${l}`, l * colWidth + colWidth / 2 - 25, 25);
            }

            // Draw residual stream arrow
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(10, 45);
            ctx.lineTo(canvas.width - 10, 45);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#888';
            ctx.font = '11px sans-serif';
            ctx.fillText('← Residual Stream →', canvas.width / 2 - 60, 58);

            // Draw components
            for (let l = 0; l < numLayers; l++) {
                for (let r = 0; r < componentsPerLayer; r++) {
                    const idx = l * componentsPerLayer + r;
                    const x = l * colWidth + 10;
                    const y = startY + r * rowHeight;

                    const isPatched = patchedState[idx];
                    const imp = importance[idx];
                    const isAttn = r < numHeads;

                    // Background color based on importance
                    if (isPatched) {
                        ctx.fillStyle = `rgba(50, 200, 50, ${0.3 + imp * 0.7})`;
                    } else {
                        ctx.fillStyle = isAttn ? '#e8f0fe' : '#fee8e8';
                    }

                    ctx.fillRect(x, y, boxWidth, boxHeight);
                    ctx.strokeStyle = isPatched ? '#2a2' : '#999';
                    ctx.lineWidth = isPatched ? 2 : 1;
                    ctx.strokeRect(x, y, boxWidth, boxHeight);

                    // Label
                    ctx.fillStyle = '#333';
                    ctx.font = 'bold 11px monospace';
                    ctx.fillText(componentLabels[idx], x + 5, y + 14);

                    // Importance bar
                    const barWidth = imp * (boxWidth - 60);
                    ctx.fillStyle = `rgba(${Math.round(255 * imp)}, ${Math.round(100 * (1 - imp))}, 50, 0.7)`;
                    ctx.fillRect(x + 55, y + 8, barWidth, 16);

                    // Importance value
                    ctx.fillStyle = '#333';
                    ctx.font = '10px monospace';
                    ctx.fillText(`Δ=${imp.toFixed(2)}`, x + 55 + barWidth + 3, y + 20);

                    // Patched indicator
                    if (isPatched) {
                        ctx.fillStyle = '#2a2';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.fillText('✓', x + boxWidth - 15, y + 20);
                    }
                }
            }

            // Draw recovery meter at bottom
            const meterY = startY + componentsPerLayer * rowHeight + 20;
            const meterWidth = canvas.width - 40;
            const meterHeight = 30;

            ctx.fillStyle = '#eee';
            ctx.fillRect(20, meterY, meterWidth, meterHeight);

            // Recovery fill
            const recoveryWidth = totalRecovery * meterWidth;
            const gradient = ctx.createLinearGradient(20, meterY, 20 + meterWidth, meterY);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.5, '#ffd93d');
            gradient.addColorStop(1, '#51cf66');
            ctx.fillStyle = gradient;
            ctx.fillRect(20, meterY, recoveryWidth, meterHeight);

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, meterY, meterWidth, meterHeight);

            // Labels on meter
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Rome', 25, meterY + 20);
            ctx.fillText('Paris', 20 + meterWidth - 35, meterY + 20);
            ctx.fillText(`Recovery: ${(totalRecovery * 100).toFixed(0)}%`, meterWidth / 2 - 20, meterY + 20);

            // Update recovery display
            const predToken = totalRecovery > 0.5 ? 'Paris' : 'Rome';
            const predColor = totalRecovery > 0.5 ? 'green' : 'red';
            recoveryDiv.innerHTML = `
                <strong>Current prediction:</strong> <span style="color:${predColor};font-size:20px;font-weight:bold">${predToken}</span>
                (logit difference recovery: ${(totalRecovery * 100).toFixed(0)}%)<br>
                <span style="font-size:12px;color:#666">Click components to patch them. Important components recover more of the clean prediction.</span>
            `;
        }

        draw();
    }

    // ============================================================
    // SECTION 6: INDUCTION HEAD DEMO
    // ============================================================

    function initInductionHead() {
        const container = document.getElementById('circuits-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: '#f0fff0', borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '🧠 Interactive: Induction Head Circuit in Action', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'Type a sequence with a repeated pattern (e.g., "A B C D A") and watch the induction head circuit predict what comes after the second "A". The <strong>previous-token head</strong> (Layer 0) identifies predecessors, and the <strong>induction head</strong> (Layer 1) uses that to complete the pattern.'}, section);

        const inputDiv = createElement('div', {style: {margin: '10px 0'}}, section);
        createElement('label', {innerHTML: '<strong>Input sequence (space-separated tokens):</strong> ', style: {display: 'block', marginBottom: '5px'}}, inputDiv);
        const input = createElement('input', {
            type: 'text',
            value: 'A B C D A',
            style: {width: '100%', maxWidth: '400px', padding: '8px', fontSize: '14px', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #ccc'}
        }, inputDiv);

        const canvas = createCanvas(section, 700, 400);
        const ctx = canvas.getContext('2d');

        const explanationDiv = createElement('div', {style: {margin: '10px 0', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '13px'}}, section);

        function draw() {
            const tokens = input.value.trim().split(/\s+/);
            const seqLen = tokens.length;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (seqLen < 2) {
                ctx.fillStyle = '#666';
                ctx.font = '14px sans-serif';
                ctx.fillText('Enter at least 2 tokens...', 20, 50);
                return;
            }

            const lastToken = tokens[seqLen - 1];
            // Find previous occurrences of the last token
            const prevOccurrences = [];
            for (let i = 0; i < seqLen - 1; i++) {
                if (tokens[i] === lastToken) {
                    prevOccurrences.push(i);
                }
            }

            // Layout
            const tokenSpacing = Math.min(80, (canvas.width - 40) / seqLen);
            const startX = 20;
            const tokenY = 60;
            const headAY = 160;
            const headBY = 280;
            const predY = 360;

            // Draw tokens
            ctx.font = 'bold 14px monospace';
            for (let i = 0; i < seqLen; i++) {
                const x = startX + i * tokenSpacing;
                const isLast = i === seqLen - 1;
                const isPrevOcc = prevOccurrences.includes(i);

                ctx.fillStyle = isLast ? '#d94a4a' : isPrevOcc ? '#4a90d9' : '#333';
                ctx.fillRect(x, tokenY - 18, tokenSpacing - 5, 25);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(tokens[i], x + 5, tokenY - 1);
            }

            // Labels
            ctx.fillStyle = '#333';
            ctx.font = '11px sans-serif';
            ctx.fillText('Input Tokens', startX, tokenY - 30);

            // === LAYER 0: Previous Token Head ===
            ctx.fillStyle = '#4a90d9';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Layer 0: Previous Token Head', startX, headAY - 25);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('"For each token, attend to the token before it and write that info into the residual stream"', startX, headAY - 10);

            // Draw previous-token attention arrows
            for (let i = 1; i < seqLen; i++) {
                const fromX = startX + i * tokenSpacing + tokenSpacing / 2 - 2;
                const toX = startX + (i - 1) * tokenSpacing + tokenSpacing / 2 - 2;

                const opacity = (i === seqLen - 1 || prevOccurrences.includes(i)) ? 0.9 : 0.3;
                ctx.strokeStyle = `rgba(74, 144, 217, ${opacity})`;
                ctx.lineWidth = opacity > 0.5 ? 2.5 : 1;

                // Curved arrow from token i pointing back to token i-1
                ctx.beginPath();
                ctx.moveTo(fromX, tokenY + 10);
                ctx.quadraticCurveTo((fromX + toX) / 2, headAY - 35, toX, tokenY + 10);
                ctx.stroke();

                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(toX - 4, tokenY + 5);
                ctx.lineTo(toX, tokenY + 10);
                ctx.lineTo(toX + 4, tokenY + 5);
                ctx.stroke();

                // Write what was stored
                if (opacity > 0.5) {
                    ctx.fillStyle = '#4a90d9';
                    ctx.font = '9px monospace';
                    ctx.fillText(`prev="${tokens[i - 1]}"`, startX + i * tokenSpacing, headAY + 5);
                }
            }

            // Show residual stream state after Layer 0
            ctx.fillStyle = '#333';
            ctx.font = '10px sans-serif';
            ctx.fillText('Residual stream now contains: token identity + predecessor info', startX, headAY + 25);

            // === LAYER 1: Induction Head ===
            ctx.fillStyle = '#d94a4a';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Layer 1: Induction Head', startX, headBY - 25);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('"Find positions whose PREDECESSOR matches the current token, then copy what follows"', startX, headBY - 10);

            // Draw induction attention
            if (prevOccurrences.length > 0) {
                for (const prevIdx of prevOccurrences) {
                    // The induction head at the last position attends to prevIdx+1
                    // because: tokens[prevIdx] == lastToken, so tokens[prevIdx+1] is what we want to predict
                    const targetIdx = prevIdx + 1;
                    if (targetIdx < seqLen - 1) {
                        const fromX = startX + (seqLen - 1) * tokenSpacing + tokenSpacing / 2 - 2;
                        const toX = startX + targetIdx * tokenSpacing + tokenSpacing / 2 - 2;

                        ctx.strokeStyle = 'rgba(217, 74, 74, 0.8)';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(fromX, headBY + 5);
                        ctx.quadraticCurveTo((fromX + toX) / 2, headBY + 50, toX, headBY + 5);
                        ctx.stroke();

                        // Arrowhead
                        ctx.beginPath();
                        ctx.moveTo(toX - 5, headBY + 10);
                        ctx.lineTo(toX, headBY + 5);
                        ctx.lineTo(toX + 5, headBY + 10);
                        ctx.stroke();

                        // Highlight the target token
                        ctx.fillStyle = 'rgba(217, 74, 74, 0.2)';
                        ctx.fillRect(startX + targetIdx * tokenSpacing, tokenY - 18, tokenSpacing - 5, 25);

                        // Prediction
                        ctx.fillStyle = '#d94a4a';
                        ctx.font = 'bold 14px monospace';
                        ctx.fillText(`→ Predict: "${tokens[targetIdx]}"`, startX + (seqLen - 1) * tokenSpacing - 10, predY);

                        // Explanation arrow
                        ctx.fillStyle = '#666';
                        ctx.font = '10px sans-serif';
                        ctx.fillText(`Because: saw "${lastToken} ${tokens[targetIdx]}" before at positions ${prevIdx},${targetIdx}`, startX, predY + 20);
                    }
                }
            } else {
                ctx.fillStyle = '#999';
                ctx.font = '12px sans-serif';
                ctx.fillText('No repeated pattern found — induction head has nothing to match!', startX, headBY + 30);
                ctx.fillText('Try: "A B C A" — the second A triggers pattern completion → predict B', startX, headBY + 50);
            }

            // K-Composition annotation
            ctx.fillStyle = '#333';
            ctx.font = '10px sans-serif';
            const kcX = canvas.width - 200;
            ctx.fillStyle = 'rgba(100, 50, 200, 0.8)';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('K-COMPOSITION', kcX, headAY + 50);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('Head A writes predecessor info', kcX, headAY + 63);
            ctx.fillText('Head B reads it via K-circuit', kcX, headAY + 76);

            // Draw composition arrow
            ctx.strokeStyle = 'rgba(100, 50, 200, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(kcX - 10, headAY + 20);
            ctx.lineTo(kcX - 10, headBY - 30);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(kcX - 15, headBY - 35);
            ctx.lineTo(kcX - 10, headBY - 30);
            ctx.lineTo(kcX - 5, headBY - 35);
            ctx.fill();

            // Update explanation
            if (prevOccurrences.length > 0) {
                const targetIdx = prevOccurrences[0] + 1;
                explanationDiv.innerHTML = `
                    <strong>Induction Circuit Trace:</strong><br>
                    1. <span style="color:#4a90d9">Previous Token Head</span> at position ${prevOccurrences[0] + 1} writes: "my predecessor is <strong>${tokens[prevOccurrences[0]]}</strong>"<br>
                    2. <span style="color:#d94a4a">Induction Head</span> at position ${seqLen - 1} (current token: "${lastToken}") searches keys for a match<br>
                    3. It finds position ${prevOccurrences[0] + 1} (whose predecessor "${tokens[prevOccurrences[0]]}" matches "${lastToken}") via <span style="color:purple">K-composition</span><br>
                    4. It copies the token at that position: <strong>"${tokens[targetIdx]}"</strong> → this becomes the prediction!<br>
                    <br><em>This is how Transformers do in-context learning: by pattern-matching sequences they've seen earlier in the context.</em>
                `;
            } else {
                explanationDiv.innerHTML = `
                    <strong>No induction pattern detected.</strong> The last token "${lastToken}" doesn't appear earlier in the sequence.<br>
                    Try sequences like: "A B C D A" or "hello world hello" to see the induction circuit activate!
                `;
            }
        }

        input.addEventListener('input', draw);
        draw();
    }

    // ============================================================
    // SECTION 7: SUMMARY / CIRCUIT TAXONOMY
    // ============================================================

    function initSummary() {
        const container = document.getElementById('summary-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '📊 Circuit Taxonomy: Known Circuits in Language Models', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'Click on any circuit to see its details. These are real circuits discovered through mechanistic interpretability research.'}, section);

        const circuits = [
            {
                name: 'Induction Heads',
                layers: '0-1',
                heads: '2 (composed)',
                task: 'In-context pattern completion',
                description: 'Two-head circuit: previous-token head + induction head. Implements [A][B]...[A] → predict [B]. Responsible for most in-context learning in small models.',
                source: 'Olsson et al., 2022',
                importance: 0.95
            },
            {
                name: 'IOI Circuit',
                layers: '0-11',
                heads: '26',
                task: 'Indirect Object Identification',
                description: 'Identifies the indirect object in sentences like "When Mary and John went to the store, John gave a drink to ___". Uses duplicate token heads, S-inhibition heads, and name mover heads.',
                source: 'Wang et al., 2022',
                importance: 0.9
            },
            {
                name: 'Greater-Than Circuit',
                layers: '5-11',
                heads: '~12',
                task: 'Numerical comparison',
                description: 'Determines whether one year is greater than another in sentences like "The war lasted from 1732 to 17___". Uses MLP layers to extract magnitude and attention heads to compare.',
                source: 'Hanna et al., 2023',
                importance: 0.7
            },
            {
                name: 'Docstring Circuit',
                layers: '0-3',
                heads: '4-5',
                task: 'Variable name completion in code',
                description: 'In Python docstrings, predicts the correct variable name by attending to the function signature. A simpler version of induction that works on structured code.',
                source: 'Heimersheim & Janiak, 2023',
                importance: 0.65
            },
            {
                name: 'Backup Name Movers',
                layers: '9-11',
                heads: '3-4',
                task: 'Redundant IOI backup',
                description: 'Backup heads that activate when primary name mover heads are ablated. Evidence of redundancy and self-repair in transformer circuits.',
                source: 'Wang et al., 2022',
                importance: 0.5
            },
            {
                name: 'Successor Heads',
                layers: 'Various',
                heads: '1-2 per model',
                task: 'Predict next item in sequence',
                description: 'Heads that predict the successor of a token: "Monday" → "Tuesday", "January" → "February". Encode ordinal relationships.',
                source: 'Gould et al., 2023',
                importance: 0.6
            }
        ];

        const grid = createElement('div', {style: {display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', margin: '15px 0'}}, section);

        const detailDiv = createElement('div', {style: {margin: '15px 0', padding: '15px', background: '#fff', borderRadius: '8px', border: '2px solid #4a90d9', display: 'none'}}, section);

        circuits.forEach(circuit => {
            const card = createElement('div', {
                style: {
                    padding: '12px', background: '#fff', borderRadius: '6px', cursor: 'pointer',
                    border: '1px solid #ddd', transition: 'all 0.2s'
                }
            }, grid);

            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="color:#4a90d9">${circuit.name}</strong>
                    <span style="background:#${Math.round((1 - circuit.importance) * 155 + 100).toString(16)}ff${Math.round(circuit.importance * 155 + 100).toString(16)};padding:2px 6px;border-radius:10px;font-size:10px">${(circuit.importance * 100).toFixed(0)}% understood</span>
                </div>
                <div style="font-size:11px;color:#666;margin-top:5px">${circuit.task}</div>
                <div style="font-size:10px;color:#999;margin-top:3px">Layers ${circuit.layers} • ${circuit.heads} heads • ${circuit.source}</div>
            `;

            card.addEventListener('mouseenter', () => { card.style.borderColor = '#4a90d9'; card.style.boxShadow = '0 2px 8px rgba(74,144,217,0.2)'; });
            card.addEventListener('mouseleave', () => { card.style.borderColor = '#ddd'; card.style.boxShadow = 'none'; });

            card.addEventListener('click', () => {
                detailDiv.style.display = 'block';
                detailDiv.innerHTML = `
                    <h4 style="margin:0 0 10px 0;color:#4a90d9">${circuit.name}</h4>
                    <table style="font-size:13px;border-collapse:collapse;width:100%">
                        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;vertical-align:top">Task:</td><td>${circuit.task}</td></tr>
                        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;vertical-align:top">Layers:</td><td>${circuit.layers}</td></tr>
                        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;vertical-align:top">Heads:</td><td>${circuit.heads}</td></tr>
                        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;vertical-align:top">Description:</td><td>${circuit.description}</td></tr>
                        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;vertical-align:top">Source:</td><td>${circuit.source}</td></tr>
                    </table>
                    <div style="margin-top:10px;padding:10px;background:#f0f8ff;border-radius:4px;font-size:12px">
                        <strong>How it was discovered:</strong> Researchers used activation patching and path patching to identify which attention heads were causally responsible for the model's behavior on this task. They then traced the information flow between heads to map out the full circuit.
                    </div>
                `;
                detailDiv.scrollIntoView({behavior: 'smooth', block: 'nearest'});
            });
        });
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        initResidualStream();
        initInductionHead();
        initQKVExplorer();
        initSuperposition();
        initComposition();
        initPatching();
        initSummary();
    }

    init();

})();
