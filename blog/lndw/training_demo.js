"use strict";

window.TrainingDemo = (function() {
    var IMG_DATA = [
        { src: "katze1.jpg", label: "Katze", labelIdx: 0, features: [0.90, 0.15, 0.80, 0.20] },
        { src: "katze2.jpg", label: "Katze", labelIdx: 0, features: [0.85, 0.20, 0.75, 0.15] },
        { src: "katze3.jpg", label: "Katze", labelIdx: 0, features: [0.80, 0.10, 0.85, 0.25] },
        { src: "hund1.jpg", label: "Hund", labelIdx: 1, features: [0.15, 0.85, 0.20, 0.80] },
        { src: "hund2.jpeg", label: "Hund", labelIdx: 1, features: [0.20, 0.75, 0.15, 0.85] },
        { src: "hund3.jpg", label: "Hund", labelIdx: 1, features: [0.10, 0.90, 0.25, 0.75] }
    ];

    var L1 = 4, L2 = 4, L3 = 2;

    var s = {
        idx: 0, step: 0, phase: 0, phaseT: 0, lastTime: 0,
        W1: null, b1: null, W2: null, b2: null,
        inp: [0,0,0,0], hid: [0,0,0,0], hidRaw: [0,0,0,0], out: [0,0],
        loss: 0, gradO: [0,0], gradH: [0,0,0,0],
        correct: false,
        lossHist: [], weightHist: [], posHist: [],
        imgs: [], imgLoaded: 0,
        running: false, animId: null, plotTimer: null,
        plotInitialized: false
    };

    function randn() {
        var u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function initNet() {
        s.W1 = Array.from({length: L1}, function() {
            return Array.from({length: L2}, function() { return randn() * 0.5; });
        });
        s.b1 = [0, 0, 0, 0];
        s.W2 = Array.from({length: L2}, function() {
            return Array.from({length: L3}, function() { return randn() * 0.5; });
        });
        s.b2 = [0, 0];
        s.step = 0; s.lossHist = []; s.weightHist = []; s.posHist = [];
    }

    function fwd(inp) {
        s.inp = inp.slice();
        for (var j = 0; j < L2; j++) {
            var sum = s.b1[j];
            for (var i = 0; i < L1; i++) sum += inp[i] * s.W1[i][j];
            s.hidRaw[j] = sum;
            s.hid[j] = Math.max(0, sum);
        }
        for (var k = 0; k < L3; k++) {
            var sum = s.b2[k];
            for (var j = 0; j < L2; j++) sum += s.hid[j] * s.W2[j][k];
            s.out[k] = sum;
        }
        var mx = Math.max(s.out[0], s.out[1]);
        var es = Math.exp(s.out[0] - mx) + Math.exp(s.out[1] - mx);
        s.out[0] = Math.exp(s.out[0] - mx) / es;
        s.out[1] = Math.exp(s.out[1] - mx) / es;
    }

    function bwd(target) {
        var tgt = target === 0 ? [1, 0] : [0, 1];
        s.gradO[0] = s.out[0] - tgt[0];
        s.gradO[1] = s.out[1] - tgt[1];
        s.loss = -(tgt[0] * Math.log(Math.max(s.out[0], 1e-8)) + tgt[1] * Math.log(Math.max(s.out[1], 1e-8)));
        s.correct = (target === 0 && s.out[0] > s.out[1]) || (target === 1 && s.out[1] > s.out[0]);
        for (var j = 0; j < L2; j++) {
            var g = 0;
            for (var k = 0; k < L3; k++) g += s.gradO[k] * s.W2[j][k];
            s.gradH[j] = g * (s.hidRaw[j] > 0 ? 1 : 0.01);
        }
    }

    function upd(lr) {
        for (var j = 0; j < L2; j++)
            for (var k = 0; k < L3; k++)
                s.W2[j][k] -= lr * s.gradO[k] * s.hid[j];
        for (var k = 0; k < L3; k++) s.b2[k] -= lr * s.gradO[k];
        for (var i = 0; i < L1; i++)
            for (var j = 0; j < L2; j++)
                s.W1[i][j] -= lr * s.gradH[j] * s.inp[i];
        for (var j = 0; j < L2; j++) s.b1[j] -= lr * s.gradH[j];
    }

    function preloadImages(cb) {
        s.imgs = [];
        var count = 0;
        IMG_DATA.forEach(function(item, i) {
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function() { s.imgs[i] = img; count++; if (count === IMG_DATA.length && cb) cb(); };
            img.onerror = function() { s.imgs[i] = null; count++; if (count === IMG_DATA.length && cb) cb(); };
            img.src = item.src;
        });
    }

    // ============================================================
    // CANVAS NETWORK DRAWING
    // ============================================================
    function draw() {
        var canvas = document.getElementById('training-network-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        var netTop = 72, netH = H - netTop - 14;
        var layerGap = W / 4, neuronR = 13;
        var pt = s.phaseT;

        var data = IMG_DATA[s.idx];

        // ---- Images at top ----
        var imgSize = 38, imgGap = 4;
        var tw = IMG_DATA.length * (imgSize + imgGap) - imgGap;
        var sx = (W - tw) / 2;
        for (var i = 0; i < IMG_DATA.length; i++) {
            var ix = sx + i * (imgSize + imgGap), iy = 8;
            ctx.fillStyle = (i === s.idx) ? '#3b82f6' : '#e2e8f0';
            ctx.fillRect(ix - 1, iy - 1, imgSize + 2, imgSize + 2);
            if (s.imgs[i]) ctx.drawImage(s.imgs[i], ix, iy, imgSize, imgSize);
            else { ctx.fillStyle = '#f1f5f9'; ctx.fillRect(ix, iy, imgSize, imgSize); }
            if (i === s.idx) { ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.strokeRect(ix - 1, iy - 1, imgSize + 2, imgSize + 2); }
        }

        ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#334155';
        ctx.fillText(data.label + ' (' + (data.labelIdx === 0 ? 'Katze' : 'Hund') + ')', W / 2, 66);

        // ---- Layer setup ----
        var layers = [
            { x: layerGap, n: L1, label: 'Eingabe', vals: s.inp, color: '#6366f1' },
            { x: layerGap * 2, n: L2, label: 'Versteckt', vals: s.hid, color: '#8b5cf6' },
            { x: layerGap * 3, n: L3, label: 'Ausgabe', vals: s.out, color: '#3b82f6' }
        ];

        var layerYs = layers.map(function(l) {
            var spacing = Math.min(36, (netH - 16) / Math.max(l.n, 2));
            var startY = netTop + (netH - (l.n - 1) * spacing) / 2;
            var ys = [];
            for (var i = 0; i < l.n; i++) ys.push(startY + i * spacing);
            return ys;
        });

        var isFwd = (s.phase === 1);
        var isBwd = (s.phase === 3);
        var isLoss = (s.phase === 2);
        var isUpdate = (s.phase === 4);

        // ---- Fade old predictions during transition ----
        var oldPredAlpha = 1;
        if (s.phase === 0) oldPredAlpha = Math.max(0, 1 - pt * 3);
        if (oldPredAlpha < 0.01) oldPredAlpha = 0;

        // ---- Helper: draw connection bundle ----
        function drawConnections(fi, ti, fYs, tYs, wMat, gMat, fwdFactor, bwdFactor, baseAlpha) {
            baseAlpha = baseAlpha || 0.06;
            var fn = layers[fi].n, tn = layers[ti].n;
            for (var f = 0; f < fn; f++) {
                for (var t = 0; t < tn; t++) {
                    var w = wMat ? wMat[f][t] : 0;
                    var alpha = baseAlpha + Math.abs(w) * 0.3;
                    var hue = w >= 0 ? 210 : 0;
                    var width = Math.max(0.5, Math.abs(w) * 2.5);
                    if (fwdFactor > 0 && fi === 0 && ti === 1) {
                        var flow = s.inp[f] * w * fwdFactor;
                        if (flow > 0) { alpha = Math.min(0.9, alpha + flow * 2); hue = 210; }
                        else if (flow < 0) { alpha = Math.min(0.9, alpha + Math.abs(flow) * 2); hue = 0; }
                        width = Math.max(width, Math.abs(flow) * 4);
                    }
                    if (bwdFactor > 0) {
                        var g = gMat ? gMat[t] * w : 0;
                        var gAlpha = Math.abs(g) * bwdFactor * 5;
                        if (gAlpha > 0.05) {
                            alpha = Math.min(0.9, alpha + gAlpha);
                            hue = 30;
                            width = Math.max(width, Math.abs(g) * bwdFactor * 6);
                        }
                    }
                    ctx.beginPath();
                    ctx.moveTo(layers[fi].x + neuronR + 2, fYs[f]);
                    ctx.lineTo(layers[ti].x - neuronR - 2, tYs[t]);
                    ctx.strokeStyle = 'hsla(' + hue + ', 75%, 50%, ' + Math.min(1, alpha).toFixed(2) + ')';
                    ctx.lineWidth = width;
                    ctx.stroke();
                }
            }
        }

        // Forward glow
        var fwdProg = 0;
        if (isFwd) fwdProg = Math.min(1, pt / 1.2);
        var bwdProg = 0;
        if (isBwd) bwdProg = Math.min(1, pt / 1.5);

        // Backward sub-phase for directional glow
        var bwdPhase = 0;
        if (isBwd) {
            if (pt < 0.35) bwdPhase = 1;       // output → hidden connections
            else if (pt < 0.65) bwdPhase = 2;  // hidden neurons glow
            else bwdPhase = 3;                  // hidden → input connections
        }

        // Draw connections
        drawConnections(0, 1, layerYs[0], layerYs[1], s.W1, s.gradH, fwdProg, (isBwd && bwdPhase === 3) ? bwdProg : 0, 0.06);
        drawConnections(1, 2, layerYs[1], layerYs[2], s.W2, s.gradO, isFwd ? fwdProg : 0, (isBwd && bwdPhase === 1) ? bwdProg : 0, 0.06);

        // ---- Draw neurons ----
        for (var li = 0; li < layers.length; li++) {
            var l = layers[li];
            var ys = layerYs[li];
            for (var ni = 0; ni < l.n; ni++) {
                var x = l.x, y = ys[ni];
                var val = l.vals[ni] || 0;

                // Glow effects
                var glow = 0, glowColor = '#f59e0b';
                if (isBwd) {
                    if (li === 2) { glow = Math.abs(s.gradO[ni]) * bwdProg * 3; glowColor = '#ef4444'; }
                    else if (li === 1 && bwdPhase >= 2) { glow = Math.abs(s.gradH[ni]) * bwdProg * 2; glowColor = '#f59e0b'; }
                }

                // Base fill from activation
                var fillVal = Math.min(1, Math.abs(val) * 1.2);
                var r = Math.round(200 - fillVal * 140);
                var g = Math.round(200 - fillVal * 80);
                var b = Math.round(240 - fillVal * 140);

                if (glow > 0.05) {
                    r = Math.round(255 - (1 - glow) * 100);
                    g = Math.round(180 - (1 - glow) * 120);
                    b = Math.round(100 - (1 - glow) * 60);
                }

                ctx.beginPath();
                ctx.arc(x, y, neuronR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgb(' + Math.min(255, r) + ',' + Math.min(255, g) + ',' + Math.min(255, b) + ')';
                ctx.fill();

                ctx.strokeStyle = glow > 0.1 ? glowColor : '#94a3b8';
                ctx.lineWidth = glow > 0.1 ? 3 : 1.5;
                ctx.stroke();

                if (glow > 0.05) {
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 15 * glow;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }

                // Value text (only in forward/update phases)
                if (isFwd || isLoss || isUpdate || s.phase === 0) {
                    ctx.fillStyle = (fillVal > 0.5 || glow > 0.3) ? '#fff' : '#334155';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(val.toFixed(2), x, y);
                }

                // Output labels and probability bars
                if (li === 2) {
                    var label = ni === 0 ? 'Katze' : 'Hund';
                    ctx.font = 'bold 12px system-ui';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#334155';
                    ctx.fillText(label, x + neuronR + 8, y - 6);

                    var barW = 55, barH = 8;
                    var barX = x + neuronR + 8, barY = y + 8;
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(barX, barY, barW, barH);
                    var barColor = ni === 0 ? '#3b82f6' : '#10b981';
                    if (!s.correct && isFwd) barColor = '#f59e0b';
                    ctx.fillStyle = barColor;
                    ctx.fillRect(barX, barY, barW * val, barH);
                    ctx.fillStyle = '#64748b';
                    ctx.font = '9px monospace';
                    ctx.textAlign = 'right';
                    ctx.fillText((val * 100).toFixed(0) + '%', barX + barW + 4, barY + barH - 1);
                }
            }
        }

        // ---- Layer labels ----
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        layers.forEach(function(l, i) { ctx.fillText(l.label, l.x, netTop + netH - 4); });

        // ---- Loss / Status display ----
        var infoY = 46;
        ctx.textAlign = 'right';
        ctx.font = 'bold 11px system-ui';

        if (isLoss || isBwd || isUpdate) {
            ctx.fillStyle = s.loss > 0.6 ? '#dc2626' : '#10b981';
            ctx.fillText('Loss: ' + s.loss.toFixed(4), W - 10, infoY);
            ctx.fillStyle = '#64748b';
            ctx.font = '10px system-ui';
            ctx.fillText(s.correct ? 'Richtig ✓' : 'Falsch ✗', W - 10, infoY + 16);
            if (isBwd) {
                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 10px system-ui';
                ctx.fillText('↻ Fehler rückwärts propagieren...', W - 10, infoY + 32);
            }
            if (isUpdate) {
                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 10px system-ui';
                ctx.fillText('✓ Gewichte aktualisiert', W - 10, infoY + 32);
            }
        } else if (isFwd) {
            ctx.fillStyle = '#6366f1';
            ctx.font = 'bold 10px system-ui';
            ctx.fillText('→ Vorwärtspass...', W - 10, infoY + 16);
        }

        // Step counter
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Schritt ' + s.step, W - 10, H - 4);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Epoche ' + Math.floor(s.step / IMG_DATA.length), 10, H - 4);

        // ---- Loss history mini chart ----
        if (s.lossHist.length > 1) {
            var chartX = 10, chartY = H - 80, chartW = 120, chartH = 40;
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillRect(chartX, chartY, chartW, chartH);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(chartX, chartY, chartW, chartH);
            var maxLoss = Math.max.apply(null, s.lossHist.slice(-30));
            var minLoss = Math.min.apply(null, s.lossHist.slice(-30));
            var range = Math.max(maxLoss - minLoss, 0.1);
            var visible = s.lossHist.slice(-30);
            ctx.beginPath();
            for (var vi = 0; vi < visible.length; vi++) {
                var vx = chartX + (vi / (visible.length - 1)) * chartW;
                var vy = chartY + chartH - ((visible[vi] - minLoss) / range) * chartH;
                if (vi === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
            }
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = '8px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText('Loss-Verlauf', chartX + 2, chartY + 10);
        }
    }

    // ============================================================
    // 3D LOSS LANDSCAPE (Plotly)
    // ============================================================
    function getLandscapeData() {
        var gs = 25;
        var wIdx1 = 0, wIdx2 = 2;
        var curW1 = s.W1[wIdx1][0], curW2 = s.W1[wIdx2][0];
        var halfRange = 2.0;
        var wMin = curW1 - halfRange, wMax = curW1 + halfRange;
        var bMin = curW2 - halfRange, bMax = curW2 + halfRange;
        var xVals = [], yVals = [], zVals = [];
        for (var i = 0; i < gs; i++) xVals.push(wMin + i / (gs - 1) * (wMax - wMin));
        for (var j = 0; j < gs; j++) yVals.push(bMin + j / (gs - 1) * (bMax - bMin));
        for (var j = 0; j < gs; j++) {
            var row = [];
            var w2Val = yVals[j];
            for (var i = 0; i < gs; i++) {
                var w1Val = xVals[i];
                var totalLoss = 0;
                for (var ii = 0; ii < IMG_DATA.length; ii++) {
                    var feat = IMG_DATA[ii].features;
                    var target = IMG_DATA[ii].labelIdx;
                    var h = [];
                    for (var hh = 0; hh < L2; hh++) {
                        var sum = s.b1[hh];
                        for (var ff = 0; ff < L1; ff++) {
                            var w = s.W1[ff][hh];
                            if (ff === wIdx1 && hh === 0) w = w1Val;
                            if (ff === wIdx2 && hh === 0) w = w2Val;
                            sum += feat[ff] * w;
                        }
                        h.push(Math.max(0, sum));
                    }
                    var o = [];
                    for (var kk = 0; kk < L3; kk++) {
                        var sum = s.b2[kk];
                        for (var hh = 0; hh < L2; hh++) sum += h[hh] * s.W2[hh][kk];
                        o.push(sum);
                    }
                    var mx = Math.max(o[0], o[1]);
                    var es = Math.exp(o[0] - mx) + Math.exp(o[1] - mx);
                    o[0] = Math.exp(o[0] - mx) / es;
                    o[1] = Math.exp(o[1] - mx) / es;
                    var tgtArr = target === 0 ? [1, 0] : [0, 1];
                    totalLoss += -(tgtArr[0] * Math.log(Math.max(o[0], 1e-8)) + tgtArr[1] * Math.log(Math.max(o[1], 1e-8)));
                }
                row.push(totalLoss / IMG_DATA.length);
            }
            zVals.push(row);
        }
        return { x: xVals, y: yVals, z: zVals };
    }

    function updatePlot() {
        var div = document.getElementById('training-loss-landscape');
        if (!div || typeof Plotly === 'undefined') return;
        var data = getLandscapeData();
        var wIdx1 = 0, wIdx2 = 2;
        var curW1 = s.W1[wIdx1][0], curW2 = s.W1[wIdx2][0];

        var pathW = [], pathB = [], pathLoss = [];
        if (s.posHist.length > 0) {
            for (var i = 0; i < s.posHist.length; i++) {
                pathW.push(s.posHist[i].w1);
                pathB.push(s.posHist[i].w2);
            }
        }

        var surface = {
            type: 'surface',
            x: data.x, y: data.y, z: data.z,
            colorscale: [
                [0, 'rgb(0,40,120)'], [0.2, 'rgb(0,100,200)'],
                [0.4, 'rgb(50,180,220)'], [0.6, 'rgb(150,220,80)'],
                [0.8, 'rgb(220,180,30)'], [1, 'rgb(180,60,30)']
            ],
            opacity: 0.85,
            contours: { z: { show: true, usecolormap: true } },
            showscale: false,
            hovertemplate: 'Gewicht 1: %{x:.3f}<br>Gewicht 2: %{y:.3f}<br>Loss: %{z:.4f}<extra></extra>',
            name: 'Loss-Fläche'
        };
        var traces = [surface];

        if (pathW.length > 1) {
            traces.push({
                type: 'scatter3d', mode: 'lines',
                x: pathW, y: pathB,
                z: pathW.map(function(_, i) {
                    var lossVal = 0;
                    for (var ii = 0; ii < IMG_DATA.length; ii++) {
                        var feat = IMG_DATA[ii].features, target = IMG_DATA[ii].labelIdx;
                        var h = [];
                        for (var hh = 0; hh < L2; hh++) {
                            var sum = s.b1[hh];
                            for (var ff = 0; ff < L1; ff++) {
                                var w = s.W1[ff][hh];
                                if (ff === wIdx1 && hh === 0) w = pathW[i];
                                if (ff === wIdx2 && hh === 0) w = pathB[i];
                                sum += feat[ff] * w;
                            }
                            h.push(Math.max(0, sum));
                        }
                        var o = [];
                        for (var kk = 0; kk < L3; kk++) {
                            var sum = s.b2[kk];
                            for (var hh = 0; hh < L2; hh++) sum += h[hh] * s.W2[hh][kk];
                            o.push(sum);
                        }
                        var mx = Math.max(o[0], o[1]);
                        var es = Math.exp(o[0] - mx) + Math.exp(o[1] - mx);
                        o[0] = Math.exp(o[0] - mx) / es; o[1] = Math.exp(o[1] - mx) / es;
                        var tgtArr = target === 0 ? [1, 0] : [0, 1];
                        lossVal += -(tgtArr[0] * Math.log(Math.max(o[0], 1e-8)) + tgtArr[1] * Math.log(Math.max(o[1], 1e-8)));
                    }
                    return lossVal / IMG_DATA.length + 0.005;
                }),
                line: { color: '#ffffff', width: 3 },
                name: 'Optimierungspfad'
            });
        }

        if (pathW.length > 0) {
            var startLoss = 0;
            for (var ii = 0; ii < IMG_DATA.length; ii++) {
                // same computation...
                var feat = IMG_DATA[ii].features, target = IMG_DATA[ii].labelIdx;
                var h = [];
                for (var hh = 0; hh < L2; hh++) {
                    var sum = s.b1[hh];
                    for (var ff = 0; ff < L1; ff++) {
                        var w = s.W1[ff][hh];
                        if (ff === wIdx1 && hh === 0) w = pathW[0];
                        if (ff === wIdx2 && hh === 0) w = pathB[0];
                        sum += feat[ff] * w;
                    }
                    h.push(Math.max(0, sum));
                }
                var o = [];
                for (var kk = 0; kk < L3; kk++) {
                    var sum = s.b2[kk];
                    for (var hh = 0; hh < L2; hh++) sum += h[hh] * s.W2[hh][kk];
                    o.push(sum);
                }
                var mx = Math.max(o[0], o[1]);
                var es = Math.exp(o[0]-mx) + Math.exp(o[1]-mx);
                o[0] = Math.exp(o[0]-mx)/es; o[1] = Math.exp(o[1]-mx)/es;
                var tgtArr = target === 0 ? [1,0] : [0,1];
                startLoss += -(tgtArr[0]*Math.log(Math.max(o[0],1e-8)) + tgtArr[1]*Math.log(Math.max(o[1],1e-8)));
            }
            traces.push({
                type: 'scatter3d', mode: 'markers',
                x: [pathW[0]], y: [pathB[0]], z: [startLoss / IMG_DATA.length + 0.005],
                marker: { size: 6, color: '#2ecc71', symbol: 'diamond' },
                name: 'Start'
            });
        }

        var curLoss = 0;
        for (var ii = 0; ii < IMG_DATA.length; ii++) {
            var feat = IMG_DATA[ii].features, target = IMG_DATA[ii].labelIdx;
            var h = [];
            for (var hh = 0; hh < L2; hh++) {
                var sum = s.b1[hh];
                for (var ff = 0; ff < L1; ff++) sum += feat[ff] * s.W1[ff][hh];
                h.push(Math.max(0, sum));
            }
            var o = [];
            for (var kk = 0; kk < L3; kk++) {
                var sum = s.b2[kk];
                for (var hh = 0; hh < L2; hh++) sum += h[hh] * s.W2[hh][kk];
                o.push(sum);
            }
            var mx = Math.max(o[0], o[1]);
            var es = Math.exp(o[0]-mx) + Math.exp(o[1]-mx);
            o[0] = Math.exp(o[0]-mx)/es; o[1] = Math.exp(o[1]-mx)/es;
            var tgtArr = target === 0 ? [1,0] : [0,1];
            curLoss += -(tgtArr[0]*Math.log(Math.max(o[0],1e-8)) + tgtArr[1]*Math.log(Math.max(o[1],1e-8)));
        }
        curLoss = curLoss / IMG_DATA.length;

        traces.push({
            type: 'scatter3d', mode: 'markers',
            x: [curW1], y: [curW2], z: [curLoss + 0.005],
            marker: { size: 10, color: '#ef4444', symbol: 'circle', line: { color: '#fff', width: 2 } },
            name: 'Aktuell (Loss: ' + curLoss.toFixed(3) + ')'
        });

        var dm = typeof is_dark_mode !== 'undefined' && is_dark_mode;
        var layout = {
            scene: {
                xaxis: { title: 'Gewicht 1', color: dm ? '#aaa' : '#444', gridcolor: dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                yaxis: { title: 'Gewicht 2', color: dm ? '#aaa' : '#444', gridcolor: dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                zaxis: { title: 'Loss', color: dm ? '#aaa' : '#444', gridcolor: dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', rangemode: 'tozero' },
                bgcolor: dm ? '#0d0d1a' : '#fff',
                camera: { eye: { x: 1.8, y: 1.8, z: 0.8 } }
            },
            paper_bgcolor: dm ? '#0d0d1a' : '#fff',
            margin: { l: 0, r: 0, t: 0, b: 0 },
            showlegend: true,
            legend: { x: 0.01, y: 0.99, font: { size: 9, color: dm ? '#aaa' : '#444' } },
            dragmode: 'turntable'
        };

        var config = { responsive: true, displaylogo: false, scrollZoom: false };
        if (!s.plotInitialized) {
            Plotly.newPlot(div, traces, layout, config).then(function() { s.plotInitialized = true; });
        } else {
            Plotly.react(div, traces, layout, config);
        }
    }

    // ============================================================
    // MAIN LOOP
    // ============================================================
    function tick(time) {
        if (!s.running) return;
        s.animId = requestAnimationFrame(tick);
        var dt = s.lastTime ? Math.min(50, time - s.lastTime) : 16;
        s.lastTime = time;
        s.phaseT += dt / 1000;

        if (s.phase === 0) {
            var data = IMG_DATA[s.idx];
            fwd(data.features);
            bwd(data.labelIdx);
            s.phase = 1;
            s.phaseT = 0;
        }

        if (s.phase === 1 && s.phaseT > 1.2) { s.phase = 2; s.phaseT = 0; }
        if (s.phase === 2 && s.phaseT > 1.0) { s.phase = 3; s.phaseT = 0; }
        if (s.phase === 3 && s.phaseT > 1.5) {
            upd(0.3);
            s.lossHist.push(s.loss);
            s.posHist.push({ w1: s.W1[0][0], w2: s.W1[2][0] });
            s.step++;
            s.phase = 4;
            s.phaseT = 0;
        }
        if (s.phase === 4 && s.phaseT > 0.5) { s.phase = 5; s.phaseT = 0; }
        if (s.phase === 5 && s.phaseT > 0.3) {
            s.idx = (s.idx + 1) % IMG_DATA.length;
            s.phase = 0;
            s.phaseT = 0;
        }
        draw();
    }

    function isOnTrainingSlide() {
        var slide = document.querySelector('.slide.active');
        return slide && slide.getAttribute('data-title') === 'Training';
    }

    // ============================================================
    // PUBLIC API
    // ============================================================
    function init() {
        var canvas = document.getElementById('training-network-canvas');
        if (!canvas) return;
        var container = canvas.parentElement;
        var W = Math.min(container.clientWidth || 500, 580);
        canvas.width = W;
        canvas.height = 440;
        initNet();
        preloadImages(function() {
            var data = IMG_DATA[s.idx];
            fwd(data.features);
            bwd(data.labelIdx);
            draw();
            updatePlot();
        });
        // Initial empty draw
        draw();
    }

    function start() {
        if (!document.getElementById('training-network-canvas')) return;
        s.running = true;
        s.phase = 0;
        s.phaseT = 0;
        s.lastTime = 0;
        tick();
        if (s.plotTimer) clearInterval(s.plotTimer);
        s.plotTimer = setInterval(function() {
            if (s.running && document.querySelector('.slide.active') && 
                document.querySelector('.slide.active').getAttribute('data-title') === 'Training') {
                updatePlot();
            }
        }, 1200);
    }

    function stop() {
        s.running = false;
        if (s.animId) { cancelAnimationFrame(s.animId); s.animId = null; }
        if (s.plotTimer) { clearInterval(s.plotTimer); s.plotTimer = null; }
    }

    function reset() {
        stop();
        initNet();
        s.idx = 0; s.phase = 0; s.phaseT = 0; s.lastTime = 0;
        s.lossHist = []; s.weightHist = []; s.posHist = [];
        s.plotInitialized = false;
        var canvas = document.getElementById('training-network-canvas');
        if (canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (s.imgs.length > 0 && s.imgs[0]) {
            var data = IMG_DATA[s.idx];
            fwd(data.features);
            bwd(data.labelIdx);
        }
    }

    return { init: init, start: start, stop: stop, reset: reset, isOnTrainingSlide: isOnTrainingSlide };
})();
