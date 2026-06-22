// ============================================================
// SUNRISE PLOT – Sinuskurve über Sonnenbild (Fragment-gesteuert)
// ============================================================

const SunrisePlot = {
    sinusVisible: false,

    showSinus: function() {
        this.sinusVisible = true;
        const plotDiv = document.getElementById('sunrise-plot');
        if (plotDiv) plotDiv.style.opacity = '1';
        const sliders = document.getElementById('sunrise-sliders');
        if (sliders) {
            sliders.style.opacity = '1';
            sliders.style.pointerEvents = 'auto';
        }
        this.render();
    },

    hideSinus: function() {
        this.sinusVisible = false;
        const plotDiv = document.getElementById('sunrise-plot');
        if (plotDiv) plotDiv.style.opacity = '0';
        const sliders = document.getElementById('sunrise-sliders');
        if (sliders) {
            sliders.style.opacity = '0';
            sliders.style.pointerEvents = 'none';
        }
    },

    render: function() {
        const plotDiv = document.getElementById('sunrise-plot');
        if (!plotDiv || !this.sinusVisible) return;

        const vshiftSlider = document.getElementById('sun-vshift-slider');
        const ampSlider = document.getElementById('sun-amp-slider');
        const phaseSlider = document.getElementById('sun-phase-slider');
        const stretchSlider = document.getElementById('sun-stretch-slider');

        const d = vshiftSlider ? parseFloat(vshiftSlider.value) : 12.0;
        const A = ampSlider ? parseFloat(ampSlider.value) : 11;
        const c = phaseSlider ? parseFloat(phaseSlider.value) : 5.60;
        const period = stretchSlider ? parseFloat(stretchSlider.value) : 24;

        // Update display values
        const vshiftVal = document.getElementById('sun-vshift-val');
        const ampVal = document.getElementById('sun-amp-val');
        const phaseVal = document.getElementById('sun-phase-val');
        const stretchVal = document.getElementById('sun-stretch-val');
        if (vshiftVal) vshiftVal.textContent = d.toFixed(2);
        if (ampVal) ampVal.textContent = A.toFixed(1);
        if (phaseVal) phaseVal.textContent = c.toFixed(2);
        if (stretchVal) stretchVal.textContent = period.toFixed(1);

        const yMin = -5;
        const yMax = 52;
        const mean = 25;

        // Modell-Funktion mit allen Parametern
        function sinModel(x) {
            return -A * Math.cos((2 * Math.PI / period) * (x + c)) + mean + d;
        }

        const traces = [];

        // Sinus-Modell (smooth)
        const xs = [];
        const ysModel = [];
        for (let i = 0; i <= 230; i++) {
            const x = i / 10;
            xs.push(x);
            ysModel.push(sinModel(x));
        }
        traces.push({
            x: xs,
            y: ysModel,
            mode: 'lines',
            name: 'Sinus-Modell',
            line: { color: '#3b82f6', width: 4, shape: 'spline' },
            hovertemplate: '%{x:.1f}:00 Uhr<br>Modell: %{y:.1f}°<extra></extra>'
        });

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0, pad: 0 },
            xaxis: {
                range: [-0.5, 23.5],
                showgrid: false,
                zeroline: false,
                showline: false,
                showticklabels: true,
                tickvals: [0, 3, 6, 9, 12, 15, 18, 21, 23],
                ticktext: ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '23h'],
                tickfont: { color: 'rgba(255,255,255,0.9)', size: 11, family: 'system-ui, sans-serif' },
                side: 'bottom',
                fixedrange: true
            },
            yaxis: {
                range: [yMin, yMax],
                showgrid: false,
                zeroline: false,
                showline: false,
                showticklabels: true,
                tickvals: [0, 10, 20, 30, 40, 50],
                ticktext: ['0°', '10°', '20°', '30°', '40°', '50°'],
                tickfont: { color: 'rgba(255,255,255,0.9)', size: 11, family: 'system-ui, sans-serif' },
                fixedrange: true
            },
            showlegend: false,
            legend: {
                x: 0.01, y: 0.99,
                bgcolor: 'rgba(0,0,0,0.6)',
                font: { size: 12, color: '#fff' },
                bordercolor: 'rgba(255,255,255,0.3)',
                borderwidth: 1
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: []
        };

        const config = {
            displayModeBar: false,
            responsive: true,
            staticPlot: false
        };

        Plotly.react(plotDiv, traces, layout, config);
    }
};

// ============================================================
// CO-OCCURRENCE BAR CHART (unverändert)
// ============================================================

const CooccurrencePlot = {
    render: function() {
        const plotDiv = document.getElementById('cooccurrence-plot');
        if (!plotDiv) return;

        const pairs = [
            { label: 'Hamburg + Elbe', value: 8420, color: '#3b82f6' },
            { label: 'Hamburg + Hafen', value: 6230, color: '#3b82f6' },
            { label: 'Hamburg + Nordsee', value: 3150, color: '#3b82f6' },
            { label: 'Hamburg + Spree', value: 45, color: '#ef4444' },
            { label: 'Hamburg + Donau', value: 28, color: '#ef4444' },
            { label: 'Berlin + Spree', value: 7890, color: '#10b981' },
            { label: 'Berlin + Elbe', value: 120, color: '#f59e0b' },
        ];

        const trace = {
            x: pairs.map(p => p.value),
            y: pairs.map(p => p.label),
            type: 'bar',
            orientation: 'h',
            marker: {
                color: pairs.map(p => p.color),
                line: { width: 1, color: '#fff' }
            },
            text: pairs.map(p => p.value.toLocaleString()),
            textposition: 'outside',
            textfont: { size: 11 },
            hovertemplate: '<b>%{y}</b><br>Vorkommen: %{x:,}<extra></extra>'
        };

        const layout = {
            margin: { l: 130, r: 60, b: 40, t: 10 },
            xaxis: {
                title: 'Gemeinsame Vorkommen im Korpus',
                gridcolor: '#f1f5f9',
                type: 'log',
                dtick: 1
            },
            yaxis: {
                autorange: 'reversed',
                tickfont: { size: 11 }
            },
            plot_bgcolor: '#fff',
            bargap: 0.2
        };

        Plotly.react(plotDiv, [trace], layout, { displayModeBar: false, responsive: true });
    }
};

// ============================================================
// INIT
// ============================================================

// ============================================================
// INIT
// ============================================================

function initPhilosophySlides() {
    CooccurrencePlot.render();
    if (typeof _lazyCreateObserver === 'function') _lazyCreateObserver();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhilosophySlides);
} else {
    initPhilosophySlides();
}
