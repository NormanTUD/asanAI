"use strict";

window.TrainingDemo = (function() {
    var IMG_DATA = [
        { src: "katze1.jpg", label: "Katze", labelIdx: 0 },
        { src: "hund1.jpg", label: "Hund", labelIdx: 1 },
        { src: "katze2.jpg", label: "Katze", labelIdx: 0 },
        { src: "hund2.jpeg", label: "Hund", labelIdx: 1 },
        { src: "katze3.jpg", label: "Katze", labelIdx: 0 },
        { src: "hund3.jpg", label: "Hund", labelIdx: 1 }
    ];

    var NI = 4, NH = 4, NO = 2;

    var s = {
        idx: 0, step: 0,
        phase: 0, phaseT: 0, lastTime: 0,
        W1: null, b1: null, W2: null, b2: null,
        inp: [0,0,0,0], hid: [0,0,0,0], hidRaw: [0,0,0,0], out: [0,0],
        loss: 0, gradO: [0,0], gradH: [0,0,0,0],
        correct: false,
        lossHist: [], posHist: [],
        img: null, features: null,
        running: false, animId: null, plotTimer: null,
        plotInitialized: false,
        plotCamera: null, userInteracted: false
    };

    function randn() {
        var u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function initNet() {
        s.W1 = Array.from({length: NI}, function() {
            return Array.from({length: NH}, function() { return randn() * 0.5; });
        });
        s.b1 = [0,0,0,0];
        s.W2 = Array.from({length: NH}, function() {
            return Array.from({length: NO}, function() { return randn() * 0.5; });
        });
        s.b2 = [0,0];
        s.step = 0; s.lossHist = []; s.posHist = [];
    }

    function fwd(inp) {
        s.inp = inp.slice();
        for (var j = 0; j < NH; j++) {
            var sum = s.b1[j];
            for (var i = 0; i < NI; i++) sum += inp[i] * s.W1[i][j];
            s.hidRaw[j] = sum; s.hid[j] = Math.max(0, sum);
        }
        for (var k = 0; k < NO; k++) {
            var sum = s.b2[k];
            for (var j = 0; j < NH; j++) sum += s.hid[j] * s.W2[j][k];
            s.out[k] = sum;
        }
        var mx = Math.max(s.out[0], s.out[1]);
        var es = Math.exp(s.out[0]-mx) + Math.exp(s.out[1]-mx);
        s.out[0] = Math.exp(s.out[0]-mx)/es;
        s.out[1] = Math.exp(s.out[1]-mx)/es;
    }

    function bwd(target) {
        var tgt = target === 0 ? [1,0] : [0,1];
        s.gradO[0] = s.out[0] - tgt[0];
        s.gradO[1] = s.out[1] - tgt[1];
        s.loss = -(tgt[0]*Math.log(Math.max(s.out[0],1e-8)) + tgt[1]*Math.log(Math.max(s.out[1],1e-8)));
        s.correct = (target === 0 && s.out[0] > s.out[1]) || (target === 1 && s.out[1] > s.out[0]);
        for (var j = 0; j < NH; j++) {
            var g = 0;
            for (var k = 0; k < NO; k++) g += s.gradO[k] * s.W2[j][k];
            s.gradH[j] = g * (s.hidRaw[j] > 0 ? 1 : 0.01);
        }
    }

    function upd(lr) {
        for (var j = 0; j < NH; j++)
            for (var k = 0; k < NO; k++)
                s.W2[j][k] -= lr * s.gradO[k] * s.hid[j];
        for (var k = 0; k < NO; k++) s.b2[k] -= lr * s.gradO[k];
        for (var i = 0; i < NI; i++)
            for (var j = 0; j < NH; j++)
                s.W1[i][j] -= lr * s.gradH[j] * s.inp[i];
        for (var j = 0; j < NH; j++) s.b1[j] -= lr * s.gradH[j];
    }

    function extractFeatures(img) {
        var c = document.createElement('canvas');
        c.width = 2; c.height = 2;
        var cx = c.getContext('2d');
        cx.drawImage(img, 0, 0, 2, 2);
        var d = cx.getImageData(0, 0, 2, 2).data;
        var feats = [];
        for (var i = 0; i < 4; i++) {
            var r = d[i*4], g = d[i*4+1], b = d[i*4+2];
            feats.push((0.299 * r + 0.587 * g + 0.114 * b) / 255);
        }
        return feats;
    }

    function preloadImages(cb) {
        var count = 0;
        IMG_DATA.forEach(function(item, i) {
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function() {
                item.img = img;
                item.features = extractFeatures(img);
                count++;
                if (count === IMG_DATA.length && cb) cb();
            };
            img.onerror = function() {
                item.img = null;
                item.features = [0.5,0.5,0.5,0.5];
                count++;
                if (count === IMG_DATA.length && cb) cb();
            };
            img.src = item.src;
        });
        if (IMG_DATA.length === 0 && cb) cb();
    }

    function arrow(val) {
        if (val > 0.7) return '\u2191\u2191';
        if (val > 0.4) return '\u2191';
        if (val > 0.15) return '\u2192';
        if (val > 0) return '\u2193';
        return '\u2193\u2193';
    }

    // ============================================================
    // CANVAS DRAWING
    // ============================================================
    function draw() {
        var canvas = document.getElementById('training-network-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        var bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#f8fafc');
        bg.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        var data = IMG_DATA[s.idx];
        var pt = s.phaseT;
        var isFwd = s.phase === 1;
        var isLoss = s.phase === 2;
        var isBwd = s.phase === 3;
        var isUpd = s.phase === 4;

        var fwdProg = isFwd ? Math.min(1, pt / 1.6) : 0;
        var bwdProg = isBwd ? Math.min(1, pt / 1.8) : 0;
        var bwdSub = 0;
        if (isBwd) {
            if (pt < 0.3) bwdSub = 1;
            else if (pt < 0.6) bwdSub = 2;
            else bwdSub = 3;
        }

        // ================================================================
        // IMAGE
        // ================================================================
        var imgX = 26, imgY = 16, imgSize = 110;
        if (data.img) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.12)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 3;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(imgX, imgY, imgSize, imgSize, 8);
            else ctx.rect(imgX, imgY, imgSize, imgSize);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(imgX, imgY, imgSize, imgSize, 8);
            else ctx.rect(imgX, imgY, imgSize, imgSize);
            ctx.clip();
            ctx.drawImage(data.img, imgX, imgY, imgSize, imgSize);
            ctx.restore();
        } else {
            ctx.fillStyle = '#e2e8f0';
            if (ctx.roundRect) ctx.roundRect(imgX, imgY, imgSize, imgSize, 8);
            else ctx.rect(imgX, imgY, imgSize, imgSize);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.font = '28px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', imgX + imgSize/2, imgY + imgSize/2);
        }

        // Label below
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(data.label, imgX + imgSize/2, imgY + imgSize + 18);

        // Arrow from image to network
        var arrY = imgY + imgSize + 28;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('\u2193', imgX + imgSize/2, arrY);

        // ================================================================
        // NEURAL NETWORK
        // ================================================================
        var netLeft = imgX;
        var netTop = arrY + 16;
        var netH = H - netTop - 50;
        var layerGap = (W - netLeft - 20) / 3.2;

        var layers = [
            { x: netLeft + layerGap * 0.5, n: NI, label: 'Eingabe', vals: s.inp },
            { x: netLeft + layerGap * 1.5, n: NH, label: 'Versteckt', vals: s.hid },
            { x: netLeft + layerGap * 2.5, n: NO, label: 'Ausgabe', vals: s.out }
        ];

        var layerYs = layers.map(function(l) {
            var gap = Math.min(40, (netH - 20) / Math.max(l.n, 2));
            var sy = netTop + (netH - (l.n - 1) * gap) / 2;
            var ys = [];
            for (var i = 0; i < l.n; i++) ys.push(sy + i * gap);
            return ys;
        });

        var neuronR = 16;

        // ---- Trace dots ----
        var traceDots = [];
        if (isFwd && fwdProg > 0.3) {
            var fDot = Math.min(1, (fwdProg - 0.3) / 0.7);
            if (fDot < 0.5) {
                var t = fDot * 2;
                for (var fi = 0; fi < NI; fi++)
                    for (var ti = 0; ti < NH; ti++)
                        if (Math.random() < 0.02)
                            traceDots.push({
                                x: layers[0].x + neuronR + (layers[1].x - layers[0].x - neuronR*2) * t,
                                y: layerYs[0][fi] + (layerYs[1][ti] - layerYs[0][fi]) * t,
                                alpha: 0.7, size: 3, color: '#6366f1'
                            });
            } else {
                var t = (fDot - 0.5) * 2;
                for (var fi = 0; fi < NH; fi++)
                    for (var ti = 0; ti < NO; ti++)
                        if (Math.random() < 0.04)
                            traceDots.push({
                                x: layers[1].x + neuronR + (layers[2].x - layers[1].x - neuronR*2) * t,
                                y: layerYs[1][fi] + (layerYs[2][ti] - layerYs[1][fi]) * t,
                                alpha: 0.7, size: 3, color: '#8b5cf6'
                            });
            }
        }
        if (isBwd && bwdProg > 0.15) {
            var bDot = Math.min(1, (bwdProg - 0.15) / 0.7);
            if (bDot < 0.45) {
                var t = bDot / 0.45;
                for (var fi = 0; fi < NH; fi++)
                    for (var ti = 0; ti < NO; ti++)
                        if (Math.random() < 0.03)
                            traceDots.push({
                                x: layers[2].x - neuronR - (layers[2].x - layers[1].x - neuronR*2) * t,
                                y: layerYs[2][ti] - (layerYs[2][ti] - layerYs[1][fi]) * t,
                                alpha: 0.7, size: 3, color: '#f59e0b'
                            });
            } else {
                var t = (bDot - 0.45) / 0.55;
                for (var fi = 0; fi < NI; fi++)
                    for (var ti = 0; ti < NH; ti++)
                        if (Math.random() < 0.02)
                            traceDots.push({
                                x: layers[1].x - neuronR - (layers[1].x - layers[0].x - neuronR*2) * t,
                                y: layerYs[1][ti] - (layerYs[1][ti] - layerYs[0][fi]) * t,
                                alpha: 0.7, size: 3, color: '#f59e0b'
                            });
            }
        }

        // ---- Connections ----
        function drawConn(fi, ti, fYs, tYs, wMat, gMat, ff, bf) {
            var fn = layers[fi].n, tn = layers[ti].n;
            for (var f = 0; f < fn; f++) {
                for (var t = 0; t < tn; t++) {
                    var w = wMat ? wMat[f][t] : 0;
                    var alpha = 0.04 + Math.abs(w) * 0.25;
                    var hue = w >= 0 ? 210 : 0;
                    var width = Math.max(0.5, Math.abs(w) * 2);
                    if (ff > 0 && fi === 0 && ti === 1) {
                        var flow = s.inp[f] * w * ff;
                        if (Math.abs(flow) > 0.01) {
                            alpha = Math.min(0.85, alpha + Math.abs(flow) * 3);
                            hue = flow >= 0 ? 210 : 0;
                            width = Math.max(width, Math.abs(flow) * 5);
                        }
                    }
                    if (bf > 0) {
                        var g = gMat ? (gMat[t] || 0) * w : 0;
                        var ga = Math.abs(g) * bf * 4;
                        if (ga > 0.03) {
                            alpha = Math.min(0.85, alpha + ga);
                            hue = 30;
                            width = Math.max(width, Math.abs(g) * bf * 5);
                        }
                    }
                    ctx.beginPath();
                    ctx.moveTo(layers[fi].x + neuronR + 2, fYs[f]);
                    ctx.lineTo(layers[ti].x - neuronR - 2, tYs[t]);
                    ctx.strokeStyle = 'hsla(' + hue + ', 70%, 50%, ' + Math.min(1, alpha).toFixed(2) + ')';
                    ctx.lineWidth = Math.max(0.5, width);
                    ctx.stroke();
                }
            }
        }

        drawConn(0, 1, layerYs[0], layerYs[1], s.W1, s.gradH, fwdProg, (isBwd && bwdSub === 3) ? bwdProg : 0);
        drawConn(1, 2, layerYs[1], layerYs[2], s.W2, s.gradO, isFwd ? fwdProg : 0, (isBwd && bwdSub === 1) ? bwdProg : 0);

        // ---- Neurons ----
        for (var li = 0; li < layers.length; li++) {
            var l = layers[li], ys = layerYs[li];
            for (var ni = 0; ni < l.n; ni++) {
                var x = l.x, y = ys[ni];
                var val = l.vals[ni] || 0;
                var glow = 0, glowColor = '#f59e0b';
                if (isBwd) {
                    if (li === 2) { glow = Math.abs(s.gradO[ni]) * bwdProg * 3; glowColor = '#ef4444'; }
                    else if (li === 1 && bwdSub >= 2) { glow = Math.abs(s.gradH[ni]) * bwdProg * 2; glowColor = '#f59e0b'; }
                    else if (li === 0 && bwdSub >= 3) { glow = 0.3 * bwdProg; glowColor = '#f59e0b'; }
                }

                var fillVal = Math.min(1, Math.abs(val) * 1.5);
                var r = Math.round(230 - fillVal * 160);
                var g = Math.round(230 - fillVal * 110);
                var b = Math.round(245 - fillVal * 170);
                if (glow > 0.05) {
                    r = Math.round(255 - (1 - glow) * 100);
                    g = Math.round(160 - (1 - glow) * 120);
                    b = Math.round(80 - (1 - glow) * 50);
                }

                ctx.beginPath();
                ctx.arc(x, y, neuronR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgb(' + Math.min(255, Math.max(0, r)) + ',' + Math.min(255, Math.max(0, g)) + ',' + Math.min(255, Math.max(0, b)) + ')';
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

                // Arrow indicators instead of numbers
                if (isFwd || isLoss || isUpd) {
                    ctx.fillStyle = (fillVal > 0.5 || glow > 0.3) ? '#fff' : '#475569';
                    ctx.font = 'bold 14px system-ui';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(arrow(val), x, y);
                }

                // Output labels + bars
                if (li === 2) {
                    var lbl = ni === 0 ? 'Katze' : 'Hund';
                    ctx.font = 'bold 13px system-ui';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#334155';
                    ctx.fillText(lbl, x + neuronR + 10, y - 8);

                    var bw = 90, bh = 10;
                    var bx = x + neuronR + 10, by = y + 10;
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(bx, by, bw, bh);
                    ctx.fillStyle = ni === 0 ? '#3b82f6' : '#10b981';
                    if (!s.correct && isFwd) ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(bx, by, bw * val, bh);
                    ctx.fillStyle = '#64748b';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillText((val * 100).toFixed(0) + '%', bx + bw + 6, by + bh - 1);
                }
            }
        }

        // Trace dots
        traceDots.forEach(function(d) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fillStyle = d.color;
            ctx.globalAlpha = d.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowColor = d.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Layer labels
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#94a3b8';
        layers.forEach(function(l, i) { ctx.fillText(l.label, l.x, netTop + netH + 4); });

        // Status
        var siY = 18;
        ctx.textAlign = 'right';
        if (isLoss || isBwd || isUpd) {
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = s.loss > 0.6 ? '#dc2626' : '#10b981';
            ctx.fillText('Loss: ' + s.loss.toFixed(4), W - 12, siY);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText(s.correct ? 'Richtig \u2713' : 'Falsch \u2717', W - 12, siY + 18);
            if (isBwd) {
                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 11px system-ui';
                ctx.fillText('\u21BB R\u00fcckw\u00e4rtspropagation...', W - 12, siY + 38);
            }
            if (isUpd) {
                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 11px system-ui';
                ctx.fillText('\u2713 Gewichte aktualisiert', W - 12, siY + 38);
            }
        } else if (isFwd) {
            ctx.fillStyle = '#6366f1';
            ctx.font = 'bold 11px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText('\u2192 Vorw\u00e4rtspass...', W - 12, siY + 18);
        }

        // Bottom stats
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Schritt ' + s.step, W - 10, H - 6);
        ctx.textAlign = 'left';
        ctx.fillText('Epoche ' + Math.floor(s.step / IMG_DATA.length), 10, H - 6);

        // Loss chart
        if (s.lossHist.length > 1) {
            var cx = 10, cy = H - 90, cw = 120, ch = 36;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(cx, cy, cw, ch);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx, cy, cw, ch);
            var maxL = Math.max.apply(null, s.lossHist), minL = Math.min.apply(null, s.lossHist);
            var rng = Math.max(maxL - minL, 0.1);
            var vis = s.lossHist;
            ctx.beginPath();
            for (var vi = 0; vi < vis.length; vi++) {
                var vx = cx + (vi / Math.max(vis.length - 1, 1)) * cw;
                var vy = cy + ch - ((vis[vi] - minL) / rng) * ch;
                vi === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
            }
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = '8px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText('Loss', cx + 2, cy + 9);
        }

        // Image nav hint
        ctx.font = '9px system-ui';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('\u2190 \u2192 Bilder wechseln', 10, 16);
    }

    // ============================================================
    // 3D LOSS LANDSCAPE
    // ============================================================
    function getLandscapeData() {
        var gs = 25, w1i = 0, w2i = 2;
        var cw1 = s.W1[w1i][0], cw2 = s.W1[w2i][0];
        var hr = 2.0;
        var wMin = cw1 - hr, wMax = cw1 + hr;
        var bMin = cw2 - hr, bMax = cw2 + hr;
        var xv = [], yv = [], zv = [];
        for (var i = 0; i < gs; i++) xv.push(wMin + i/(gs-1)*(wMax - wMin));
        for (var j = 0; j < gs; j++) yv.push(bMin + j/(gs-1)*(bMax - bMin));
        for (var j = 0; j < gs; j++) {
            var row = []; var w2v = yv[j];
            for (var i = 0; i < gs; i++) {
                var w1v = xv[i], tl = 0;
                for (var ii = 0; ii < IMG_DATA.length; ii++) {
                    var feat = IMG_DATA[ii].features, tgt = IMG_DATA[ii].labelIdx;
                    var h = [];
                    for (var hh = 0; hh < NH; hh++) {
                        var sum = s.b1[hh];
                        for (var ff = 0; ff < NI; ff++) {
                            var w = s.W1[ff][hh];
                            if (ff === w1i && hh === 0) w = w1v;
                            if (ff === w2i && hh === 0) w = w2v;
                            sum += feat[ff] * w;
                        }
                        h.push(Math.max(0, sum));
                    }
                    var o = [];
                    for (var kk = 0; kk < NO; kk++) {
                        var sum = s.b2[kk];
                        for (var hh = 0; hh < NH; hh++) sum += h[hh] * s.W2[hh][kk];
                        o.push(sum);
                    }
                    var mx = Math.max(o[0], o[1]);
                    var es = Math.exp(o[0]-mx) + Math.exp(o[1]-mx);
                    o[0] = Math.exp(o[0]-mx)/es; o[1] = Math.exp(o[1]-mx)/es;
                    var ta = tgt === 0 ? [1,0] : [0,1];
                    tl += -(ta[0]*Math.log(Math.max(o[0],1e-8)) + ta[1]*Math.log(Math.max(o[1],1e-8)));
                }
                row.push(tl / IMG_DATA.length);
            }
            zv.push(row);
        }
        return { x: xv, y: yv, z: zv };
    }

    function updatePlot() {
        var div = document.getElementById('training-loss-landscape');
        if (!div || typeof Plotly === 'undefined') return;
        var data = getLandscapeData();
        var w1i = 0, w2i = 2;
        var cw1 = s.W1[w1i][0], cw2 = s.W1[w2i][0];

        var pw = [], pb = [], pz = [];
        if (s.posHist.length > 0) {
            for (var hi = 0; hi < s.posHist.length; hi++) {
                pw.push(s.posHist[hi].w1);
                pb.push(s.posHist[hi].w2);
                var loss = 0;
                for (var ii = 0; ii < IMG_DATA.length; ii++) {
                    var feat = IMG_DATA[ii].features, tgt = IMG_DATA[ii].labelIdx;
                    var h = [];
                    for (var hh = 0; hh < NH; hh++) {
                        var sum = s.b1[hh];
                        for (var ff = 0; ff < NI; ff++) {
                            var w = s.W1[ff][hh];
                            if (ff === w1i && hh === 0) w = s.posHist[hi].w1;
                            if (ff === w2i && hh === 0) w = s.posHist[hi].w2;
                            sum += feat[ff] * w;
                        }
                        h.push(Math.max(0, sum));
                    }
                    var o = [];
                    for (var kk = 0; kk < NO; kk++) {
                        var sum = s.b2[kk];
                        for (var hh = 0; hh < NH; hh++) sum += h[hh] * s.W2[hh][kk];
                        o.push(sum);
                    }
                    var mx = Math.max(o[0], o[1]);
                    var es = Math.exp(o[0]-mx) + Math.exp(o[1]-mx);
                    o[0] = Math.exp(o[0]-mx)/es; o[1] = Math.exp(o[1]-mx)/es;
                    var ta = tgt === 0 ? [1,0] : [0,1];
                    loss += -(ta[0]*Math.log(Math.max(o[0],1e-8)) + ta[1]*Math.log(Math.max(o[1],1e-8)));
                }
                pz.push(loss / IMG_DATA.length + 0.005);
            }
        }

        var surface = {
            type: 'surface', x: data.x, y: data.y, z: data.z,
            colorscale: [
                [0, 'rgb(0,40,120)'], [0.2, 'rgb(0,100,200)'],
                [0.4, 'rgb(50,180,220)'], [0.6, 'rgb(150,220,80)'],
                [0.8, 'rgb(220,180,30)'], [1, 'rgb(180,60,30)']
            ],
            opacity: 0.85,
            contours: { z: { show: true, usecolormap: true } },
            showscale: false,
            hovertemplate: 'Gewicht 1: %{x:.3f}<br>Gewicht 2: %{y:.3f}<br>Loss: %{z:.4f}<extra></extra>'
        };

        var traces = [surface];

        if (pw.length > 1) {
            traces.push({
                type: 'scatter3d', mode: 'lines+markers',
                x: pw, y: pb, z: pz,
                line: { color: '#ffffff', width: 4 },
                marker: { size: 2, color: '#ffffff', opacity: 0.5 },
                name: 'Optimierungspfad'
            });
            traces.push({
                type: 'scatter3d', mode: 'markers',
                x: [pw[0]], y: [pb[0]], z: [pz[0]],
                marker: { size: 8, color: '#2ecc71', symbol: 'diamond' },
                name: 'Start'
            });
        }

        var cl = 0;
        for (var ii = 0; ii < IMG_DATA.length; ii++) {
            var feat = IMG_DATA[ii].features, tgt = IMG_DATA[ii].labelIdx;
            var h = [];
            for (var hh = 0; hh < NH; hh++) {
                var sum = s.b1[hh];
                for (var ff = 0; ff < NI; ff++) sum += feat[ff] * s.W1[ff][hh];
                h.push(Math.max(0, sum));
            }
            var o = [];
            for (var kk = 0; kk < NO; kk++) {
                var sum = s.b2[kk];
                for (var hh = 0; hh < NH; hh++) sum += h[hh] * s.W2[hh][kk];
                o.push(sum);
            }
            var mx = Math.max(o[0], o[1]);
            var es = Math.exp(o[0]-mx) + Math.exp(o[1]-mx);
            o[0] = Math.exp(o[0]-mx)/es; o[1] = Math.exp(o[1]-mx)/es;
            var ta = tgt === 0 ? [1,0] : [0,1];
            cl += -(ta[0]*Math.log(Math.max(o[0],1e-8)) + ta[1]*Math.log(Math.max(o[1],1e-8)));
        }
        cl = cl / IMG_DATA.length;

        traces.push({
            type: 'scatter3d', mode: 'markers',
            x: [cw1], y: [cw2], z: [cl + 0.005],
            marker: { size: 12, color: '#ef4444', symbol: 'circle', line: { color: '#fff', width: 2 } },
            name: 'Aktuell'
        });

        var dm = typeof is_dark_mode !== 'undefined' && is_dark_mode;

        // Camera: use user's saved camera if they interacted, else default
        var camera = s.userInteracted && s.plotCamera
            ? s.plotCamera
            : { eye: { x: 0.6, y: 2.2, z: 0.4 } };

        var layout = {
            scene: {
                xaxis: { title: 'Gewicht 1', color: dm ? '#aaa' : '#444', gridcolor: dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                yaxis: { title: 'Gewicht 2', color: dm ? '#aaa' : '#444', gridcolor: dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                zaxis: { title: 'Loss', color: dm ? '#aaa' : '#444', gridcolor: dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', rangemode: 'tozero' },
                bgcolor: dm ? '#0d0d1a' : '#fff',
                camera: camera
            },
            paper_bgcolor: dm ? '#0d0d1a' : '#fff',
            margin: { l: 0, r: 0, t: 0, b: 0 },
            showlegend: false,
            dragmode: 'turntable'
        };

        var config = { responsive: true, displaylogo: false, scrollZoom: true };
        if (!s.plotInitialized) {
            Plotly.newPlot(div, traces, layout, config).then(function() {
                s.plotInitialized = true;
                // Save initial camera
                try { s.plotCamera = div._fullLayout.scene.camera; } catch(e) {}
            });
        } else {
            Plotly.react(div, traces, layout, config);
        }
    }

    // ============================================================
    // IMAGE NAVIGATION
    // ============================================================
    function goToImage(idx) {
        s.idx = ((idx % IMG_DATA.length) + IMG_DATA.length) % IMG_DATA.length;
        var data = IMG_DATA[s.idx];
        if (data.features) {
            fwd(data.features);
            bwd(data.labelIdx);
            s.phase = 0; s.phaseT = 0; s.lastTime = 0;
        }
    }

    function nextImage() {
        goToImage(s.idx + 1);
    }

    function prevImage() {
        goToImage(s.idx - 1);
    }

    // Arrow key handler (only on training slide)
    function handleKeydown(e) {
        if (!isOnTrainingSlide()) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            nextImage();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            prevImage();
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
            if (data.features) {
                fwd(data.features);
                bwd(data.labelIdx);
            }
            s.phase = 1; s.phaseT = 0;
        }

        if (s.phase === 1 && s.phaseT > 1.6) { s.phase = 2; s.phaseT = 0; }
        if (s.phase === 2 && s.phaseT > 1.0) { s.phase = 3; s.phaseT = 0; }
        if (s.phase === 3 && s.phaseT > 1.8) {
            upd(0.3);
            s.lossHist.push(s.loss);
            s.posHist.push({ w1: s.W1[0][0], w2: s.W1[2][0] });
            s.step++;
            s.phase = 4; s.phaseT = 0;
        }
        if (s.phase === 4 && s.phaseT > 0.6) { s.phase = 5; s.phaseT = 0; }
        if (s.phase === 5 && s.phaseT > 0.3) {
            s.idx = (s.idx + 1) % IMG_DATA.length;
            s.phase = 0; s.phaseT = 0;
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
        canvas.height = 460;
        initNet();
        preloadImages(function() {
            var data = IMG_DATA[s.idx];
            if (data.features) { fwd(data.features); bwd(data.labelIdx); }
            draw();
            updatePlot();
        });
        draw();
        document.addEventListener('keydown', handleKeydown, true);
    }

    function start() {
        if (!document.getElementById('training-network-canvas')) return;
        s.running = true;
        s.phase = 0; s.phaseT = 0; s.lastTime = 0;
        tick();
        if (s.plotTimer) clearInterval(s.plotTimer);
        s.plotTimer = setInterval(function() {
            if (s.running && isOnTrainingSlide()) {
                // If user interacted, save camera before update
                if (s.plotInitialized) {
                    var div = document.getElementById('training-loss-landscape');
                    if (div && div._fullLayout && div._fullLayout.scene) {
                        try { s.plotCamera = div._fullLayout.scene.camera; } catch(e) {}
                    }
                }
                updatePlot();
            }
        }, 1500);
    }

    function stop() {
        s.running = false;
        if (s.animId) { cancelAnimationFrame(s.animId); s.animId = null; }
        if (s.plotTimer) { clearInterval(s.plotTimer); s.plotTimer = null; }
        document.removeEventListener('keydown', handleKeydown, true);
    }

    function reset() {
        stop();
        initNet();
        s.idx = 0; s.phase = 0; s.phaseT = 0; s.lastTime = 0;
        s.lossHist = []; s.posHist = []; s.plotInitialized = false;
        s.plotCamera = null; s.userInteracted = false;
        var canvas = document.getElementById('training-network-canvas');
        if (canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (IMG_DATA[0] && IMG_DATA[0].features) {
            fwd(IMG_DATA[0].features);
            bwd(IMG_DATA[0].labelIdx);
        }
        document.removeEventListener('keydown', handleKeydown, true);
    }

    return { init: init, start: start, stop: stop, reset: reset, isOnTrainingSlide: isOnTrainingSlide };
})();
