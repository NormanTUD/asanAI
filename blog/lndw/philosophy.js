// ============================================================
// SUNRISE PLOT – Sonnenhöhe über 24h am Polartag (Concordia, 75°S)
// ============================================================

const SunrisePlot = {
    render: function() {
        const plotDiv = document.getElementById('sunrise-plot');
        if (!plotDiv) return;

        const phaseSlider = document.getElementById('sun-phase-slider');
        const vshiftSlider = document.getElementById('sun-vshift-slider');
        const c = phaseSlider ? parseFloat(phaseSlider.value) : 0;
        const d = vshiftSlider ? parseFloat(vshiftSlider.value) : 0;

        // Update labels
        const phaseVal = document.getElementById('sun-phase-val');
        const vshiftVal = document.getElementById('sun-vshift-val');
        if (phaseVal) phaseVal.textContent = c.toFixed(2);
        if (vshiftVal) vshiftVal.textContent = d.toFixed(2);

        // Concordia Station (75°S) – Polartag: Sonnenhöhe über 24 Stunden
        // Die Sonne kreist um den Beobachter. Amplitude ~15°, Mittel ~25°
        // Mittag (Sonne am höchsten, ~40°), Mitternacht (am niedrigsten, ~10°)
        // Differenz: 2 × (90° - 75°) = 30° → Amplitude 15°, Mittel ca. 25°
        const A = 15;       // Amplitude in Grad (halbe Differenz Mittag–Mitternacht)
        const mean = 25;    // Mittlere Sonnenhöhe in Grad
        const hours = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
                       '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
        
        // "Reale" Datenpunkte (simuliert, mit leichtem Rauschen durch Refraktion etc.)
        const realData = [10.2, 11.0, 13.5, 17.0, 21.2, 25.8, 30.5, 34.8, 37.5, 39.2, 39.8, 39.5,
                          38.5, 36.8, 34.0, 30.2, 26.0, 21.5, 17.2, 13.8, 11.5, 10.0, 9.8, 10.0];
        
        // Sinus-Modell: f(x) = A * cos(2π/24 * (x + c)) + mean + d
        // cos statt sin, damit Maximum bei x=12 (Mittag) liegt bei c=12
        const xs = [];
        const ysModel = [];
        for (let i = 0; i <= 240; i++) {
            const x = i / 10; // 0 bis 24 (Stunden)
            xs.push(x);
            ysModel.push(-A * Math.cos((2 * Math.PI / 24) * (x + c)) + mean + d);
        }

        const traces = [
            // "Reale" Datenpunkte (stündliche Messungen)
            {
                x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
                y: realData,
                mode: 'markers',
                name: 'Stündliche Messungen',
                marker: { size: 9, color: '#f59e0b', line: { width: 1, color: '#fff' } },
                hovertemplate: '<b>%{x}:00 Uhr</b><br>Sonnenhöhe: %{y:.1f}°<extra></extra>'
            },
            // Sinus-Modell
            {
                x: xs,
                y: ysModel,
                mode: 'lines',
                name: 'Gelerntes Muster (Sinus)',
                line: { color: '#3b82f6', width: 3 },
                hovertemplate: '%{x:.1f}:00 Uhr<br>Modell: %{y:.1f}°<extra></extra>'
            }
        ];

        const layout = {
            margin: { l: 50, r: 20, b: 40, t: 10 },
            xaxis: { 
                title: 'Uhrzeit (h)', 
                tickvals: [0, 3, 6, 9, 12, 15, 18, 21, 24],
                ticktext: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00'],
                range: [0, 24],
                gridcolor: '#f1f5f9' 
            },
            yaxis: { 
                title: 'Sonnenhöhe (°)', 
                range: [0, 50], 
                gridcolor: '#f1f5f9',
                dtick: 10
            },
            showlegend: true,
            legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(255,255,255,0.9)', font: { size: 10 } },
            plot_bgcolor: '#fff'
        };

        Plotly.react(plotDiv, traces, layout, { displayModeBar: false, responsive: true });
    }
};

// ============================================================
// CO-OCCURRENCE BAR CHART
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
// LAZY REGISTRATION for philosophy slides
// ============================================================

function initPhilosophySlides() {
	SunrisePlot.render();

	CooccurrencePlot.render();

	_lazyCreateObserver();
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhilosophySlides);
} else {
    initPhilosophySlides();
}
