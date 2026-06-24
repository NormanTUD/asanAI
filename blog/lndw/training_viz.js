// ============================================================
// TRAINING VISUALIZATION – Next Token Prediction
// ============================================================

const TrainingViz = {
    texts: [
        { full: "Die Katze saß auf der Matte und schnurrte leise.", source: "Wikipedia" },
        { full: "Es war einmal ein König der in einem großen Schloss lebte.", source: "Märchenbuch" },
        { full: "Python ist eine beliebte Programmiersprache für maschinelles Lernen.", source: "Tech-Blog" },
        { full: "Die Sonne ging langsam hinter den Bergen unter.", source: "Roman" },
        { full: "Neuronale Netze bestehen aus vielen Schichten von Neuronen.", source: "Lehrbuch" },
    ],

    // Fake predictions the model might make (sometimes wrong!)
    fakePredictions: {
        'Die': ['Der', 'Eine', 'Die'],
        'Katze': ['Hund', 'Katze', 'Mann'],
        'saß': ['lief', 'saß', 'ging'],
        'auf': ['auf', 'unter', 'in'],
        'der': ['der', 'dem', 'einer'],
        'Matte': ['Straße', 'Matte', 'Bank'],
        'und': ['und', 'oder', 'aber'],
        'schnurrte': ['bellte', 'schnurrte', 'lachte'],
        'leise': ['laut', 'leise', 'schnell'],
        '.': ['.', '!', ','],
        'Es': ['Es', 'Er', 'Sie'],
        'war': ['war', 'ist', 'wurde'],
        'einmal': ['einmal', 'immer', 'nie'],
        'ein': ['ein', 'kein', 'der'],
        'König': ['Mann', 'König', 'Bauer'],
        'in': ['in', 'auf', 'vor'],
        'einem': ['einem', 'dem', 'keinem'],
        'großen': ['kleinen', 'großen', 'alten'],
        'Schloss': ['Haus', 'Schloss', 'Wald'],
        'lebte': ['lebte', 'wohnte', 'starb'],
        'Python': ['Java', 'Python', 'C++'],
        'ist': ['ist', 'war', 'wird'],
        'eine': ['eine', 'keine', 'die'],
        'beliebte': ['neue', 'beliebte', 'alte'],
        'Programmiersprache': ['Sprache', 'Programmiersprache', 'Methode'],
        'für': ['für', 'von', 'mit'],
        'maschinelles': ['tiefes', 'maschinelles', 'schnelles'],
        'Lernen': ['Lernen', 'Denken', 'Rechnen'],
        'Sonne': ['Sonne', 'Mond', 'Nacht'],
        'ging': ['ging', 'kam', 'fiel'],
        'langsam': ['schnell', 'langsam', 'plötzlich'],
        'hinter': ['hinter', 'über', 'vor'],
        'den': ['den', 'dem', 'der'],
        'Bergen': ['Wolken', 'Bergen', 'Häusern'],
        'unter': ['unter', 'auf', 'hervor'],
        'Neuronale': ['Neuronale', 'Künstliche', 'Große'],
        'Netze': ['Netze', 'Netzwerke', 'Systeme'],
        'bestehen': ['bestehen', 'sind', 'haben'],
        'aus': ['aus', 'von', 'mit'],
        'vielen': ['vielen', 'wenigen', 'drei'],
        'Schichten': ['Schichten', 'Teilen', 'Ebenen'],
        'von': ['von', 'aus', 'mit'],
        'Neuronen': ['Neuronen', 'Knoten', 'Zellen'],
        '<|endoftext|>': ['<|endoftext|>', '.', 'und'],
    },

    currentTextIdx: 0,
    currentWordIdx: 1,
    autoplayInterval: null,
    lossHistory: [],
    predictionHistory: [], // stores {correct, predicted, target} for each step
    totalSteps: 0,
    modelCorrectStreak: 0,

    getTokens: function(text) {
        return text.replace(/([.,!?;:])/g, ' $1').split(/\s+/).filter(w => w.length > 0);
    },

    // Simulate prediction: early on, model is often wrong. Later, more often right.
    simulatePrediction: function(targetWord) {
        const candidates = this.fakePredictions[targetWord];
        if (!candidates) {
            // Unknown word: model guesses randomly
            return { predicted: '???', correct: false, confidence: 0.1 };
        }

        // Probability of being correct increases over time
        const correctProb = Math.min(0.85, 0.15 + this.totalSteps * 0.015);
        const isCorrect = Math.random() < correctProb;

        if (isCorrect) {
            return { predicted: targetWord, correct: true, confidence: 0.3 + correctProb * 0.6 };
        } else {
            // Pick a wrong answer
            const wrongOnes = candidates.filter(c => c !== targetWord);
            const predicted = wrongOnes.length > 0 ? wrongOnes[Math.floor(Math.random() * wrongOnes.length)] : candidates[0];
            return { predicted, correct: false, confidence: 0.1 + Math.random() * 0.3 };
        }
    },

    // Loss based on prediction correctness
    simulateLoss: function(prediction) {
        if (prediction.correct) {
            // Low loss, with some noise
            return Math.max(0.1, -Math.log(prediction.confidence) * 0.5 + (Math.random() - 0.5) * 0.2);
        } else {
            // High loss
            const baseLoss = -Math.log(Math.max(0.01, 1 - prediction.confidence)) + 1.5;
            return Math.min(6, baseLoss + (Math.random() - 0.5) * 0.5);
        }
    },

    render: function() {
        const container = document.getElementById('training-texts-container');
        const explDiv = document.getElementById('training-explanation');
        if (!container) return;

        const textObj = this.texts[this.currentTextIdx];
        const fullTextWithEnd = textObj.full + " <|endoftext|>";
        const tokens = this.getTokens(fullTextWithEnd);
        const cutoff = Math.min(this.currentWordIdx + 1, tokens.length);

        // Get last prediction info
        const lastPred = this.predictionHistory.length > 0 ? this.predictionHistory[this.predictionHistory.length - 1] : null;

        let html = '';

        // Header with source and step counter
        html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">`;
        html += `<span style="font-size:0.75em; color:#94a3b8;">Quelle: <b>${textObj.source}</b> (Text ${this.currentTextIdx + 1}/${this.texts.length})</span>`;
        html += `<span style="font-size:0.75em; color:#64748b; background:#f1f5f9; padding:3px 8px; border-radius:4px;">Trainingsschritt ${this.totalSteps}</span>`;
        html += `</div>`;

        // === FULL TEXT always visible with highlighting ===
        html += '<div style="background:#f8fafc; border-radius:10px; padding:16px 20px; border:1px solid #e2e8f0; font-size:1.05em; line-height:2.2; text-align:left; position:relative;">';
        html += `<div style="font-size:0.7em; color:#94a3b8; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">📄 Vollständiger Trainingstext (bekannt):</div>`;

        tokens.forEach((token, i) => {
            const isEndToken = token === '<|endoftext|>';
            const displayToken = isEndToken ? '&lt;|endoftext|&gt;' : token;

            if (i < cutoff - 1) {
                // Context: already processed (bold, dark)
                if (isEndToken) {
                    html += `<span style="color:#1e293b; font-weight:600; font-family:monospace; font-size:0.85em; background:#e2e8f0; padding:1px 4px; border-radius:3px;">${displayToken}</span> `;
                } else {
                    html += `<span style="color:#1e293b; font-weight:600;">${token} </span>`;
                }
            } else if (i === cutoff - 1) {
                // Target word: the one being predicted NOW
                if (isEndToken) {
                    html += `<span style="background:#fef3c7; border:2px solid #f59e0b; padding:2px 8px; border-radius:6px; font-weight:bold; color:#92400e; font-family:monospace; font-size:0.85em; animation: arPulse 1s infinite;">${displayToken}</span> `;
                } else {
                    html += `<span style="background:#dcfce7; border:2px solid #10b981; padding:2px 8px; border-radius:6px; font-weight:bold; color:#065f46; animation: arPulse 1s infinite;">${token}</span> `;
                }
            } else {
                // Future: visible but greyed out (model can't see these yet)
                if (isEndToken) {
                    html += `<span style="color:#cbd5e1; font-family:monospace; font-size:0.85em;">${displayToken}</span> `;
                } else {
                    html += `<span style="color:#cbd5e1;">${token} </span>`;
                }
            }
        });

        html += '</div>';

        // === What model sees vs. what it must predict ===
        html += `<div style="margin-top:14px; display:flex; align-items:stretch; gap:0; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">`;

        // Left: Model sees
        html += `<div style="flex:1; padding:12px 16px; background:#eff6ff; border-right:2px solid #3b82f6;">`;
        html += `<div style="font-size:0.7em; color:#3b82f6; font-weight:bold; margin-bottom:6px;">👁️ MODELL SIEHT:</div>`;
        const contextTokens = tokens.slice(0, cutoff - 1);
        const contextStr = contextTokens.join(' ');
        html += `<div style="font-size:0.9em; color:#1e40af; font-weight:500;">"${contextStr.length > 70 ? '…' + contextStr.slice(-70) : contextStr}"</div>`;
        html += `</div>`;

        // Middle: Model's prediction (if we have one)
        if (lastPred && this.totalSteps > 0) {
            const predColor = lastPred.correct ? '#10b981' : '#ef4444';
            const predBg = lastPred.correct ? '#f0fdf4' : '#fef2f2';
            const predIcon = lastPred.correct ? '✅' : '❌';
            html += `<div style="flex:0 0 auto; padding:12px 16px; background:${predBg}; border-right:2px solid ${predColor}; min-width:130px; text-align:center;">`;
            html += `<div style="font-size:0.7em; color:${predColor}; font-weight:bold; margin-bottom:6px;">${predIcon} MODELL SAGTE:</div>`;
            html += `<div style="font-size:1em; font-weight:bold; color:${lastPred.correct ? '#065f46' : '#991b1b'}; ${!lastPred.correct ? 'text-decoration:line-through;' : ''}">"${lastPred.predicted}"</div>`;
            if (!lastPred.correct) {
                html += `<div style="font-size:0.75em; color:#991b1b; margin-top:4px;">Richtig wäre: "${lastPred.target}"</div>`;
            }
            html += `</div>`;
        }

        // Right: Must predict next
        html += `<div style="flex:0 0 auto; padding:12px 16px; background:#f0fdf4; min-width:120px; text-align:center;">`;
        html += `<div style="font-size:0.7em; color:#10b981; font-weight:bold; margin-bottom:6px;">🎯 MUSS VORHERSAGEN:</div>`;
        const target = tokens[cutoff - 1];
        const isEnd = target === '<|endoftext|>';
        html += `<div style="font-size:1.1em; font-weight:bold; color:${isEnd ? '#92400e' : '#065f46'};">${isEnd ? '&lt;|endoftext|&gt;' : '"' + target + '"'}</div>`;
        html += `</div>`;

        html += `</div>`;

        // === Prediction accuracy mini-stats ===
        if (this.predictionHistory.length > 0) {
            const recent = this.predictionHistory.slice(-20);
            const correctCount = recent.filter(p => p.correct).length;
            const accuracy = (correctCount / recent.length * 100).toFixed(0);
            const lastLoss = this.lossHistory.length > 0 ? this.lossHistory[this.lossHistory.length - 1] : 0;

            html += `<div style="margin-top:10px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap; font-size:0.8em;">`;
            html += `<span style="padding:4px 10px; border-radius:6px; background:#f1f5f9; color:#475569;">Genauigkeit (letzte 20): <b style="color:${accuracy > 60 ? '#10b981' : '#ef4444'};">${accuracy}%</b></span>`;
            html += `<span style="padding:4px 10px; border-radius:6px; background:#f1f5f9; color:#475569;">Loss: <b style="color:#ef4444;">${lastLoss.toFixed(2)}</b></span>`;
            html += `<span style="padding:4px 10px; border-radius:6px; background:#f1f5f9; color:#475569;">Gewichte-Updates: <b>${this.totalSteps}</b></span>`;
            html += `</div>`;
        }

        container.innerHTML = html;

        // Explanation
        if (explDiv) {
            if (lastPred && !lastPred.correct && this.totalSteps > 0) {
                explDiv.innerHTML = `❌ <b>Falsch!</b> Das Modell sagte "<b>${lastPred.predicted}</b>", aber richtig war "<b>${lastPred.target}</b>". → <b>Hoher Loss (${this.lossHistory[this.lossHistory.length - 1]?.toFixed(2)})</b>. Die Gewichte werden angepasst, damit es beim nächsten Mal besser wird!`;
                explDiv.style.background = '#fef2f2';
                explDiv.style.borderColor = '#fecaca';
                explDiv.style.color = '#991b1b';
            } else if (lastPred && lastPred.correct && this.totalSteps > 0) {
                explDiv.innerHTML = `✅ <b>Richtig!</b> Das Modell hat "<b>${lastPred.target}</b>" korrekt vorhergesagt. → <b>Niedriger Loss (${this.lossHistory[this.lossHistory.length - 1]?.toFixed(2)})</b>. Kleine Gewichtsanpassung – es ist schon auf dem richtigen Weg!`;
                explDiv.style.background = '#f0fdf4';
                explDiv.style.borderColor = '#bbf7d0';
                explDiv.style.color = '#166534';
            } else if (isEnd) {
                explDiv.innerHTML = `🏁 Das Modell muss lernen, wann ein Text <b>zu Ende</b> ist! Das <code>&lt;|endoftext|&gt;</code>-Token signalisiert: "Hier ist Schluss, nächster Text."`;
                explDiv.style.background = '#eff6ff';
                explDiv.style.borderColor = '#bfdbfe';
                explDiv.style.color = '#1e40af';
            } else {
                explDiv.innerHTML = `🎯 Das Modell sieht <b>${cutoff - 1} Wörter</b> und muss "<b>${target}</b>" vorhersagen. Klicke <b>"Nächstes Wort"</b> um zu sehen, ob es richtig liegt!`;
                explDiv.style.background = '#eff6ff';
                explDiv.style.borderColor = '#bfdbfe';
                explDiv.style.color = '#1e40af';
            }
        }

        // Render loss chart
        this.renderLossChart();
    },

    renderLossChart: function() {
        const plotDiv = document.getElementById('training-loss-chart');
        if (!plotDiv || this.lossHistory.length === 0) return;

        // Color each point by correct/incorrect
        const colors = this.predictionHistory.map(p => p.correct ? '#10b981' : '#ef4444');

        const traces = [
            // Loss line
            {
                x: Array.from({ length: this.lossHistory.length }, (_, i) => i + 1),
                y: this.lossHistory,
                type: 'scatter',
                mode: 'lines',
                line: { color: '#94a3b8', width: 1.5 },
                fill: 'tozeroy',
                fillcolor: 'rgba(148,163,184,0.05)',
                hovertemplate: 'Schritt %{x}<br>Loss: %{y:.3f}<extra></extra>',
                showlegend: false,
            },
            // Dots colored by correct/wrong
            {
                x: Array.from({ length: this.lossHistory.length }, (_, i) => i + 1),
                y: this.lossHistory,
                type: 'scatter',
                mode: 'markers',
                marker: { color: colors, size: 5, line: { width: 0.5, color: '#fff' } },
                hovertemplate: 'Schritt %{x}<br>Loss: %{y:.3f}<extra></extra>',
                showlegend: false,
            },
            // Moving average (trend line)
            {
                x: Array.from({ length: this.lossHistory.length }, (_, i) => i + 1),
                y: this.movingAverage(this.lossHistory, 8),
                type: 'scatter',
                mode: 'lines',
                line: { color: '#3b82f6', width: 3 },
                hovertemplate: 'Trend: %{y:.3f}<extra></extra>',
                showlegend: false,
            }
        ];

        const layout = {
            margin: { l: 45, r: 15, b: 30, t: 10 },
            xaxis: { title: { text: 'Trainingsschritte', font: { size: 10 } }, gridcolor: '#f1f5f9' },
            yaxis: { title: { text: 'Loss', font: { size: 10 } }, gridcolor: '#f1f5f9', rangemode: 'tozero', range: [0, Math.max(5, ...this.lossHistory) * 1.1] },
            plot_bgcolor: '#fff',
            showlegend: false,
            annotations: this.lossHistory.length > 5 ? [{
                x: this.lossHistory.length,
                y: this.lossHistory[this.lossHistory.length - 1],
                text: `${this.lossHistory[this.lossHistory.length - 1].toFixed(2)}`,
                showarrow: true,
                arrowhead: 2,
                ax: -30,
                ay: -20,
                font: { size: 11, color: colors[colors.length - 1], weight: 'bold' }
            }] : [],
            shapes: this.lossHistory.length > 10 ? [{
                type: 'line',
                x0: 0, x1: this.lossHistory.length,
                y0: 0.5, y1: 0.5,
                line: { color: '#10b981', width: 1, dash: 'dot' },
            }] : []
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
    },

    movingAverage: function(arr, window) {
        return arr.map((_, i) => {
            const start = Math.max(0, i - window + 1);
            const slice = arr.slice(start, i + 1);
            return slice.reduce((a, b) => a + b, 0) / slice.length;
        });
    },

    nextExample: function() {
        const textObj = this.texts[this.currentTextIdx];
        const fullTextWithEnd = textObj.full + " <|endoftext|>";
        const tokens = this.getTokens(fullTextWithEnd);

        // Get the target word for this step
        const target = tokens[Math.min(this.currentWordIdx, tokens.length - 1)];

        // Simulate prediction
        const prediction = this.simulatePrediction(target);
        prediction.target = target;
        this.predictionHistory.push(prediction);

        // Calculate loss based on prediction
        const loss = this.simulateLoss(prediction);
        this.lossHistory.push(loss);

        this.currentWordIdx++;
        this.totalSteps++;

        if (this.currentWordIdx >= tokens.length) {
            // Move to next text
            this.currentTextIdx = (this.currentTextIdx + 1) % this.texts.length;
            this.currentWordIdx = 1;
        }

        this.render();
    },

    nextText: function() {
        this.currentTextIdx = (this.currentTextIdx + 1) % this.texts.length;
        this.currentWordIdx = 1;

        const textObj = this.texts[this.currentTextIdx];
        const tokens = this.getTokens(textObj.full + " <|endoftext|>");
        const target = tokens[0];
        const prediction = this.simulatePrediction(target);
        prediction.target = target;
        this.predictionHistory.push(prediction);
        this.lossHistory.push(this.simulateLoss(prediction));
        this.totalSteps++;

        this.render();
    },

    toggleAutoplay: function() {
        const btn = document.getElementById('training-autoplay-btn');
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
            if (btn) { btn.textContent = '⏩ Autoplay'; btn.style.background = '#fff'; btn.style.color = '#1e293b'; }
        } else {
            this.autoplayInterval = setInterval(() => this.nextExample(), 900);
            if (btn) { btn.textContent = '⏸ Stopp'; btn.style.background = '#ef4444'; btn.style.color = '#fff'; }
        }
    },

    destroy: function() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
};

