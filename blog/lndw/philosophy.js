// ============================================================
// SUNRISE PLOT – Sonnenhöhe über 24h am Polartag (Concordia, 75°S)
// ============================================================

const SunrisePlot = {
    step: 0,

    setStep: function(s) {
        this.step = s;
        for (let i = 0; i <= 2; i++) {
            const btn = document.getElementById('sun-step-' + i);
            if (btn) {
                btn.style.border = (i === s) ? '2px solid #f59e0b' : '1px solid #cbd5e1';
                btn.style.background = (i === s) ? '#fffbeb' : '#fff';
            }
        }
        const sliders = document.getElementById('sunrise-sliders');
        if (sliders) {
            sliders.style.opacity = (s >= 2) ? '1' : '0.3';
            sliders.style.pointerEvents = (s >= 2) ? 'auto' : 'none';
        }
        const plotDiv = document.getElementById('sunrise-plot');
        if (plotDiv) {
            plotDiv.style.pointerEvents = (s >= 1) ? 'auto' : 'none';
        }
        this.render();
    },

    render: function() {
        const plotDiv = document.getElementById('sunrise-plot');
        if (!plotDiv) return;

        const phaseSlider = document.getElementById('sun-phase-slider');
        const vshiftSlider = document.getElementById('sun-vshift-slider');
        const c = phaseSlider ? parseFloat(phaseSlider.value) : 5.60;
        const d = vshiftSlider ? parseFloat(vshiftSlider.value) : 10.5;

        const phaseVal = document.getElementById('sun-phase-val');
        const vshiftVal = document.getElementById('sun-vshift-val');
        if (phaseVal) phaseVal.textContent = c.toFixed(2);
        if (vshiftVal) vshiftVal.textContent = d.toFixed(2);

        const yMin = -5;
        const yMax = 52;

        const A = 15;       // Amplitude in Grad
        const mean = 25;    // Mittlere Sonnenhöhe

        // Modell-Funktion
        function sinModel(x, phase, vshift) {
            return -A * Math.cos((2 * Math.PI / 24) * (x + phase)) + mean + vshift;
        }

        // *** FIX 1: Messdaten DIREKT aus der Sinusfunktion berechnen ***
        // So liegen sie exakt auf der Kurve wenn c=5.60, d=10.50
        const sunX = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                      12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        const realData = sunX.map(x => sinModel(x, 5.60, 10.50));

        const traces = [];

        // Step 0: Leer
        if (this.step === 0) {
            traces.push({
                x: [0, 23],
                y: [yMin, yMax],
                mode: 'markers',
                marker: { size: 0.1, opacity: 0 },
                showlegend: false,
                hoverinfo: 'skip'
            });
        }

        // *** FIX 3: Sonnen-Emoji ☀ statt rote Punkte ***
        if (this.step >= 1) {
            traces.push({
                x: sunX,
                y: realData,
                mode: 'text',
                name: 'Messwerte',
                text: sunX.map(() => '☀'),
                textfont: { size: 18 },
                textposition: 'middle center',
                hovertemplate: '<b>%{x}:00 Uhr</b><br>Sonnenhöhe: %{y:.1f}°<extra></extra>'
            });
        }

        // Step 2: Sinus-Modell (smooth)
        if (this.step >= 2) {
            const xs = [];
            const ysModel = [];
            for (let i = 0; i <= 230; i++) {
                const x = i / 10;
                xs.push(x);
                ysModel.push(sinModel(x, c, d));
            }
            traces.push({
                x: xs,
                y: ysModel,
                mode: 'lines',
                name: 'Sinus-Modell',
                line: { color: '#3b82f6', width: 4, shape: 'spline' },
                hovertemplate: '%{x:.1f}:00 Uhr<br>Modell: %{y:.1f}°<extra></extra>'
            });
        }

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0, pad: 0 },
            xaxis: {
                range: [-0.5, 23.5],
                showgrid: false,
                zeroline: false,
                showline: false,
                showticklabels: this.step >= 1,
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
                showticklabels: this.step >= 1,
                tickvals: [0, 10, 20, 30, 40, 50],
                ticktext: ['0°', '10°', '20°', '30°', '40°', '50°'],
                tickfont: { color: 'rgba(255,255,255,0.9)', size: 11, family: 'system-ui, sans-serif' },
                fixedrange: true
            },
            showlegend: this.step >= 1,
            legend: {
                x: 0.01, y: 0.99,
                bgcolor: 'rgba(0,0,0,0.6)',
                font: { size: 12, color: '#fff' },
                bordercolor: 'rgba(255,255,255,0.3)',
                borderwidth: 1
            },
            // *** FIX 2: Perfekt weiß – KEIN grauer Hintergrund ***
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            // *** FIX 2: KEIN dunkles Overlay-Shape mehr ***
            shapes: []
        };

        const config = {
            displayModeBar: false,
            responsive: true,
            staticPlot: this.step === 0
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

function initPhilosophySlides() {
    SunrisePlot.setStep(0);
    CooccurrencePlot.render();
    if (typeof _lazyCreateObserver === 'function') _lazyCreateObserver();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhilosophySlides);
} else {
    initPhilosophySlides();
}
