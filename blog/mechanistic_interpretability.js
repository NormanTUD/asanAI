/**
 * Circuits Inside LLMs - Interactive Visualization
 *
 * Demonstrates:
 * 1. Residual stream communication
 * 2. Induction head circuits
 * 3. Attention pattern visualization
 * 4. Superposition geometry
 * 5. QKV decomposition
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
    // SECTION 5: INDUCTION HEAD DEMO
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
    // SECTION 7: GROKKING VISUALIZATION
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
        initGrokking();
    }

    init();

})();
