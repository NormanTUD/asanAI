"use strict";

// ============================================================
// WEIGHT ANALYSIS - "Ist das Modell trainiert?"
// ============================================================

var WeightAnalysis = (function() {

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    function _getWeightsFromModel(m) {
        if (!m) m = (typeof model !== "undefined") ? model : null;
        if (!m || !m.getWeights) return null;

        var weights = [];
        try {
            var rawWeights = m.getWeights();
            for (var i = 0; i < rawWeights.length; i++) {
                if (!rawWeights[i].isDisposed) {
                    weights.push({
                        name: m.weights[i] ? m.weights[i].name : "weight_" + i,
                        shape: rawWeights[i].shape,
                        data: rawWeights[i].dataSync()
                    });
                }
            }
        } catch (e) {
            console.warn("[WeightAnalysis] Could not get weights:", e);
            return null;
        }
        return weights;
    }

    function _computeStats(arr) {
        if (!arr || arr.length === 0) return null;
        var min = Infinity, max = -Infinity, sum = 0, sumSq = 0;
        var zeros = 0, nanCount = 0, infCount = 0;

        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            if (isNaN(v)) { nanCount++; continue; }
            if (!isFinite(v)) { infCount++; continue; }
            if (v < min) min = v;
            if (v > max) max = v;
            sum += v;
            sumSq += v * v;
            if (v === 0) zeros++;
        }

        var n = arr.length - nanCount - infCount;
        var mean = n > 0 ? sum / n : 0;
        var variance = n > 1 ? (sumSq / n) - (mean * mean) : 0;
        var std = Math.sqrt(Math.max(0, variance));

        // Kurtosis (excess)
        var kurtosis = 0;
        var skewness = 0;
        if (n > 2 && std > 0) {
            var sumCubed = 0, sumFourth = 0;
            for (var i = 0; i < arr.length; i++) {
                var v = arr[i];
                if (isNaN(v) || !isFinite(v)) continue;
                var diff = v - mean;
                sumCubed += diff * diff * diff;
                sumFourth += diff * diff * diff * diff;
            }
            skewness = (sumCubed / n) / (std * std * std);
            kurtosis = ((sumFourth / n) / (std * std * std * std)) - 3;
        }

        return {
            count: arr.length, min: min, max: max, mean: mean, std: std,
            variance: variance, zeros: zeros, nanCount: nanCount, infCount: infCount,
            zeroFraction: arr.length > 0 ? zeros / arr.length : 0,
            kurtosis: kurtosis, skewness: skewness,
            range: (max !== -Infinity && min !== Infinity) ? max - min : 0
        };
    }

    function _computeHistogram(arr, bins) {
        bins = bins || 50;
        if (!arr || arr.length === 0) return null;

        var min = Infinity, max = -Infinity;
        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            if (isNaN(v) || !isFinite(v)) continue;
            if (v < min) min = v;
            if (v > max) max = v;
        }

        if (min === max) return { binEdges: [min, min], counts: [arr.length], min: min, max: max, binWidth: 0 };

        var binWidth = (max - min) / bins;
        var counts = new Array(bins).fill(0);
        var binEdges = [];
        for (var b = 0; b <= bins; b++) binEdges.push(min + b * binWidth);

        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            if (isNaN(v) || !isFinite(v)) continue;
            var idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
            counts[idx]++;
        }

        return { binEdges: binEdges, counts: counts, min: min, max: max, binWidth: binWidth };
    }

    // ============================================================
    // ENTROPY ANALYSIS
    // ============================================================

    function _computeEntropy(arr, bins) {
        bins = bins || 50;
        var hist = _computeHistogram(arr, bins);
        if (!hist || !hist.counts) return 0;

        var total = 0;
        for (var i = 0; i < hist.counts.length; i++) total += hist.counts[i];
        if (total === 0) return 0;

        var entropy = 0;
        for (var i = 0; i < hist.counts.length; i++) {
            if (hist.counts[i] > 0) {
                var p = hist.counts[i] / total;
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    // ============================================================
    // SPARSITY ANALYSIS
    // ============================================================

    function _computeSparsity(arr, threshold) {
        threshold = threshold || 1e-5;
        if (!arr || arr.length === 0) return 0;
        var nearZero = 0;
        for (var i = 0; i < arr.length; i++) {
            if (Math.abs(arr[i]) < threshold) nearZero++;
        }
        return nearZero / arr.length;
    }

    // ============================================================
    // SVD SPECTRUM (approximation via sorted singular-value-like magnitudes)
    // For a full SVD we'd need a library, so we approximate by computing
    // the sorted absolute values of the flattened weight matrix
    // and checking how steep the decay is.
    // ============================================================

    function _computeSVDSteepness(arr) {
        if (!arr || arr.length < 4) return 0;
        // Sort absolute values descending
        var sorted = [];
        for (var i = 0; i < arr.length; i++) {
            if (!isNaN(arr[i]) && isFinite(arr[i])) {
                sorted.push(Math.abs(arr[i]));
            }
        }
        sorted.sort(function(a, b) { return b - a; });

        if (sorted.length < 4) return 0;

        // Compute ratio of top 10% energy vs total energy
        var topN = Math.max(1, Math.floor(sorted.length * 0.1));
        var topEnergy = 0, totalEnergy = 0;
        for (var i = 0; i < sorted.length; i++) {
            totalEnergy += sorted[i] * sorted[i];
            if (i < topN) topEnergy += sorted[i] * sorted[i];
        }

        if (totalEnergy === 0) return 0;
        return topEnergy / totalEnergy; // Higher = more concentrated = more trained
    }

    // ============================================================
    // BIAS ANALYSIS (non-zero biases indicate training)
    // ============================================================

    function _analyzeBiases(weights) {
        var biasNonZeroCount = 0;
        var biasTotal = 0;

        for (var i = 0; i < weights.length; i++) {
            if (weights[i].name.toLowerCase().includes("bias")) {
                var data = weights[i].data;
                for (var j = 0; j < data.length; j++) {
                    biasTotal++;
                    if (Math.abs(data[j]) > 1e-6) biasNonZeroCount++;
                }
            }
        }

        if (biasTotal === 0) return 0.5; // No biases, neutral
        return biasNonZeroCount / biasTotal;
    }

    // ============================================================
    // INTER-FILTER CORRELATION
    // ============================================================

    function _computeCorrelation(arr1, arr2) {
        if (arr1.length !== arr2.length || arr1.length === 0) return 0;
        var n = arr1.length;
        var sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, sumProd = 0;
        for (var i = 0; i < n; i++) {
            sum1 += arr1[i];
            sum2 += arr2[i];
            sum1Sq += arr1[i] * arr1[i];
            sum2Sq += arr2[i] * arr2[i];
            sumProd += arr1[i] * arr2[i];
        }
        var num = sumProd - (sum1 * sum2 / n);
        var den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
        if (den === 0) return 0;
        return Math.abs(num / den);
    }

    function _computeAvgInterFilterCorrelation(weightData, shape) {
        // Only for conv layers with shape [kH, kW, inC, outC] or dense [in, out]
        if (!shape || shape.length < 2) return 0;

        var lastDim = shape[shape.length - 1];
        if (lastDim < 2) return 0;

        var filterSize = weightData.length / lastDim;
        if (filterSize < 1) return 0;

        // Extract filters
        var filters = [];
        for (var f = 0; f < lastDim; f++) {
            var filter = [];
            for (var j = 0; j < filterSize; j++) {
                filter.push(weightData[j * lastDim + f]);
            }
            filters.push(filter);
        }

        // Compute average pairwise correlation (sample max 20 pairs)
        var totalCorr = 0;
        var pairs = 0;
        var maxPairs = Math.min(20, lastDim * (lastDim - 1) / 2);
        for (var a = 0; a < lastDim && pairs < maxPairs; a++) {
            for (var b = a + 1; b < lastDim && pairs < maxPairs; b++) {
                totalCorr += _computeCorrelation(filters[a], filters[b]);
                pairs++;
            }
        }

        return pairs > 0 ? totalCorr / pairs : 0;
    }

    // ============================================================
    // KOLMOGOROV-SMIRNOV TEST (simplified) against uniform/normal
    // ============================================================

    function _ksTestAgainstNormal(arr, mean, std) {
        if (!arr || arr.length < 10 || std === 0) return 0;
        var sorted = arr.slice().filter(function(v) { return !isNaN(v) && isFinite(v); });
        sorted.sort(function(a, b) { return a - b; });
        var n = sorted.length;
        var maxD = 0;

        for (var i = 0; i < n; i++) {
            var empirical = (i + 1) / n;
            var z = (sorted[i] - mean) / std;
            var theoretical = 0.5 * (1 + _erf(z / Math.sqrt(2)));
            var d = Math.abs(empirical - theoretical);
            if (d > maxD) maxD = d;
        }
        return maxD; // Higher = more different from normal = more likely trained
    }

    function _erf(x) {
        var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        var a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        var sign = x < 0 ? -1 : 1;
        x = Math.abs(x);
        var t = 1.0 / (1.0 + p * x);
        var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    // ============================================================
    // MAIN ANALYSIS FUNCTION
    // ============================================================

    function analyzeModel(m) {
        var weights = _getWeightsFromModel(m);
        if (!weights || weights.length === 0) {
            return { score: 0, confidence: 0, message: "No weights found", layers: [] };
        }

        var layerResults = [];
        var totalScore = 0;
        var totalWeight = 0;

        for (var i = 0; i < weights.length; i++) {
            var w = weights[i];
            var data = w.data;
            var stats = _computeStats(data);
            if (!stats) continue;

            var layerScore = 0;
            var indicators = {};

            // 1. Entropy (high entropy = more random)
            var entropy = _computeEntropy(data, 50);
            var maxEntropy = Math.log2(50); // max possible with 50 bins
            var entropyRatio = entropy / maxEntropy;
            // Trained models have LOWER entropy (more structured)
            var entropyScore = (1 - entropyRatio) * 100;
            indicators.entropy = { value: entropy, maxEntropy: maxEntropy, ratio: entropyRatio, score: entropyScore };

            // 2. Sparsity (trained models often have more near-zero weights)
            var sparsity = _computeSparsity(data, 0.01);
            var sparsityScore = Math.min(sparsity * 150, 100); // More sparsity = more trained
            indicators.sparsity = { value: sparsity, score: sparsityScore };

            // 3. SVD steepness (trained = concentrated energy)
            var svdSteepness = _computeSVDSteepness(data);
            var svdScore = Math.min(svdSteepness * 120, 100);
            indicators.svd = { steepness: svdSteepness, score: svdScore };

            // 4. Kurtosis (trained weights often have higher kurtosis)
            var kurtosisScore = Math.min(Math.abs(stats.kurtosis) * 10, 100);
            indicators.kurtosis = { value: stats.kurtosis, score: kurtosisScore };

            // 5. KS-test against expected initializer distribution
            var ksD = _ksTestAgainstNormal(Array.from(data), 0, stats.std);
            var ksScore = Math.min(ksD * 300, 100);
            indicators.ksTest = { d: ksD, score: ksScore };

            // 6. Inter-filter correlation
            var correlation = _computeAvgInterFilterCorrelation(data, w.shape);
            var corrScore = Math.min(correlation * 200, 100);
            indicators.correlation = { value: correlation, score: corrScore };

            // Weighted combination
            layerScore = (
                entropyScore * 0.15 +
                sparsityScore * 0.15 +
                svdScore * 0.25 +
                kurtosisScore * 0.15 +
                ksScore * 0.20 +
                corrScore * 0.10
            );

            layerScore = Math.max(0, Math.min(100, layerScore));

            var layerWeight = data.length; // Weight by number of parameters
            totalScore += layerScore * layerWeight;
            totalWeight += layerWeight;

            layerResults.push({
                name: w.name,
                shape: w.shape,
                paramCount: data.length,
                stats: stats,
                indicators: indicators,
                score: layerScore,
                histogram: _computeHistogram(data, 40)
            });
        }

        // Bias analysis
        var biasScore = _analyzeBiases(weights) * 100;

        // Final score
        var rawScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        // Mix in bias score
        var finalScore = rawScore * 0.85 + biasScore * 0.15;
        finalScore = Math.max(0, Math.min(100, finalScore));

        // Confidence based on number of parameters
        var totalParams = 0;
        for (var i = 0; i < weights.length; i++) totalParams += weights[i].data.length;
        var confidence = Math.min(100, Math.log10(totalParams + 1) * 25);

        var message = "";
        if (finalScore > 75) message = "Das Modell ist sehr wahrscheinlich trainiert.";
        else if (finalScore > 50) message = "Das Modell zeigt Anzeichen von Training.";
        else if (finalScore > 30) message = "Das Modell könnte leicht trainiert sein oder hat spezielle Initialisierung.";
        else message = "Das Modell scheint nicht trainiert zu sein (random weights).";

        return {
            score: Math.round(finalScore),
            confidence: Math.round(confidence),
            message: message,
            biasScore: Math.round(biasScore),
            layers: layerResults,
            totalParams: totalParams
        };
    }

    // ============================================================
    // RENDERING
    // ============================================================

    function _histogramSVG(histogram, title) {
        if (!histogram || !histogram.counts || histogram.binWidth === 0) return "";
        var width = 300, height = 60;
        var maxCount = Math.max.apply(null, histogram.counts) || 1;
        var barWidth = width / histogram.counts.length;

        var svg = "<svg width='100%' viewBox='0 0 " + width + " " + (height + 16) + "' style='display:block; max-width:400px;'>";

        for (var i = 0; i < histogram.counts.length; i++) {
            var barHeight = (histogram.counts[i] / maxCount) * height;
            var x = i * barWidth;
            var y = height - barHeight;
            var binCenter = histogram.binEdges[i] + histogram.binWidth / 2;

            var color = binCenter < 0 ? "#3498db" : "#2ecc71";
            if (Math.abs(binCenter) < histogram.binWidth) color = "#e74c3c";

            svg += "<rect x='" + x + "' y='" + y + "' width='" + Math.max(barWidth - 0.5, 0.5) +
                "' height='" + barHeight + "' fill='" + color + "' opacity='0.8'/>";
        }

        // Zero line
        if (histogram.min < 0 && histogram.max > 0) {
            var zeroX = ((0 - histogram.min) / (histogram.max - histogram.min)) * width;
            svg += "<line x1='" + zeroX + "' y1='0' x2='" + zeroX + "' y2='" + height + "' stroke='#333' stroke-width='0.5' stroke-dasharray='2,2' opacity='0.5'/>";
        }

        svg += "<text x='2' y='" + (height + 12) + "' font-size='8' fill='currentColor' opacity='0.5'>" + histogram.min.toFixed(3) + "</text>";
        svg += "<text x='" + (width - 40) + "' y='" + (height + 12) + "' font-size='8' fill='currentColor' opacity='0.5'>" + histogram.max.toFixed(3) + "</text>";

        svg += "</svg>";
        return svg;
    }

    function _scoreGauge(score, size) {
        size = size || 120;
        var radius = size / 2 - 10;
        var cx = size / 2, cy = size / 2;
        var circumference = 2 * Math.PI * radius;
        var offset = circumference * (1 - score / 100);

        var color = score > 75 ? "#2ecc71" : score > 50 ? "#f39c12" : score > 30 ? "#e67e22" : "#e74c3c";

        var svg = "<svg width='" + size + "' height='" + size + "' viewBox='0 0 " + size + " " + size + "'>";
        svg += "<circle cx='" + cx + "' cy='" + cy + "' r='" + radius + "' fill='none' stroke='rgba(128,128,128,0.2)' stroke-width='8'/>";
        svg += "<circle cx='" + cx + "' cy='" + cy + "' r='" + radius + "' fill='none' stroke='" + color + "' stroke-width='8' " +
            "stroke-dasharray='" + circumference + "' stroke-dashoffset='" + offset + "' " +
            "transform='rotate(-90 " + cx + " " + cy + ")' stroke-linecap='round'/>";
        svg += "<text x='" + cx + "' y='" + (cy + 8) + "' text-anchor='middle' font-size='24' font-weight='bold' fill='" + color + "'>" + score + "%</text>";
        svg += "</svg>";
        return svg;
    }

    function _indicatorBar(label, score, detail) {
        var color = score > 70 ? "#2ecc71" : score > 40 ? "#f39c12" : "#e74c3c";
        var html = "<div style='margin: 6px 0;'>";
        html += "<div style='display:flex; justify-content:space-between; font-size:0.85em;'>";
        html += "<span>" + label + "</span>";
        html += "<span style='opacity:0.6;'>" + detail + "</span>";
        html += "</div>";
        html += "<div style='height:6px; background:rgba(128,128,128,0.15); border-radius:3px; overflow:hidden;'>";
        html += "<div style='height:100%; width:" + Math.max(0, Math.min(100, score)) + "%; background:" + color + "; border-radius:3px; transition:width 0.5s;'></div>";
        html += "</div></div>";
        return html;
    }

    function render(divOrId) {
        var container;

        if (typeof divOrId === "string" && divOrId !== "") {
            container = document.getElementById(divOrId);
        } else if (divOrId instanceof HTMLElement) {
            container = divOrId;
        }

        if (!container) {
            container = document.createElement("div");
            container.id = "weight_analysis_container";
            document.body.appendChild(container);
        }

        // Inject styles
        if (!document.getElementById("weight_analysis_styles")) {
            var style = document.createElement("style");
            style.id = "weight_analysis_styles";
            style.textContent = `
                .wa_container { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                .wa_header { display: flex; align-items: center; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
                .wa_message { font-size: 1.1em; font-weight: 500; margin-top: 8px; }
                .wa_confidence { font-size: 0.85em; opacity: 0.6; margin-top: 4px; }
                .wa_layer_card { border: 2px solid rgba(128,128,128,0.2); border-radius: 10px; padding: 16px; margin: 12px 0; background: rgba(128,128,128,0.03); }
                .wa_layer_card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
                .wa_layer_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .wa_layer_name { font-weight: 600; font-size: 0.95em; }
                .wa_layer_score { font-size: 0.85em; font-weight: bold; padding: 2px 10px; border-radius: 12px; }
                .wa_layer_score_high { background: rgba(46,204,113,0.15); color: #27ae60; }
                .wa_layer_score_mid { background: rgba(243,156,18,0.15); color: #e67e22; }
                .wa_layer_score_low { background: rgba(231,76,60,0.15); color: #c0392b; }
                .wa_indicators { margin-top: 10px; }
                .wa_grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
                @media (max-width: 600px) { .wa_grid { grid-template-columns: 1fr; } }
                .wa_stats_mini { font-size: 0.78em; opacity: 0.6; font-family: monospace; margin-top: 6px; }
                .wa_comparison { margin-top: 24px; padding: 16px; border-radius: 10px; background: rgba(52,152,219,0.05); border: 2px solid rgba(52,152,219,0.2); }
                .wa_comparison h3 { margin: 0 0 12px 0; }
                .wa_no_model { padding: 40px; text-align: center; opacity: 0.6; font-size: 1.1em; }
            `;
            document.head.appendChild(style);
        }

        // Run analysis
        var m = (typeof model !== "undefined") ? model : null;
        if (!m || !m.getWeights) {
            container.innerHTML = "<div class='wa_container'><div class='wa_no_model'>⚠️ Kein Modell geladen. Bitte erstelle oder lade zuerst ein Modell.</div></div>";
            return container;
        }

        var result = analyzeModel(m);

        if (!result || result.layers.length === 0) {
            container.innerHTML = "<div class='wa_container'><div class='wa_no_model'>⚠️ Keine Gewichte im Modell gefunden.</div></div>";
            return container;
        }

        var html = "<div class='wa_container'>";

        // Header with gauge
        html += "<h2>🔬 Weight Analysis – Ist das Modell trainiert?</h2>";
        html += "<div class='wa_header'>";
        html += _scoreGauge(result.score, 140);
        html += "<div>";
        html += "<div class='wa_message'>" + result.message + "</div>";
        html += "<div class='wa_confidence'>Konfidenz: " + result.confidence + "% (basierend auf " + result.totalParams.toLocaleString() + " Parametern)</div>";
        html += "<div style='margin-top:8px; font-size:0.85em; opacity:0.7;'>Bias-Score: " + result.biasScore + "% (nicht-null Biases deuten auf Training hin)</div>";
        html += "</div></div>";

        // Overall indicators
        html += "<div class='wa_comparison'>";
        html += "<h3>📊 Gesamtübersicht der Indikatoren</h3>";

        // Aggregate indicators across layers
        var avgEntropy = 0, avgSparsity = 0, avgSVD = 0, avgKurtosis = 0, avgKS = 0, avgCorr = 0;
        for (var i = 0; i < result.layers.length; i++) {
            var ind = result.layers[i].indicators;
            avgEntropy += ind.entropy.score;
            avgSparsity += ind.sparsity.score;
            avgSVD += ind.svd.score;
            avgKurtosis += ind.kurtosis.score;
            avgKS += ind.ksTest.score;
            avgCorr += ind.correlation.score;
        }
        var nLayers = result.layers.length;
        avgEntropy /= nLayers; avgSparsity /= nLayers; avgSVD /= nLayers;
        avgKurtosis /= nLayers; avgKS /= nLayers; avgCorr /= nLayers;

        html += _indicatorBar("Entropie (niedrig = strukturiert)", avgEntropy, avgEntropy.toFixed(1) + "%");
        html += _indicatorBar("Sparsity (viele near-zero Werte)", avgSparsity, avgSparsity.toFixed(1) + "%");
        html += _indicatorBar("SVD Energiekonzentration", avgSVD, avgSVD.toFixed(1) + "%");
        html += _indicatorBar("Kurtosis (schwere Tails)", avgKurtosis, avgKurtosis.toFixed(1) + "%");
        html += _indicatorBar("KS-Test vs. Normal (Abweichung)", avgKS, avgKS.toFixed(1) + "%");
        html += _indicatorBar("Inter-Filter Korrelation", avgCorr, avgCorr.toFixed(1) + "%");

        html += "</div>";

        // Per-layer details
        html += "<h3 style='margin-top:24px;'>📋 Analyse pro Layer</h3>";

        for (var i = 0; i < result.layers.length; i++) {
            var layer = result.layers[i];
            var scoreClass = layer.score > 60 ? "wa_layer_score_high" : layer.score > 35 ? "wa_layer_score_mid" : "wa_layer_score_low";

            html += "<div class='wa_layer_card'>";
            html += "<div class='wa_layer_header'>";
            html += "<span class='wa_layer_name'>" + layer.name + " <span style='opacity:0.5; font-weight:normal;'>[" + layer.shape.join("×") + "] (" + layer.paramCount.toLocaleString() + " params)</span></span>";
            html += "<span class='wa_layer_score " + scoreClass + "'>" + Math.round(layer.score) + "% trainiert</span>";
            html += "</div>";

            // Indicators
            html += "<div class='wa_indicators'>";
            var ind = layer.indicators;
            html += _indicatorBar("Entropie", ind.entropy.score, "H=" + ind.entropy.value.toFixed(3) + " / " + ind.entropy.maxEntropy.toFixed(3));
            html += _indicatorBar("Sparsity", ind.sparsity.score, (ind.sparsity.value * 100).toFixed(1) + "% near-zero");
            html += _indicatorBar("Sparsity", ind.sparsity.score, (ind.sparsity.value * 100).toFixed(1) + "% near-zero");
            html += _indicatorBar("SVD Energie", ind.svd.score, "Steepness: " + ind.svd.steepness.toFixed(3));
            html += _indicatorBar("Kurtosis", ind.kurtosis.score, "k=" + ind.kurtosis.value.toFixed(3));
            html += _indicatorBar("KS-Test vs. Normal", ind.ksTest.score, "D=" + ind.ksTest.d.toFixed(4));
            html += _indicatorBar("Inter-Filter Korrelation", ind.correlation.score, "r=" + ind.correlation.value.toFixed(4));
            html += "</div>";

            // Histogram
            html += "<div style='margin-top:10px;'>";
            html += "<div style='font-size:0.8em; opacity:0.6; margin-bottom:4px;'>Weight-Verteilung:</div>";
            html += _histogramSVG(layer.histogram, layer.name);
            html += "</div>";

            // Mini stats
            html += "<div class='wa_stats_mini'>";
            html += "mean=" + layer.stats.mean.toFixed(5) + " | std=" + layer.stats.std.toFixed(5);
            html += " | min=" + layer.stats.min.toFixed(4) + " | max=" + layer.stats.max.toFixed(4);
            html += " | zeros=" + layer.stats.zeros + " | NaN=" + layer.stats.nanCount + " | Inf=" + layer.stats.infCount;
            html += "</div>";

            html += "</div>"; // wa_layer_card
        }

        // Comparison section: Random vs. Trained
        html += "<div class='wa_comparison' style='margin-top:24px;'>";
        html += "<h3>🔍 Vergleich: Random vs. Trainiert</h3>";
        html += "<div class='wa_grid'>";
        html += "<div><strong>Random Weights:</strong><ul style='font-size:0.85em; opacity:0.8;'>";
        html += "<li>Gleichmäßige Verteilung (hohe Entropie)</li>";
        html += "<li>Keine Sparsity (wenig near-zero)</li>";
        html += "<li>Flaches SVD-Spektrum</li>";
        html += "<li>Kurtosis ≈ 0 (Normalverteilung)</li>";
        html += "<li>Keine Inter-Filter Korrelation</li>";
        html += "<li>Biases = 0</li>";
        html += "</ul></div>";
        html += "<div><strong>Trainierte Weights:</strong><ul style='font-size:0.85em; opacity:0.8;'>";
        html += "<li>Strukturierte Verteilung (niedrige Entropie)</li>";
        html += "<li>Hohe Sparsity (viele near-zero Werte)</li>";
        html += "<li>Steiles SVD-Spektrum (Energiekonzentration)</li>";
        html += "<li>Hohe Kurtosis (schwere Tails)</li>";
        html += "<li>Korrelierte Filter</li>";
        html += "<li>Biases ≠ 0</li>";
        html += "</ul></div>";
        html += "</div></div>";

        html += "</div>"; // wa_container

        container.innerHTML = html;

        return container;
    }

    // ============================================================
    // AUTO-REFRESH (optional)
    // ============================================================

    var _autoRefreshInterval = null;

    function startAutoRefresh(divOrId, intervalMs) {
        intervalMs = intervalMs || 5000;
        stopAutoRefresh();
        _autoRefreshInterval = setInterval(function() {
            try {
                render(divOrId);
            } catch (e) {
                console.warn("[WeightAnalysis] Auto-refresh error:", e);
            }
        }, intervalMs);
    }

    function stopAutoRefresh() {
        if (_autoRefreshInterval) {
            clearInterval(_autoRefreshInterval);
            _autoRefreshInterval = null;
        }
    }

    // ============================================================
    // DEAD NEURON DETECTOR
    // ============================================================

    function detectDeadNeurons(m) {
        var weights = _getWeightsFromModel(m);
        if (!weights || weights.length === 0) return [];

        var deadNeurons = [];

        for (var i = 0; i < weights.length; i++) {
            var w = weights[i];
            if (!w.name.toLowerCase().includes("kernel")) continue;

            var data = w.data;
            var shape = w.shape;
            if (shape.length < 2) continue;

            var lastDim = shape[shape.length - 1];
            var filterSize = data.length / lastDim;

            for (var f = 0; f < lastDim; f++) {
                var allZero = true;
                var sumAbs = 0;
                for (var j = 0; j < filterSize; j++) {
                    var val = data[j * lastDim + f];
                    if (Math.abs(val) > 1e-7) {
                        allZero = false;
                    }
                    sumAbs += Math.abs(val);
                }

                if (allZero) {
                    deadNeurons.push({ layer: w.name, neuron: f, type: "dead", magnitude: 0 });
                } else if (sumAbs / filterSize < 1e-6) {
                    deadNeurons.push({ layer: w.name, neuron: f, type: "nearly_dead", magnitude: sumAbs / filterSize });
                }
            }
        }

        return deadNeurons;
    }

    // ============================================================
    // WEIGHT DRIFT (distance from initialization)
    // ============================================================

    var _initialWeightsSnapshot = null;

    function snapshotInitialWeights(m) {
        var weights = _getWeightsFromModel(m);
        if (!weights) return;
        _initialWeightsSnapshot = [];
        for (var i = 0; i < weights.length; i++) {
            _initialWeightsSnapshot.push({
                name: weights[i].name,
                data: new Float32Array(weights[i].data)
            });
        }
    }

    function computeWeightDrift(m) {
        if (!_initialWeightsSnapshot) return null;
        var weights = _getWeightsFromModel(m);
        if (!weights) return null;

        var drifts = [];
        for (var i = 0; i < Math.min(weights.length, _initialWeightsSnapshot.length); i++) {
            var current = weights[i].data;
            var initial = _initialWeightsSnapshot[i].data;
            if (current.length !== initial.length) continue;

            var l2Dist = 0;
            for (var j = 0; j < current.length; j++) {
                var diff = current[j] - initial[j];
                l2Dist += diff * diff;
            }
            l2Dist = Math.sqrt(l2Dist);

            var l2Init = 0;
            for (var j = 0; j < initial.length; j++) {
                l2Init += initial[j] * initial[j];
            }
            l2Init = Math.sqrt(l2Init);

            drifts.push({
                name: weights[i].name,
                l2Distance: l2Dist,
                relativeChange: l2Init > 0 ? l2Dist / l2Init : 0
            });
        }

        return drifts;
    }

    // ============================================================
    // MODEL COMPLEXITY ANALYZER
    // ============================================================

    function analyzeComplexity(m) {
        var weights = _getWeightsFromModel(m);
        if (!weights) return null;

        var totalParams = 0;
        var trainableParams = 0;

        for (var i = 0; i < weights.length; i++) {
            totalParams += weights[i].data.length;
            trainableParams += weights[i].data.length; // Simplified
        }

        return {
            totalParams: totalParams,
            trainableParams: trainableParams,
            layerCount: weights.length,
            paramsPerLayer: totalParams / Math.max(1, weights.length),
            memoryMB: (totalParams * 4) / (1024 * 1024) // float32 = 4 bytes
        };
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    return {
        analyzeModel: analyzeModel,
        render: render,
        startAutoRefresh: startAutoRefresh,
        stopAutoRefresh: stopAutoRefresh,
        detectDeadNeurons: detectDeadNeurons,
        snapshotInitialWeights: snapshotInitialWeights,
        computeWeightDrift: computeWeightDrift,
        analyzeComplexity: analyzeComplexity
    };

})();

// ============================================================
// AUTO-INIT: Automatically render when called without arguments
// ============================================================

(function() {
    // Auto-render on DOMContentLoaded if a target div exists
    if (typeof document !== "undefined") {
        var _autoInit = function() {
            var target = document.getElementById("weight_analysis");
            if (target) {
                WeightAnalysis.render(target);
            }
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", _autoInit);
        } else {
            // DOM already loaded, try after a short delay to ensure model is ready
            setTimeout(_autoInit, 1000);
        }
    }
})();
