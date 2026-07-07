// ============================================================
// WEIGHT ANALYSIS INDICATOR TOOLTIPS
// ============================================================

(function() {
    "use strict";

    // Inject tooltip styles once
    function _injectTooltipStyles() {
        if (document.getElementById("wa_tooltip_styles")) return;
        var style = document.createElement("style");
        style.id = "wa_tooltip_styles";
        style.textContent = `
            .wa_indicator_row {
                position: relative;
                cursor: help;
                padding: 6px 10px;
                border-radius: 6px;
                transition: background 0.2s;
            }
            .wa_indicator_row:hover {
                background: rgba(52, 152, 219, 0.08);
            }
            .wa_tooltip_overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                z-index: 99998;
                background: rgba(0,0,0,0.3);
                backdrop-filter: blur(2px);
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            }
            .wa_tooltip_overlay.wa_visible {
                opacity: 1;
                pointer-events: all;
            }
            .wa_tooltip_popup {
                position: fixed;
                z-index: 99999;
                background: var(--bg-color, #fff);
                border: 2px solid var(--border-color, #3498db);
                border-radius: 14px;
                padding: 20px 24px;
                max-width: 520px;
                min-width: 400px;
                box-shadow: 0 12px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1);
                opacity: 0;
                transform: scale(0.9) translateY(10px);
                transition: opacity 0.25s ease, transform 0.25s ease;
                pointer-events: none;
                overflow: hidden;
            }
            .wa_tooltip_popup.wa_visible {
                opacity: 1;
                transform: scale(1) translateY(0);
                pointer-events: all;
            }
            @media (prefers-color-scheme: dark) {
                .wa_tooltip_popup {
                    background: #1e1e2e;
                    border-color: #5dade2;
                    color: #e0e0e0;
                }
            }
            .wa_tooltip_popup h3 {
                margin: 0 0 10px 0;
                font-size: 1.05em;
                color: #2980b9;
            }
            @media (prefers-color-scheme: dark) {
                .wa_tooltip_popup h3 { color: #5dade2; }
            }
            .wa_tooltip_popup .wa_tt_desc {
                font-size: 0.88em;
                line-height: 1.5;
                margin-bottom: 14px;
                opacity: 0.85;
            }
            .wa_tooltip_popup .wa_tt_visual {
                margin: 12px 0;
                border-radius: 8px;
                overflow: hidden;
                background: rgba(128,128,128,0.04);
                border: 1px solid rgba(128,128,128,0.1);
                padding: 10px;
            }
            .wa_tooltip_popup .wa_tt_legend {
                display: flex;
                justify-content: space-between;
                font-size: 0.78em;
                margin-top: 8px;
                gap: 8px;
            }
            .wa_tooltip_popup .wa_tt_legend_item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .wa_tooltip_popup .wa_tt_legend_dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .wa_tooltip_popup .wa_tt_close {
                position: absolute;
                top: 8px;
                right: 12px;
                cursor: pointer;
                font-size: 1.3em;
                opacity: 0.5;
                transition: opacity 0.2s;
                background: none;
                border: none;
                color: inherit;
                padding: 4px 8px;
            }
            .wa_tooltip_popup .wa_tt_close:hover {
                opacity: 1;
            }
            .wa_tooltip_popup .wa_tt_scale {
                display: flex;
                align-items: center;
                margin: 10px 0 4px 0;
                gap: 0;
            }
            .wa_tooltip_popup .wa_tt_scale_bar {
                flex: 1;
                height: 8px;
                border-radius: 4px;
                position: relative;
            }
            .wa_tooltip_popup .wa_tt_scale_marker {
                position: absolute;
                top: -4px;
                width: 4px;
                height: 16px;
                background: #e74c3c;
                border-radius: 2px;
                transform: translateX(-50%);
                box-shadow: 0 0 4px rgba(231,76,60,0.5);
            }
            .wa_tooltip_popup .wa_tt_scale_labels {
                display: flex;
                justify-content: space-between;
                font-size: 0.72em;
                opacity: 0.6;
                margin-top: 2px;
            }
            .wa_tooltip_popup .wa_tt_stats_table {
                width: 100%;
                font-size: 0.82em;
                border-collapse: collapse;
                margin: 8px 0;
            }
            .wa_tooltip_popup .wa_tt_stats_table td {
                padding: 3px 6px;
                border-bottom: 1px solid rgba(128,128,128,0.1);
            }
            .wa_tooltip_popup .wa_tt_stats_table td:first-child {
                opacity: 0.7;
            }
            .wa_tooltip_popup .wa_tt_stats_table td:last-child {
                text-align: right;
                font-family: 'SF Mono', 'Fira Code', monospace;
                font-variant-numeric: tabular-nums;
            }
        `;
        document.head.appendChild(style);
    }

    // SVG generators for each indicator
    var _tooltipVisuals = {
        entropy: function(value, maxValue) {
            var pct = Math.min(1, value / maxValue);
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            svg += '<text x="5" y="12" font-size="9" fill="currentColor" opacity="0.6"><tspan class="TRANSLATEME_wa_tooltip_entropy_low"></tspan></text>';
            for (var i = 0; i < 40; i++) {
                var x = 5 + i * 3.2;
                var gauss = Math.exp(-Math.pow((i - 20) / 5, 2)) * 45;
                svg += '<rect x="' + x + '" y="' + (h - 5 - gauss) + '" width="2.5" height="' + gauss + '" fill="#2ecc71" opacity="0.7" rx="1"/>';
            }
            svg += '<text x="205" y="12" font-size="9" fill="currentColor" opacity="0.6"><tspan class="TRANSLATEME_wa_tooltip_entropy_high"></tspan></text>';
            for (var i = 0; i < 40; i++) {
                var x = 205 + i * 3.2;
                var flat = 15 + Math.random() * 10;
                svg += '<rect x="' + x + '" y="' + (h - 5 - flat) + '" width="2.5" height="' + flat + '" fill="#e74c3c" opacity="0.7" rx="1"/>';
            }
            svg += '</svg>';
            return svg;
        },

        sparsity: function(value) {
            var w = 380, h = 60;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            svg += '<text x="5" y="10" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_sparsity_low"></tspan></text>';
            for (var r = 0; r < 4; r++) {
                for (var c = 0; c < 12; c++) {
                    var val = 0.3 + Math.random() * 0.7;
                    var color = 'rgba(52,152,219,' + val.toFixed(2) + ')';
                    svg += '<rect x="' + (5 + c * 10) + '" y="' + (15 + r * 10) + '" width="8" height="8" fill="' + color + '" rx="1"/>';
                }
            }
            svg += '<text x="205" y="10" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_sparsity_high"></tspan></text>';
            for (var r = 0; r < 4; r++) {
                for (var c = 0; c < 12; c++) {
                    var isZero = Math.random() < 0.75;
                    var val = isZero ? 0.05 : (0.5 + Math.random() * 0.5);
                    var color = isZero ? 'rgba(128,128,128,0.1)' : 'rgba(46,204,113,' + val.toFixed(2) + ')';
                    svg += '<rect x="' + (205 + c * 10) + '" y="' + (15 + r * 10) + '" width="8" height="8" fill="' + color + '" rx="1"/>';
                }
            }
            svg += '</svg>';
            return svg;
        },

        svd: function(value) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            svg += '<text x="5" y="12" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_svd_flat"></tspan></text>';
            var flatPoints = [];
            for (var i = 0; i < 20; i++) {
                var x = 10 + i * 6;
                var y = 20 + Math.random() * 5;
                flatPoints.push(x + ',' + y);
            }
            svg += '<polyline points="' + flatPoints.join(' ') + '" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"/>';
            svg += '<line x1="10" y1="' + h + '" x2="130" y2="' + h + '" stroke="currentColor" opacity="0.2" stroke-width="0.5"/>';

            svg += '<text x="205" y="12" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_svd_steep"></tspan></text>';
            var steepPoints = [];
            for (var i = 0; i < 20; i++) {
                var x = 210 + i * 6;
                var y = 18 + (h - 25) * (1 - Math.exp(-i * 0.3));
                steepPoints.push(x + ',' + y.toFixed(1));
            }
            svg += '<polyline points="' + steepPoints.join(' ') + '" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round"/>';
            svg += '<polygon points="210,' + h + ' ' + steepPoints.join(' ') + ' 324,' + h + '" fill="#2ecc71" opacity="0.1"/>';

            svg += '</svg>';
            return svg;
        },

        kurtosis: function(value) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            svg += '<text x="5" y="12" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_kurtosis_zero"></tspan></text>';
            var normalPath = 'M';
            for (var i = 0; i <= 50; i++) {
                var t = (i / 50) * 6 - 3;
                var y = Math.exp(-t * t / 2) * 42;
                normalPath += (5 + i * 2.4) + ',' + (h - 5 - y) + ' ';
            }
            svg += '<path d="' + normalPath + '" fill="none" stroke="#e74c3c" stroke-width="2"/>';

            svg += '<text x="205" y="12" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_kurtosis_high"></tspan></text>';
            var heavyPath = 'M';
            for (var i = 0; i <= 50; i++) {
                var t = (i / 50) * 6 - 3;
                var y = (1 / (1 + t * t)) * 55;
                heavyPath += (205 + i * 2.4) + ',' + (h - 5 - y) + ' ';
            }
            svg += '<path d="' + heavyPath + '" fill="none" stroke="#2ecc71" stroke-width="2"/>';

            svg += '</svg>';
            return svg;
        },

        ks_test: function(value) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            svg += '<text x="120" y="12" font-size="8" fill="currentColor" opacity="0.5">CDF</text>';

            var normalCDF = [];
            for (var i = 0; i <= 40; i++) {
                var t = (i / 40) * 6 - 3;
                var cdf = 0.5 * (1 + _erf(t / Math.sqrt(2)));
                var x = 40 + i * 7;
                var y = h - 10 - cdf * (h - 20);
                normalCDF.push(x.toFixed(1) + ',' + y.toFixed(1));
            }
            svg += '<polyline points="' + normalCDF.join(' ') + '" fill="none" stroke="#3498db" stroke-width="1.5" stroke-dasharray="4,2"/>';

            var empiricalCDF = [];
            var deviation = Math.min(0.3, value * 2);
            for (var i = 0; i <= 40; i++) {
                var t = (i / 40) * 6 - 3;
                var cdf = 0.5 * (1 + _erf(t / Math.sqrt(2)));
                cdf = Math.max(0, Math.min(1, cdf + deviation * Math.sin(t * 1.5) * 0.3));
                var x = 40 + i * 7;
                var y = h - 10 - cdf * (h - 20);
                empiricalCDF.push(x.toFixed(1) + ',' + y.toFixed(1));
            }
            svg += '<polyline points="' + empiricalCDF.join(' ') + '" fill="none" stroke="#2ecc71" stroke-width="2"/>';

            svg += '<line x1="200" y1="25" x2="200" y2="45" stroke="#e74c3c" stroke-width="1.5"/>';
            svg += '<text x="205" y="38" font-size="9" fill="#e74c3c" font-weight="bold">D</text>';

            svg += '<text x="40" y="' + (h - 1) + '" font-size="7" fill="#3498db">--- Normal</text>';
            svg += '<text x="120" y="' + (h - 1) + '" font-size="7" fill="#2ecc71">\u2014 Empirisch</text>';

            svg += '</svg>';
            return svg;
        },

        correlation: function(value) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            svg += '<text x="5" y="10" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_correlation_low"></tspan></text>';
            for (var r = 0; r < 5; r++) {
                for (var c = 0; c < 5; c++) {
                    var val = (r === c) ? 0.9 : Math.random() * 0.15;
                    var intensity = Math.floor(val * 255);
                    svg += '<rect x="' + (15 + c * 12) + '" y="' + (14 + r * 10) + '" width="10" height="8" fill="rgb(' + intensity + ',' + Math.floor(intensity * 0.6) + ',0)" rx="1"/>';
                }
            }

            svg += '<text x="205" y="10" font-size="8" fill="currentColor" opacity="0.5"><tspan class="TRANSLATEME_wa_tooltip_correlation_high"></tspan></text>';
            for (var r = 0; r < 5; r++) {
                for (var c = 0; c < 5; c++) {
                    var val = (r === c) ? 0.95 : 0.3 + Math.random() * 0.5;
                    var intensity = Math.floor(val * 255);
                    svg += '<rect x="' + (215 + c * 12) + '" y="' + (14 + r * 10) + '" width="10" height="8" fill="rgb(' + intensity + ',' + Math.floor(intensity * 0.6) + ',0)" rx="1"/>';
                }
            }

            svg += '</svg>';
            return svg;
        },

        weight_distribution: function() {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            svg += '<text x="5" y="12" font-size="8" fill="currentColor" opacity="0.5">Untrained</text>';
            for (var i = 0; i < 30; i++) {
                var t = (i / 30) * 6 - 3;
                var barH = Math.exp(-t * t / 2) * 40;
                svg += '<rect x="' + (5 + i * 4.5) + '" y="' + (h - 5 - barH) + '" width="3.5" height="' + barH + '" fill="#e74c3c" opacity="0.6" rx="1"/>';
            }
            svg += '<text x="205" y="12" font-size="8" fill="currentColor" opacity="0.5">Trained</text>';
            for (var i = 0; i < 30; i++) {
                var t = (i / 30) * 6 - 3;
                var barH = (1 / (1 + t * t * 0.5)) * 45 + (Math.abs(t) > 2 ? 8 : 0);
                svg += '<rect x="' + (205 + i * 4.5) + '" y="' + (h - 5 - barH) + '" width="3.5" height="' + barH + '" fill="#2ecc71" opacity="0.6" rx="1"/>';
            }
            svg += '</svg>';
            return svg;
        },

        // ============================================================
        // NEW: Visuals for aggregate plots
        // ============================================================

        magnitude_per_layer: function(value, maxValue, record) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers) {
                var values = [];
                for (var i = 0; i < record.layers.length; i++) {
                    var s = _computeStatsForPopup(record.layers[i].output);
                    values.push(s ? Math.abs(s.mean) + s.std : 0);
                }
                var maxVal = Math.max.apply(null, values) || 1;
                var barW = Math.min(12, (w - 20) / values.length - 1);
                for (var i = 0; i < values.length; i++) {
                    var barH = (values[i] / maxVal) * (h - 15);
                    var x = 10 + i * (barW + 1);
                    var color = values[i] / maxVal > 0.8 ? '#e74c3c' : values[i] / maxVal > 0.5 ? '#f39c12' : '#2ecc71';
                    svg += '<rect x="' + x + '" y="' + (h - 5 - barH) + '" width="' + barW + '" height="' + barH + '" fill="' + color + '" opacity="0.8" rx="1"/>';
                }
                svg += '<line x1="10" y1="' + (h - 5) + '" x2="' + (w - 10) + '" y2="' + (h - 5) + '" stroke="currentColor" opacity="0.2" stroke-width="0.5"/>';
                svg += '<text x="10" y="10" font-size="7" fill="currentColor" opacity="0.5">max: ' + maxVal.toFixed(3) + '</text>';
            } else {
                svg += '<text x="' + (w/2) + '" y="' + (h/2) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.5">No data</text>';
            }
            svg += '</svg>';
            return svg;
        },

        zero_fraction_per_layer: function(value, maxValue, record) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers) {
                var values = [];
                for (var i = 0; i < record.layers.length; i++) {
                    var s = _computeStatsForPopup(record.layers[i].output);
                    values.push(s ? s.zeroFraction : 0);
                }
                var barW = Math.min(12, (w - 20) / values.length - 1);
                for (var i = 0; i < values.length; i++) {
                    var barH = values[i] * (h - 15);
                    var x = 10 + i * (barW + 1);
                    var color = values[i] > 0.8 ? '#e74c3c' : values[i] > 0.5 ? '#f39c12' : '#2ecc71';
                    svg += '<rect x="' + x + '" y="' + (h - 5 - barH) + '" width="' + barW + '" height="' + barH + '" fill="' + color + '" opacity="0.8" rx="1"/>';
                }
                svg += '<line x1="10" y1="' + (h - 5) + '" x2="' + (w - 10) + '" y2="' + (h - 5) + '" stroke="currentColor" opacity="0.2" stroke-width="0.5"/>';
                // 80% threshold line
                var threshY = h - 5 - 0.8 * (h - 15);
                svg += '<line x1="10" y1="' + threshY + '" x2="' + (w - 10) + '" y2="' + threshY + '" stroke="#e74c3c" opacity="0.4" stroke-width="0.5" stroke-dasharray="3,2"/>';
                svg += '<text x="' + (w - 40) + '" y="' + (threshY - 2) + '" font-size="7" fill="#e74c3c" opacity="0.6">80%</text>';
            }
            svg += '</svg>';
            return svg;
        },

        std_per_layer: function(value, maxValue, record) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers) {
                var values = [];
                for (var i = 0; i < record.layers.length; i++) {
                    var s = _computeStatsForPopup(record.layers[i].output);
                    values.push(s ? s.std : 0);
                }
                var maxVal = Math.max.apply(null, values) || 1;
                var barW = Math.min(12, (w - 20) / values.length - 1);
                for (var i = 0; i < values.length; i++) {
                    var barH = (values[i] / maxVal) * (h - 15);
                    var x = 10 + i * (barW + 1);
                    var color = values[i] < 1e-6 ? '#e74c3c' : values[i] > 100 ? '#f39c12' : '#3498db';
                    svg += '<rect x="' + x + '" y="' + (h - 5 - barH) + '" width="' + barW + '" height="' + barH + '" fill="' + color + '" opacity="0.8" rx="1"/>';
                }
                svg += '<line x1="10" y1="' + (h - 5) + '" x2="' + (w - 10) + '" y2="' + (h - 5) + '" stroke="currentColor" opacity="0.2" stroke-width="0.5"/>';
            }
            svg += '</svg>';
            return svg;
        },

        mean_flow: function(value, maxValue, record) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers && record.layers.length >= 2) {
                var values = [];
                for (var i = 0; i < record.layers.length; i++) {
                    var s = _computeStatsForPopup(record.layers[i].output);
                    values.push(s ? s.mean : 0);
                }
                var minVal = Math.min.apply(null, values);
                var maxVal = Math.max.apply(null, values);
                var range = maxVal - minVal || 1;
                var points = [];
                for (var i = 0; i < values.length; i++) {
                    var x = 10 + (i / (values.length - 1)) * (w - 20);
                    var y = (h - 10) - ((values[i] - minVal) / range) * (h - 20);
                    points.push(x.toFixed(1) + ',' + y.toFixed(1));
                }
                // Zero line
                if (minVal < 0 && maxVal > 0) {
                    var zeroY = (h - 10) - ((0 - minVal) / range) * (h - 20);
                    svg += '<line x1="10" y1="' + zeroY + '" x2="' + (w - 10) + '" y2="' + zeroY + '" stroke="currentColor" opacity="0.2" stroke-width="0.5" stroke-dasharray="2,2"/>';
                }
                svg += '<polygon points="10,' + (h - 5) + ' ' + points.join(' ') + ' ' + (w - 10) + ',' + (h - 5) + '" fill="#00d4ff" opacity="0.1"/>';
                svg += '<polyline points="' + points.join(' ') + '" fill="none" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                for (var i = 0; i < values.length; i++) {
                    var x = 10 + (i / (values.length - 1)) * (w - 20);
                    var y = (h - 10) - ((values[i] - minVal) / range) * (h - 20);
                    svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="#00d4ff" stroke="white" stroke-width="0.5"/>';
                }
                svg += '<text x="10" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + minVal.toFixed(3) + '</text>';
                svg += '<text x="' + (w - 50) + '" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + maxVal.toFixed(3) + '</text>';
            }
            svg += '</svg>';
            return svg;
        },

        skewness_per_layer: function(value, maxValue, record) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers && record.layers.length >= 2) {
                var values = [];
                for (var i = 0; i < record.layers.length; i++) {
                    var s = _computeStatsForPopup(record.layers[i].output);
                    values.push(s ? (s.skewness || 0) : 0);
                }
                var minVal = Math.min.apply(null, values);
                var maxVal = Math.max.apply(null, values);
                var range = maxVal - minVal || 1;
                var points = [];
                for (var i = 0; i < values.length; i++) {
                    var x = 10 + (i / (values.length - 1)) * (w - 20);
                    var y = (h - 10) - ((values[i] - minVal) / range) * (h - 20);
                    points.push(x.toFixed(1) + ',' + y.toFixed(1));
                }
                // Zero line
                if (minVal < 0 && maxVal > 0) {
                    var zeroY = (h - 10) - ((0 - minVal) / range) * (h - 20);
                    svg += '<line x1="10" y1="' + zeroY + '" x2="' + (w - 10) + '" y2="' + zeroY + '" stroke="currentColor" opacity="0.2" stroke-width="0.5" stroke-dasharray="2,2"/>';
                }
                svg += '<polygon points="10,' + (h - 5) + ' ' + points.join(' ') + ' ' + (w - 10) + ',' + (h - 5) + '" fill="#9b59b6" opacity="0.1"/>';
                svg += '<polyline points="' + points.join(' ') + '" fill="none" stroke="#9b59b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                for (var i = 0; i < values.length; i++) {
                    var x = 10 + (i / (values.length - 1)) * (w - 20);
                    var y = (h - 10) - ((values[i] - minVal) / range) * (h - 20);
                    svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="#9b59b6" stroke="white" stroke-width="0.5"/>';
                }
                svg += '<text x="10" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + minVal.toFixed(3) + '</text>';
                svg += '<text x="' + (w - 50) + '" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + maxVal.toFixed(3) + '</text>';
            }
            svg += '</svg>';
            return svg;
        },

        kurtosis_per_layer: function(value, maxValue, record) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers && record.layers.length >= 2) {
                var values = [];
                for (var i = 0; i < record.layers.length; i++) {
                    var s = _computeStatsForPopup(record.layers[i].output);
                    values.push(s ? (s.kurtosis || 0) : 0);
                }
                var minVal = Math.min.apply(null, values);
                var maxVal = Math.max.apply(null, values);
                var range = maxVal - minVal || 1;
                var points = [];
                for (var i = 0; i < values.length; i++) {
                    var x = 10 + (i / (values.length - 1)) * (w - 20);
                    var y = (h - 10) - ((values[i] - minVal) / range) * (h - 20);
                    points.push(x.toFixed(1) + ',' + y.toFixed(1));
                }
                if (minVal < 0 && maxVal > 0) {
                    var zeroY = (h - 10) - ((0 - minVal) / range) * (h - 20);
                    svg += '<line x1="10" y1="' + zeroY + '" x2="' + (w - 10) + '" y2="' + zeroY + '" stroke="currentColor" opacity="0.2" stroke-width="0.5" stroke-dasharray="2,2"/>';
                }
                svg += '<polygon points="10,' + (h - 5) + ' ' + points.join(' ') + ' ' + (w - 10) + ',' + (h - 5) + '" fill="#e67e22" opacity="0.1"/>';
                svg += '<polyline points="' + points.join(' ') + '" fill="none" stroke="#e67e22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                for (var i = 0; i < values.length; i++) {
                    var x = 10 + (i / (values.length - 1)) * (w - 20);
                    var y = (h - 10) - ((values[i] - minVal) / range) * (h - 20);
                    svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="#e67e22" stroke="white" stroke-width="0.5"/>';
                }
                svg += '<text x="10" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + minVal.toFixed(3) + '</text>';
                svg += '<text x="' + (w - 50) + '" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + maxVal.toFixed(3) + '</text>';
            }
            svg += '</svg>';
            return svg;
        },

        // ============================================================
        // NEW: Visuals for per-layer Input/Output stats boxes
        // ============================================================

        layer_io_input: function(value, maxValue, record, layerIndex) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers && record.layers[layerIndex] && record.layers[layerIndex].input) {
                var arr = record.layers[layerIndex].input;
                var histogram = _computeHistogramForPopup(arr, 30);
                if (histogram && histogram.counts) {
                    var maxCount = Math.max.apply(null, histogram.counts) || 1;
                    var barW = (w - 20) / histogram.counts.length;
                    for (var i = 0; i < histogram.counts.length; i++) {
                        var barH = (histogram.counts[i] / maxCount) * (h - 15);
                        var x = 10 + i * barW;
                        svg += '<rect x="' + x + '" y="' + (h - 5 - barH) + '" width="' + Math.max(barW - 0.5, 0.5) + '" height="' + barH + '" fill="#3498db" opacity="0.7" rx="1"/>';
                    }
                    svg += '<line x1="10" y1="' + (h - 5) + '" x2="' + (w - 10) + '" y2="' + (h - 5) + '" stroke="currentColor" opacity="0.2" stroke-width="0.5"/>';
                    svg += '<text x="10" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + histogram.min.toFixed(3) + '</text>';
                    svg += '<text x="' + (w - 50) + '" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + histogram.max.toFixed(3) + '</text>';
                }
            } else {
                svg += '<text x="' + (w / 2) + '" y="' + (h / 2) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.5">No input data</text>';
            }
            svg += '</svg>';
            return svg;
        },

        layer_io_output: function(value, maxValue, record, layerIndex) {
            var w = 380, h = 70;
            var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
            if (record && record.layers && record.layers[layerIndex] && record.layers[layerIndex].output) {
                var arr = record.layers[layerIndex].output;
                var histogram = _computeHistogramForPopup(arr, 30);
                if (histogram && histogram.counts) {
                    var maxCount = Math.max.apply(null, histogram.counts) || 1;
                    var barW = (w - 20) / histogram.counts.length;
                    for (var i = 0; i < histogram.counts.length; i++) {
                        var barH = (histogram.counts[i] / maxCount) * (h - 15);
                        var x = 10 + i * barW;
                        svg += '<rect x="' + x + '" y="' + (h - 5 - barH) + '" width="' + Math.max(barW - 0.5, 0.5) + '" height="' + barH + '" fill="#2ecc71" opacity="0.7" rx="1"/>';
                    }
                    svg += '<line x1="10" y1="' + (h - 5) + '" x2="' + (w - 10) + '" y2="' + (h - 5) + '" stroke="currentColor" opacity="0.2" stroke-width="0.5"/>';
                    svg += '<text x="10" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + histogram.min.toFixed(3) + '</text>';
                    svg += '<text x="' + (w - 50) + '" y="' + (h - 1) + '" font-size="7" fill="currentColor" opacity="0.4">' + histogram.max.toFixed(3) + '</text>';
                }
            } else {
                svg += '<text x="' + (w / 2) + '" y="' + (h / 2) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.5">No output data</text>';
            }
            svg += '</svg>';
            return svg;
        }
    };

    // Helper: compute stats for popup (mirrors _computeStats from health_status.js)
    function _computeStatsForPopup(arr) {
        if (!arr || arr.length === 0) return null;
        var min = Infinity, max = -Infinity, sum = 0, sumSq = 0;
        var zeros = 0, negatives = 0;
        var nanCount = 0, infCount = 0;

        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            if (isNaN(v)) { nanCount++; continue; }
            if (!isFinite(v)) { infCount++; continue; }
            if (v < min) min = v;
            if (v > max) max = v;
            sum += v;
            sumSq += v * v;
            if (v === 0) zeros++;
            else if (v < 0) negatives++;
        }

        var n = arr.length - nanCount - infCount;
        var mean = n > 0 ? sum / n : 0;
        var variance = n > 1 ? (sumSq / n) - (mean * mean) : 0;
        var std = Math.sqrt(Math.max(0, variance));

        var skewness = 0, kurtosis = 0;
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
            zeros: zeros, negatives: negatives,
            zeroFraction: arr.length > 0 ? zeros / arr.length : 0,
            skewness: skewness, kurtosis: kurtosis
        };
    }

    // Helper: compute histogram for popup
    function _computeHistogramForPopup(arr, bins) {
        bins = bins || 30;
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

        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            if (isNaN(v) || !isFinite(v)) continue;
            var idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
            counts[idx]++;
        }

        return { counts: counts, min: min, max: max, binWidth: binWidth };
    }

    // Simple erf approximation for CDF
    function _erf(x) {
        var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        var a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        var sign = x < 0 ? -1 : 1;
        x = Math.abs(x);
        var t = 1.0 / (1.0 + p * x);
        var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    // Show tooltip popup (updated to support record and layerIndex)
    function _showWaTooltip(indicatorType, value, maxValue, event, record, layerIndex) {
        _injectTooltipStyles();

        // Remove any existing tooltip
        _hideWaTooltip();

        // Create overlay
        var overlay = document.createElement("div");
        overlay.className = "wa_tooltip_overlay";
        overlay.id = "wa_tooltip_overlay";
        overlay.addEventListener("click", _hideWaTooltip);
        document.body.appendChild(overlay);

        // Create popup
        var popup = document.createElement("div");
        popup.className = "wa_tooltip_popup";
        popup.id = "wa_tooltip_popup";

        var titleKey = "wa_tooltip_" + indicatorType + "_title";
        var descKey = "wa_tooltip_" + indicatorType + "_desc";

        var html = '<button class="wa_tt_close" onclick="window._hideWaTooltip()">&times;</button>';
        html += '<h3><span class="TRANSLATEME_' + titleKey + '"></span></h3>';
        html += '<div class="wa_tt_desc"><span class="TRANSLATEME_' + descKey + '"></span></div>';

        // Visual
        html += '<div class="wa_tt_visual">';
        if (_tooltipVisuals[indicatorType]) {
            html += _tooltipVisuals[indicatorType](value, maxValue, record, layerIndex);
        }
        html += '</div>';

        // Scale bar showing current value (only for numeric indicators)
        if (typeof value === "number" && typeof maxValue === "number" && maxValue > 0) {
            var pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
            html += '<div class="wa_tt_scale">';
            html += '<div class="wa_tt_scale_bar" style="background: linear-gradient(to right, #2ecc71, #f39c12, #e74c3c);">';
            html += '<div class="wa_tt_scale_marker" style="left: ' + pct + '%;"></div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="wa_tt_scale_labels"><span>0</span><span>' + value.toFixed(4) + '</span><span>' + maxValue.toFixed(3) + '</span></div>';
        }

        // For layer_io_input / layer_io_output, show stats table
        if ((indicatorType === "layer_io_input" || indicatorType === "layer_io_output") && record && record.layers && record.layers[layerIndex]) {
            var arr = indicatorType === "layer_io_input" ? record.layers[layerIndex].input : record.layers[layerIndex].output;
            if (arr) {
                var stats = _computeStatsForPopup(arr);
                if (stats) {
                    html += '<table class="wa_tt_stats_table">';
                    html += '<tr><td>Min</td><td>' + stats.min.toFixed(5) + '</td></tr>';
                    html += '<tr><td>Max</td><td>' + stats.max.toFixed(5) + '</td></tr>';
                    html += '<tr><td>Mean</td><td>' + stats.mean.toFixed(5) + '</td></tr>';
                    html += '<tr><td>Std</td><td>' + stats.std.toFixed(5) + '</td></tr>';
                    html += '<tr><td>Zeros</td><td>' + stats.zeros + ' (' + (stats.zeroFraction * 100).toFixed(1) + '%)</td></tr>';
                    html += '<tr><td>Count</td><td>' + stats.count + '</td></tr>';
                    html += '<tr><td>Skewness</td><td>' + stats.skewness.toFixed(3) + '</td></tr>';
                    html += '<tr><td>Kurtosis</td><td>' + stats.kurtosis.toFixed(3) + '</td></tr>';
                    html += '</table>';
                }
            }
        }

        popup.innerHTML = html;
        document.body.appendChild(popup);

        // Position popup near the click/hover
        var rect = event.currentTarget.getBoundingClientRect();
        var popupWidth = 520;
        var popupHeight = 350;

        var left = rect.right + 10;
        var top = rect.top + rect.height / 2 - popupHeight / 2;

        // Keep within viewport
        if (left + popupWidth > window.innerWidth - 20) {
            left = rect.left - popupWidth - 10;
        }
        if (left < 10) {
            left = (window.innerWidth - popupWidth) / 2;
        }
        if (top < 10) top = 10;
        if (top + popupHeight > window.innerHeight - 10) {
            top = window.innerHeight - popupHeight - 10;
        }

        popup.style.left = left + "px";
        popup.style.top = top + "px";

        // Animate in
        requestAnimationFrame(function() {
            overlay.classList.add("wa_visible");
            popup.classList.add("wa_visible");
        });

        // Update translations for the popup content
        try {
            if (typeof update_translations === "function") {
                update_translations();
            }
        } catch (e) { }
    }

    // Hide tooltip popup
    function _hideWaTooltip() {
        var overlay = document.getElementById("wa_tooltip_overlay");
        var popup = document.getElementById("wa_tooltip_popup");

        if (overlay) {
            overlay.classList.remove("wa_visible");
            setTimeout(function() {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 250);
        }
        if (popup) {
            popup.classList.remove("wa_visible");
            setTimeout(function() {
                if (popup.parentNode) popup.parentNode.removeChild(popup);
            }, 250);
        }
    }

    // Expose globally
    window._hideWaTooltip = _hideWaTooltip;

    // ============================================================
    // PUBLIC API: Wrap indicator rows with tooltip triggers
    // ============================================================

    window.attachWaTooltips = function(container, indicatorValues) {
        if (!container) return;
        _injectTooltipStyles();

        var rows = container.querySelectorAll("[data-wa-indicator]");
        for (var i = 0; i < rows.length; i++) {
            (function(row) {
                var type = row.getAttribute("data-wa-indicator");
                if (!type) return;

                row.classList.add("wa_indicator_row");
                row.style.cursor = "help";

                row.addEventListener("click", function(e) {
                    var value = 0, maxValue = 1;

                    switch (type) {
                        case "entropy":
                            value = indicatorValues.entropy || 0;
                            maxValue = indicatorValues.entropyMax || 8;
                            break;
                        case "sparsity":
                            value = indicatorValues.sparsity || 0;
                            maxValue = 1;
                            break;
                        case "svd":
                            value = indicatorValues.svd || 0;
                            maxValue = 1;
                            break;
                        case "kurtosis":
                            value = Math.abs(indicatorValues.kurtosis || 0);
                            maxValue = 20;
                            break;
                        case "ks_test":
                            value = indicatorValues.ks || 0;
                            maxValue = 1;
                            break;
                        case "correlation":
                            value = indicatorValues.correlation || 0;
                            maxValue = 1;
                            break;
                        case "weight_distribution":
                            value = null;
                            maxValue = null;
                            break;
                    }

                    _showWaTooltip(type, value, maxValue, e, null, null);
                });
            })(rows[i]);
        }
    };

    // ============================================================
    // PUBLIC API: Attach tooltips to aggregate plots
    // ============================================================

    window.attachWaTooltipsToPlots = function(container, record) {
        if (!container) return;
        _injectTooltipStyles();

        var rows = container.querySelectorAll("[data-wa-indicator]");
        for (var i = 0; i < rows.length; i++) {
            (function(row) {
                var type = row.getAttribute("data-wa-indicator");
                if (!type) return;

                row.classList.add("wa_indicator_row");
                row.style.cursor = "help";

                row.addEventListener("click", function(e) {
                    _showWaTooltip(type, null, null, e, record, null);
                });
            })(rows[i]);
        }
    };

    // ============================================================
    // PUBLIC API: Attach tooltips to per-layer IO stats boxes
    // ============================================================

    window.attachWaTooltipsToLayerStats = function(container, record) {
        if (!container) return;
        _injectTooltipStyles();

        var rows = container.querySelectorAll("[data-wa-indicator='layer_io_input'], [data-wa-indicator='layer_io_output']");
        for (var i = 0; i < rows.length; i++) {
            (function(row) {
                var type = row.getAttribute("data-wa-indicator");
                var layerIndex = parseInt(row.getAttribute("data-layer-index"), 10);
                if (!type || isNaN(layerIndex)) return;

                row.classList.add("wa_indicator_row");
                row.style.cursor = "help";

                row.addEventListener("click", function(e) {
                    _showWaTooltip(type, null, null, e, record, layerIndex);
                });
            })(rows[i]);
        }
    };

    // ============================================================
    // Helper: Generates HTML for an indicator row
    // ============================================================

    window.waIndicatorRowHTML = function(type, labelKey, valueText) {
        return '<div data-wa-indicator="' + type + '" class="wa_indicator_row">' +
            '<span class="TRANSLATEME_' + labelKey + '"></span>' +
            '<span style="float:right; font-family: monospace; font-weight:bold;">' + valueText + '</span>' +
            '<span style="float:right; margin-right:8px; font-size:0.75em; opacity:0.5;">ℹ️</span>' +
            '</div>';
    };

})();
