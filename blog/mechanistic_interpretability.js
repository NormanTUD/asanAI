/**
 * Circuits Inside LLMs - Interactive Visualization
 *
 * Demonstrates:
 * 1. Induction head circuits
 * 2. Grokking modular addition
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
    // SECTION 1: INDUCTION HEAD DEMO
    // ============================================================

    function initInductionHead() {
        const container = document.getElementById('circuits-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: themeColor('#f0fff0'), borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: 'Interactive: Induction Head Circuit in Action', style: {marginTop: 0}}, section);
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

        const explanationDiv = createElement('div', {style: {margin: '10px 0', padding: '10px', background: themeColor('#ffffff'), borderRadius: '4px', fontSize: '13px'}}, section);

        function draw() {
            const tokens = input.value.trim().split(/\s+/);
            const seqLen = tokens.length;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (seqLen < 2) {
                ctx.fillStyle = themeColor('#666');
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
                // Token text stays light so it's readable on the colored rectangles
                ctx.fillStyle = '#f1f5f9';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(tokens[i], x + 5, tokenY - 1);
            }

            // Labels
            ctx.fillStyle = themeColor('#333');
            ctx.font = '11px sans-serif';
            ctx.fillText('Input Tokens', startX, tokenY - 30);

            // === LAYER 0: Previous Token Head ===
            ctx.fillStyle = '#4a90d9';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Layer 0: Previous Token Head', startX, headAY - 25);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = themeColor('#666');
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
            ctx.fillStyle = themeColor('#333');
            ctx.font = '10px sans-serif';
            ctx.fillText('Residual stream now contains: token identity + predecessor info', startX, headAY + 25);

            // === LAYER 1: Induction Head ===
            ctx.fillStyle = '#d94a4a';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Layer 1: Induction Head', startX, headBY - 25);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = themeColor('#666');
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
                        ctx.fillStyle = themeColor('#666');
                        ctx.font = '10px sans-serif';
                        ctx.fillText(`Because: saw "${lastToken} ${tokens[targetIdx]}" before at positions ${prevIdx},${targetIdx}`, startX, predY + 20);
                    }
                }
            } else {
                ctx.fillStyle = themeColor('#999');
                ctx.font = '12px sans-serif';
                ctx.fillText('No repeated pattern found — induction head has nothing to match!', startX, headBY + 30);
                ctx.fillText('Try: "A B C A" — the second A triggers pattern completion → predict B', startX, headBY + 50);
            }

            // K-Composition annotation
            ctx.fillStyle = themeColor('#333');
            ctx.font = '10px sans-serif';
            const kcX = canvas.width - 200;
            ctx.fillStyle = 'rgba(100, 50, 200, 0.8)';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('K-COMPOSITION', kcX, headAY + 50);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = themeColor('#666');
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
    // SECTION 2: GROKKING VISUALIZATION
    // ============================================================

    function initGrokking() {
        const container = document.getElementById('grokking-container');
        if (!container) return;

        const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: themeColor('#f0faf0'), borderRadius: '8px', margin: '20px 0'}}, container);
        createElement('h3', {textContent: '🧩 Interactive: Grokking Modular Addition', style: {marginTop: 0}}, section);
        createElement('p', {innerHTML: 'This simulates how a small Transformer learns modular addition $a + b \\bmod 13$. <strong>Drag the training progress slider</strong> to watch the network transition from memorization to generalization. The clock visualization shows the learned Fourier features — when they align, the model "grokked" the algorithm.'}, section);

        const controlRow = createElement('div', {style: {display: 'flex', gap: '20px', flexWrap: 'wrap'}}, section);
        const sliderPanel = createElement('div', {style: {flex: '1', minWidth: '250px'}}, controlRow);
        const canvasPanel = createElement('div', {style: {flex: '2', minWidth: '450px'}}, controlRow);

        const modulus = 13;
        const totalSteps = 100;

        let progress = totalSteps - 1;

        createSlider(sliderPanel, 'Training Progress', 0, totalSteps - 1, totalSteps - 1, 1, (v) => {
            progress = Math.round(v);
            draw();
        });

        const infoPanel = createElement('div', {style: {marginTop: '15px', padding: '15px', background: themeColor('#ffffff'), borderRadius: '8px', fontSize: '13px', lineHeight: '1.6'}}, sliderPanel);

        const canvas = createCanvas(canvasPanel, 500, 380);
        const ctx = canvas.getContext('2d');

        function simulateTrainAccuracy(step) {
            if (step < 20) return 0.95 + 0.05 * Math.random();
            if (step < 40) return 0.98 + 0.02 * Math.random();
            if (step < 55) return 0.99 + 0.01 * Math.random();
            const s = (step - 55) / 20;
            const jump = 1 / (1 + Math.exp(-8 * (s - 0.4)));
            return 0.99 + 0.01 * jump;
        }

        function simulateTestAccuracy(step) {
            if (step < 20) return 0.05 + 0.05 * Math.random();
            if (step < 30) return 0.08 + 0.05 * Math.random();
            if (step < 50) return 0.12 + 0.08 * Math.random();
            if (step < 60) return 0.15 + 0.05 * Math.random();
            const s = (step - 60) / 25;
            const jump = 1 / (1 + Math.exp(-10 * (s - 0.5)));
            return 0.15 + 0.85 * jump;
        }

        function computeFourierCoherence(step) {
            if (step < 30) return 0.05 + 0.05 * Math.random();
            if (step < 50) return 0.1 + 0.1 * (step - 30) / 20;
            if (step < 65) return 0.2 + 0.3 * (step - 50) / 15;
            const s = (step - 65) / 20;
            return 0.5 + 0.5 * (1 / (1 + Math.exp(-6 * (s - 0.5))));
        }

        function getPhase(step) {
            if (step < 40) return {name: 'Memorization', color: '#e74c3c', desc: 'Network stores individual pairs — no structure yet'};
            if (step < 65) return {name: 'Circuit Formation', color: '#f39c12', desc: 'Fourier algorithm crystallizing in the weights'};
            return {name: 'Cleanup', color: '#27ae60', desc: 'Memorization pruned away — only the generalizing circuit remains'};
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const leftMargin = 50;
            const topMargin = 30;
            const chartWidth = 300;
            const chartHeight = 150;

            // Draw accuracy chart (train vs test)
            ctx.fillStyle = themeColor('#333');
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Accuracy vs Training Step', leftMargin, topMargin + 12);

            ctx.strokeStyle = themeColor('#ddd');
            ctx.lineWidth = 1;
            ctx.strokeRect(leftMargin, topMargin + 20, chartWidth, chartHeight);

            // Axis labels
            ctx.fillStyle = themeColor('#999');
            ctx.font = '9px sans-serif';
            ctx.fillText('0%', leftMargin - 20, topMargin + chartHeight + 15);
            ctx.fillText('50%', leftMargin - 20, topMargin + chartHeight / 2 + 5);
            ctx.fillText('100%', leftMargin - 22, topMargin + 25);
            ctx.fillText('Training Step', leftMargin + chartWidth / 2 - 25, topMargin + chartHeight + 30);

            // Plot train accuracy
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let s = 0; s < totalSteps; s++) {
                const x = leftMargin + (s / totalSteps) * chartWidth;
                const y = topMargin + 20 + chartHeight - simulateTrainAccuracy(s) * chartHeight;
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Plot test accuracy
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let s = 0; s < totalSteps; s++) {
                const x = leftMargin + (s / totalSteps) * chartWidth;
                const y = topMargin + 20 + chartHeight - simulateTestAccuracy(s) * chartHeight;
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Legend
            ctx.fillStyle = '#e74c3c';
            ctx.font = '10px sans-serif';
            ctx.fillText('Train Accuracy', leftMargin + 10, topMargin + 40);
            ctx.fillStyle = '#27ae60';
            ctx.fillText('Test Accuracy', leftMargin + 10, topMargin + 55);

            // Draw progress marker
            const px = leftMargin + (progress / totalSteps) * chartWidth;
            ctx.strokeStyle = themeColor('#333');
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, topMargin + 20);
            ctx.lineTo(px, topMargin + 20 + chartHeight);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw circle (clock) representation
            const cx = 430;
            const cy = 120;
            const radius = 70;

            ctx.fillStyle = themeColor('#333');
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Grokked Representation', cx - 55, 25);

            ctx.strokeStyle = themeColor('#ddd');
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            const coherence = computeFourierCoherence(progress);

            for (let i = 0; i < modulus; i++) {
                const angle = (i / modulus) * Math.PI * 2 - Math.PI / 2;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;

                const dotSize = coherence > 0.5 ? 4 + coherence * 4 : 3;

                ctx.fillStyle = `hsla(${(i / modulus) * 360}, 80%, ${coherence > 0.3 ? 50 : 70}%, ${0.3 + coherence * 0.7})`;
                ctx.beginPath();
                ctx.arc(x, y, dotSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = coherence > 0.4 ? '#333' : '#999';
                ctx.font = '9px monospace';
                ctx.fillText(i, x + 8, y + 3);
            }

            // Draw connecting arcs showing Fourier structure (when coherence is high)
            if (coherence > 0.4) {
                ctx.strokeStyle = `rgba(39, 174, 96, ${(coherence - 0.4) * 1.5})`;
                ctx.lineWidth = 1 + coherence * 2;
                for (let i = 0; i < modulus; i++) {
                    const a1 = (i / modulus) * Math.PI * 2 - Math.PI / 2;
                    const a2 = ((i + 3) / modulus) * Math.PI * 2 - Math.PI / 2; // third harmonics
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius);
                    ctx.lineTo(cx + Math.cos(a2) * radius, cy + Math.sin(a2) * radius);
                    ctx.stroke();
                }
            }

            // Phase indicator
            const phase = getPhase(progress);
            ctx.fillStyle = phase.color;
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('● ' + phase.name, cx - 50, cy + radius + 30);

            // Fourier coherence bar
            const barY = cy + radius + 55;
            ctx.fillStyle = themeColor('#333');
            ctx.font = '10px sans-serif';
            ctx.fillText('Fourier structure', cx - 60, barY + 10);
            ctx.strokeStyle = themeColor('#ddd');
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + 10, barY, 100, 12);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(cx + 11, barY + 1, coherence * 98, 10);

            // Info panel update
            const trainAcc = simulateTrainAccuracy(progress) * 100;
            const testAcc = simulateTestAccuracy(progress) * 100;
            const phaseObj = getPhase(progress);

            infoPanel.innerHTML = `
                <strong>Training Progress: ${Math.round(progress / totalSteps * 100)}%</strong><br>
                <span style="color:#e74c3c">● Train Accuracy:</span> ${trainAcc.toFixed(1)}%
                <span style="color:#27ae60">● Test Accuracy:</span> ${testAcc.toFixed(1)}%<br>
                <strong>Phase:</strong> <span style="color:${phaseObj.color}">${phaseObj.name}</span> — ${phaseObj.desc}<br>
                <strong>Fourier Coherence:</strong> ${(coherence * 100).toFixed(0)}%
                ${coherence > 0.5 ? ' 🎯 The network has discovered the Fourier algorithm!' : coherence > 0.2 ? ' ⏳ Structure is forming...' : ' ❌ No structure yet'}
                <hr style="margin:5px 0">
                <em>The model first memorizes (high train, low test), then <strong>grokks</strong> (both high) as the Fourier circuit overtakes memorization \cite{nanda2023grokking}.</em>
            `;
        }

        draw();
    }

// ============================================================
// SECTION 3: OTHELLO-GPT WORLD MODEL DEMO
// ============================================================

function initOthelloDemo() {
    const container = document.getElementById('othello-container');
    if (!container) return;

    const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: themeColor('#f0f8ff'), borderRadius: '8px', margin: '20px 0'}}, container);
    createElement('h3', {textContent: '🎮 Interactive: Othello-GPT World Model', style: {marginTop: 0}}, section);
    createElement('p', {innerHTML: 'This demonstrates how a sequence model builds an internal board representation. Click tiles to place moves, and watch how the model\'s <strong>internal probe accuracy</strong> changes across layers. The key insight: the model "sees" the board even though it was never shown one.'}, section);

    const mainRow = createElement('div', {style: {display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start'}}, section);
    const boardPanel = createElement('div', {style: {flex: '1', minWidth: '280px'}}, mainRow);
    const probePanel = createElement('div', {style: {flex: '1', minWidth: '300px'}}, mainRow);

    // Board state: 0=empty, 1=black, 2=white
    const BOARD_SIZE = 8;
    let board = Array(64).fill(0);
    let moveHistory = [];

    // Initialize standard Othello starting position
    function resetBoard() {
        board = Array(64).fill(0);
        board[27] = 2; board[28] = 1; board[35] = 1; board[36] = 2;
        moveHistory = [];
        draw();
    }

    const canvas = createCanvas(boardPanel, 320, 320);
    const ctx = canvas.getContext('2d');

    // Probe accuracy simulation (based on Table 2 from the paper)
    function getProbeAccuracy(layer, moveCount) {
        // Simulates the nonlinear probe accuracy pattern from Li et al.
        // Peaks at middle layers, improves with more moves
        const baseCurve = [88.7, 92.5, 95.2, 96.6, 97.6, 98.2, 98.3, 95.4];
        const moveBonus = Math.min(moveCount / 60, 1) * 3;
        const noise = (Math.random() - 0.5) * 1.5;
        return Math.min(99.5, baseCurve[layer] + moveBonus + noise);
    }

    function getLinearProbeAccuracy(layer) {
        // Linear probes are much worse (Table 1 from paper)
        const baseCurve = [78.1, 79.5, 79.6, 79.4, 78.9, 78.4, 77.8, 76.9];
        return baseCurve[layer] + (Math.random() - 0.5) * 1;
    }

    function draw() {
        const cellSize = 40;
        ctx.clearRect(0, 0, 320, 320);

        // Draw board
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const x = c * cellSize;
                const y = r * cellSize;
                ctx.fillStyle = '#2d8a4e';
                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeStyle = '#1a5c32';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);

                const idx = r * BOARD_SIZE + c;
                if (board[idx] === 1) {
                    ctx.beginPath();
                    ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/2 - 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#111';
                    ctx.fill();
                } else if (board[idx] === 2) {
                    ctx.beginPath();
                    ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/2 - 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#f5f5f5';
                    ctx.fill();
                    ctx.strokeStyle = '#999';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        // Draw move count
        ctx.fillStyle = themeColor('#333');
        ctx.font = '11px sans-serif';
        ctx.fillText(`Moves: ${moveHistory.length}`, 5, 315);

        // Update probe chart
        drawProbeChart();
    }

    function drawProbeChart() {
        const chartDiv = document.getElementById('othello-probe-chart');
        if (!chartDiv) return;

        const layers = [1, 2, 3, 4, 5, 6, 7, 8];
        const nonlinearAcc = layers.map(l => getProbeAccuracy(l - 1, moveHistory.length));
        const linearAcc = layers.map(l => getLinearProbeAccuracy(l - 1));

        if (typeof Plotly !== 'undefined') {
            const traces = [
                {
                    x: layers, y: nonlinearAcc,
                    type: 'scatter', mode: 'lines+markers',
                    name: 'Nonlinear Probe',
                    line: {color: '#2196F3', width: 3},
                    marker: {size: 8}
                },
                {
                    x: layers, y: linearAcc,
                    type: 'scatter', mode: 'lines+markers',
                    name: 'Linear Probe',
                    line: {color: '#f44336', width: 2, dash: 'dash'},
                    marker: {size: 6}
                }
            ];
            const layout = {
                title: {text: 'Probe Accuracy by Layer', font: {size: 13}},
                xaxis: {title: 'Layer', dtick: 1},
                yaxis: {title: 'Accuracy (%)', range: [70, 100]},
                margin: {t: 40, b: 50, l: 50, r: 20},
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                legend: {x: 0.02, y: 0.02, bgcolor: 'rgba(255,255,255,0.8)'},
                font: {size: 11},
                showlegend: true
            };
            Plotly.newPlot('othello-probe-chart', traces, layout, {displayModeBar: false, responsive: true});
        } else {
            chartDiv.innerHTML = '<p style="color:#999; text-align:center;">Plotly not loaded</p>';
        }
    }

    // Click handler for placing moves
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / 40);
        const row = Math.floor(y / 40);
        const idx = row * BOARD_SIZE + col;

        if (board[idx] === 0 && idx >= 0 && idx < 64) {
            // Alternate black/white
            const color = (moveHistory.length % 2 === 0) ? 1 : 2;
            board[idx] = color;
            moveHistory.push(idx);
            draw();
        }
    });

    // Probe chart container
    createElement('div', {id: 'othello-probe-chart', style: {width: '100%', height: '250px'}}, probePanel);

    const explanationDiv = createElement('div', {style: {marginTop: '10px', padding: '10px', background: themeColor('#fff'), borderRadius: '6px', fontSize: '12px', lineHeight: '1.5'}}, probePanel);
    explanationDiv.innerHTML = `
        <strong>Key Finding:</strong> The nonlinear probe (blue) achieves ~98% accuracy at middle layers,
        while the linear probe (red, dashed) plateaus at ~79%. This proves the board state is encoded
        <em>nonlinearly</em> in the residual stream. The model builds a world model that no linear method can fully decode.<br><br>
        <em>Click tiles to place moves and watch the probe accuracy update.</em>
    `;

    const btnRow = createElement('div', {style: {marginTop: '10px', textAlign: 'center'}}, boardPanel);
    const resetBtn = createElement('button', {textContent: '🔄 Reset Board', style: {padding: '6px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer'}}, btnRow);
    resetBtn.addEventListener('click', resetBoard);

    resetBoard();
}

// ============================================================
// SECTION 4: LINEAR REPRESENTATION & CAUSAL INNER PRODUCT DEMO
// ============================================================

function initLinearRepDemo() {
    const container = document.getElementById('linear-rep-container');
    if (!container) return;

    const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: themeColor('#fff8f0'), borderRadius: '8px', margin: '20px 0'}}, container);
    createElement('h3', {textContent: '📐 Interactive: Linear Representations & the Causal Inner Product', style: {marginTop: 0}}, section);
    createElement('p', {innerHTML: 'Explore how concepts are represented as <strong>directions</strong> in the unembedding space. The causal inner product ensures that causally separable concepts (e.g., language vs. gender) are orthogonal. Drag the slider to rotate between Euclidean and Causal geometry.'}, section);

    const controlRow = createElement('div', {style: {display: 'flex', gap: '20px', flexWrap: 'wrap'}}, section);
    const sliderPanel = createElement('div', {style: {flex: '1', minWidth: '250px'}}, controlRow);
    const canvasPanel = createElement('div', {style: {flex: '2', minWidth: '400px'}}, controlRow);

    let causalWeight = 1.0; // 0 = Euclidean, 1 = Causal

    createSlider(sliderPanel, 'Geometry (Euclidean → Causal)', 0, 100, 100, 1, (v) => {
        causalWeight = v / 100;
        drawConcepts();
    });

    const infoDiv = createElement('div', {style: {marginTop: '15px', padding: '12px', background: themeColor('#fff'), borderRadius: '6px', fontSize: '12px', lineHeight: '1.6'}}, sliderPanel);

    const canvas = createCanvas(canvasPanel, 500, 350);
    const ctx = canvas.getContext('2d');

    // Concept vectors (simplified 2D projection)
    const concepts = [
        {name: 'male→female', eucAngle: 45, causalAngle: 0, color: '#e91e63'},
        {name: 'English→French', eucAngle: 70, causalAngle: 90, color: '#2196F3'},
        {name: 'singular→plural', eucAngle: 20, causalAngle: 180, color: '#4CAF50'},
        {name: 'lower→UPPER', eucAngle: 85, causalAngle: 270, color: '#FF9800'},
    ];

    function drawConcepts() {
        ctx.clearRect(0, 0, 500, 350);
        const cx = 250, cy = 175, radius = 120;

        // Draw unit circle
        ctx.strokeStyle = themeColor('#ddd');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = themeColor('#eee');
        ctx.beginPath();
        ctx.moveTo(cx - radius - 20, cy);
        ctx.lineTo(cx + radius + 20, cy);
        ctx.moveTo(cx, cy - radius - 20);
        ctx.lineTo(cx, cy + radius + 20);
        ctx.stroke();

        // Draw concept vectors
        concepts.forEach((c, i) => {
            const angle = (c.eucAngle * (1 - causalWeight) + c.causalAngle * causalWeight) * Math.PI / 180;
            const endX = cx + Math.cos(angle) * radius;
            const endY = cy - Math.sin(angle) * radius;

            // Arrow
            ctx.strokeStyle = c.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Arrowhead
            const headLen = 10;
            const headAngle = Math.atan2(cy - endY, endX - cx);
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(headAngle - 0.3), endY + headLen * Math.sin(headAngle - 0.3));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(headAngle + 0.3), endY + headLen * Math.sin(headAngle + 0.3));
            ctx.stroke();

            // Label
            const labelX = cx + Math.cos(angle) * (radius + 25);
            const labelY = cy - Math.sin(angle) * (radius + 25);
            ctx.fillStyle = c.color;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(c.name, labelX, labelY);
        });

        // Title
        ctx.fillStyle = themeColor('#333');
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(causalWeight < 0.5 ? '≈ Euclidean Geometry' : '≈ Causal Geometry', cx, 20);

        // Orthogonality indicator
        if (causalWeight > 0.8) {
            ctx.fillStyle = '#4CAF50';
            ctx.font = '10px sans-serif';
            ctx.fillText('✓ Causally separable concepts are orthogonal', cx, 340);
        } else if (causalWeight < 0.2) {
            ctx.fillStyle = '#f44336';
            ctx.font = '10px sans-serif';
            ctx.fillText('✗ Concepts are NOT orthogonal — geometry is wrong', cx, 340);
        }

        // Compute pairwise angles for info panel
        const angles = [];
        for (let i = 0; i < concepts.length; i++) {
            for (let j = i + 1; j < concepts.length; j++) {
                const ai = (concepts[i].eucAngle * (1 - causalWeight) + concepts[i].causalAngle * causalWeight);
                const aj = (concepts[j].eucAngle * (1 - causalWeight) + concepts[j].causalAngle * causalWeight);
                const diff = Math.abs(ai - aj) % 360;
                const angleBetween = Math.min(diff, 360 - diff);
                angles.push({pair: `${concepts[i].name} · ${concepts[j].name}`, angle: angleBetween});
            }
        }

        infoDiv.innerHTML = `
            <strong>Geometry: ${causalWeight < 0.5 ? 'Euclidean' : 'Causal'}</strong> (weight: ${causalWeight.toFixed(2)})<br>
            <strong>Pairwise angles:</strong><br>
            ${angles.map(a => `<span style="font-size:11px;">${a.pair}: <strong>${a.angle.toFixed(0)}°</strong></span>`).join('<br>')}
            <hr style="margin:8px 0;">
            <em>Under the causal inner product, causally separable concepts become orthogonal (90°).
            This is what makes steering vectors work: adding $\\bar{\\lambda}_W$ changes concept W without affecting others.</em>
        `;
    }

    drawConcepts();
}

// ============================================================
// SECTION 5: LOOPED TRANSFORMER COMPUTER DEMO
// ============================================================

function initLoopedTFDemo() {
    const container = document.getElementById('looped-tf-container');
    if (!container) return;

    const section = createElement('div', {className: 'interactive-section', style: {padding: '20px', background: themeColor('#f5f0ff'), borderRadius: '8px', margin: '20px 0'}}, container);
    createElement('h3', {textContent: '🔁 Interactive: Looped Transformer as a Computer', style: {marginTop: 0}}, section);
    createElement('p', {innerHTML: 'Watch a 13-layer Transformer execute a program by looping. Each cycle is one "clock tick." The input sequence contains <strong>instructions</strong>, <strong>memory</strong>, and a <strong>scratchpad</strong>. The Transformer reads an instruction, executes it, updates memory, and increments the program counter — just like a CPU.'}, section);

    const programPanel = createElement('div', {style: {display: 'flex', gap: '15px', flexWrap: 'wrap'}}, section);
    const codePanel = createElement('div', {style: {flex: '1', minWidth: '250px'}}, programPanel);
    const statePanel = createElement('div', {style: {flex: '1', minWidth: '300px'}}, programPanel);

    // Simple program: compute 3 + 5 using FLEQ-like instructions
    const programs = {
        'add': {
            name: 'Addition: 3 + 5',
            instructions: [
                'LOAD mem[0] → scratch   // load 3',
                'LOAD mem[1] → scratch   // load 5',
                'ADD scratch[0], scratch[1] → scratch[2]',
                'STORE scratch[2] → mem[2]  // store result',
                'HALT'
            ],
            memory: [3, 5, 0, 0],
            steps: [
                {pc: 0, scratch: [0, 0, 0], mem: [3, 5, 0, 0], desc: 'Load 3 into scratchpad'},
                {pc: 1, scratch: [3, 0, 0], mem: [3, 5, 0, 0], desc: 'Load 5 into scratchpad'},
                {pc: 2, scratch: [3, 5, 0], mem: [3, 5, 0, 0], desc: 'Add: 3 + 5 = 8'},
                {pc: 3, scratch: [3, 5, 8], mem: [3, 5, 0, 0], desc: 'Store 8 to memory'},
                {pc: 4, scratch: [3, 5, 8], mem: [3, 5, 8, 0], desc: 'Store 8 to memory'},
                {pc: 4, scratch: [3, 5, 8], mem: [3, 5, 8, 0], desc: 'HALT — program complete'}
            ]
        },
        'countdown': {
            name: 'Countdown: 3 → 0 (branch)',
            instructions: [
                'LOAD mem[0] → scratch       // load counter',
                'SUB scratch[0], 1 → scratch[0]',
                'STORE scratch[0] → mem[0]',
                'IF mem[0] ≤ 0: HALT',
                'GOTO instruction 0          // loop back'
            ],
            memory: [3, 1, 0, 0],
            steps: [
                {pc: 0, scratch: [3], mem: [3, 1, 0, 0], desc: 'Load counter (3)'},
                {pc: 1, scratch: [2], mem: [3, 1, 0, 0], desc: 'Subtract 1 → 2'},
                {pc: 2, scratch: [2], mem: [2, 1, 0, 0], desc: 'Store 2 back'},
                {pc: 3, scratch: [2], mem: [2, 1, 0, 0], desc: 'Check: 2 > 0, no branch'},
                {pc: 0, scratch: [2], mem: [2, 1, 0, 0], desc: 'GOTO 0 — loop again'},
                {pc: 1, scratch: [1], mem: [2, 1, 0, 0], desc: 'Subtract 1 → 1'},
                {pc: 2, scratch: [1], mem: [1, 1, 0, 0], desc: 'Store 1 back'},
                {pc: 3, scratch: [1], mem: [1, 1, 0, 0], desc: 'Check: 1 > 0, no branch'},
                {pc: 0, scratch: [1], mem: [1, 1, 0, 0], desc: 'GOTO 0 — loop again'},
                {pc: 1, scratch: [0], mem: [1, 1, 0, 0], desc: 'Subtract 1 → 0'},
                {pc: 2, scratch: [0], mem: [0, 1, 0, 0], desc: 'Store 0 back'},
                {pc: 3, scratch: [0], mem: [0, 1, 0, 0], desc: 'Check: 0 ≤ 0 → HALT!'}
            ]
        }
    };

    let currentProgram = 'add';
    let currentStep = 0;
    let animInterval = null;

    // Program selector
    const selectRow = createElement('div', {style: {marginBottom: '12px'}}, codePanel);
    createElement('label', {innerHTML: '<strong>Program:</strong> ', style: {fontSize: '13px'}}, selectRow);
    const select = createElement('select', {style: {padding: '4px 8px', fontSize: '13px', borderRadius: '4px'}}, selectRow);
    Object.entries(programs).forEach(([key, prog]) => {
        const opt = createElement('option', {value: key, textContent: prog.name}, select);
    });
    select.addEventListener('change', () => {
        currentProgram = select.value;
        currentStep = 0;
        clearInterval(animInterval);
        animInterval = null;
        drawState();
    });

    // Code listing
    const codeBox = createElement('div', {style: {background: themeColor('#1e1e2e'), color: '#cdd6f4', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.7', overflowX: 'auto'}}, codePanel);

    // State display
    const stateBox = createElement('div', {style: {padding: '12px', background: themeColor('#fff'), borderRadius: '6px', border: '1px solid #ddd'}}, statePanel);

    // Controls
    const ctrlRow = createElement('div', {style: {display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap'}}, section);
    const btnStep = createElement('button', {textContent: '⏭ Step', style: {padding: '6px 14px', fontSize: '12px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: '#e3f2fd'}}, ctrlRow);
    const btnPlay = createElement('button', {textContent: '▶ Play', style: {padding: '6px 14px', fontSize: '12px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: '#e8f5e9'}}, ctrlRow);
    const btnReset = createElement('button', {textContent: '⏮ Reset', style: {padding: '6px 14px', fontSize: '12px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer'}}, ctrlRow);

    btnStep.addEventListener('click', () => {
        const prog = programs[currentProgram];
        if (currentStep < prog.steps.length - 1) {
            currentStep++;
            drawState();
        }
    });

    btnPlay.addEventListener('click', () => {
        if (animInterval) {
            clearInterval(animInterval);
            animInterval = null;
            btnPlay.textContent = '▶ Play';
            return;
        }
        btnPlay.textContent = '⏸ Pause';
        animInterval = setInterval(() => {
            const prog = programs[currentProgram];
            if (currentStep < prog.steps.length - 1) {
                currentStep++;
                drawState();
            } else {
                clearInterval(animInterval);
                animInterval = null;
                btnPlay.textContent = '▶ Play';
            }
        }, 800);
    });

    btnReset.addEventListener('click', () => {
        clearInterval(animInterval);
        animInterval = null;
        btnPlay.textContent = '▶ Play';
        currentStep = 0;
        drawState();
    });

    function drawState() {
        const prog = programs[currentProgram];
        const step = prog.steps[currentStep];

        // Code listing with highlight
        let codeHTML = '';
        prog.instructions.forEach((line, i) => {
            const highlight = (i === step.pc) ? 'background:#45475a; border-left:3px solid #89b4fa;' : 'border-left:3px solid transparent;';
            const arrow = (i === step.pc) ? '<span style="color:#f38ba8;">►</span> ' : '  ';
            codeHTML += `<div style="padding:2px 6px; ${highlight}">${arrow}${i}: ${line}</div>`;
        });
        codeBox.innerHTML = codeHTML;

        // State display
        stateBox.innerHTML = `
            <div style="margin-bottom:8px;"><strong>Cycle ${currentStep + 1}</strong> of ${prog.steps.length}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
                <div>
                    <div style="font-weight:bold; color:#1565c0; margin-bottom:4px;">📋 Program Counter</div>
                    <div style="font-family:monospace; background:#e3f2fd; padding:4px 8px; border-radius:4px;">PC = ${step.pc}</div>
                </div>
                <div>
                    <div style="font-weight:bold; color:#e65100; margin-bottom:4px;">📝 Scratchpad</div>
                    <div style="font-family:monospace; background:#fff3e0; padding:4px 8px; border-radius:4px;">[${step.scratch.join(', ')}]</div>
                </div>
                <div style="grid-column: span 2;">
                    <div style="font-weight:bold; color:#2e7d32; margin-bottom:4px;">💾 Memory</div>
                    <div style="font-family:monospace; background:#e8f5e9; padding:4px 8px; border-radius:4px; display:flex; gap:6px;">
                        ${step.mem.map((v, i) => `<span style="border:1px solid #a5d6a7; padding:2px 6px; border-radius:3px;">m[${i}]=${v}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div style="margin-top:10px; padding:8px; background:#f5f0ff; border-radius:4px; font-size:12px; border-left:3px solid #7e57c2;">
                <strong>🔁 This cycle:</strong> ${step.desc}
            </div>
            <div style="margin-top:8px; font-size:11px; color:#666;">
                The <strong>same 13-layer Transformer</strong> executes each cycle. The loop feeds output → input, just like a CPU clock tick.
                Depth does NOT scale with program length — only with single-instruction complexity.
            </div>
        `;
    }

    drawState();
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
	initInductionHead();
	initGrokking();
	initOthelloDemo();
	initLinearRepDemo();
	initLoopedTFDemo();
    }

    init();

})();
