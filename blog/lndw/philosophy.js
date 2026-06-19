// ============================================================
// SUNRISE PLOT – Interactive sine with phase/vertical shift
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

        // Hamburg sunrise data (approximate real values, hours after midnight)
        // Amplitude ~1.75h, mean ~6.75h, period = 12 months
        const A = 1.75;
        const mean = 6.75;
        const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        
        // "Real" data points (with some noise to show imperfection)
        const realData = [8.32, 7.45, 6.38, 5.15, 4.20, 4.04, 4.35, 5.20, 6.15, 7.05, 7.55, 8.25];
        
        // Sine model: f(x) = A * sin(2π/12 * (x + c)) + mean + d
        const xs = [];
        const ysModel = [];
        for (let i = 0; i <= 120; i++) {
            const x = i / 10; // 0 to 12 (months)
            xs.push(x);
            ysModel.push(A * Math.cos((2 * Math.PI / 12) * (x + c)) + mean + d);
        }

        const traces = [
            // Noisy "real" data points
            {
                x: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5],
                y: realData,
                mode: 'markers',
                name: 'Daten aus Texten',
                marker: { size: 9, color: '#f59e0b', line: { width: 1, color: '#fff' } },
                hovertemplate: '<b>%{x}</b><br>Sonnenaufgang: %{y:.2f} Uhr<extra></extra>'
            },
            // Sine model
            {
                x: xs,
                y: ysModel,
                mode: 'lines',
                name: 'Gelerntes Muster (Sinus)',
                line: { color: '#3b82f6', width: 3 },
                hovertemplate: 'Monat %{x:.1f}<br>Modell: %{y:.2f} Uhr<extra></extra>'
            }
        ];

        const layout = {
            margin: { l: 50, r: 20, b: 40, t: 10 },
            xaxis: { 
                title: 'Monat', 
                tickvals: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5],
                ticktext: months,
                range: [0, 12],
                gridcolor: '#f1f5f9' 
            },
            yaxis: { 
                title: 'Uhrzeit (h)', 
                range: [3, 10], 
                gridcolor: '#f1f5f9',
                dtick: 1
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
    _lazyRegister('sunrise-plot', () => {
        SunrisePlot.render();
    });

    _lazyRegister('cooccurrence-plot', () => {
        CooccurrencePlot.render();
    });

    _lazyCreateObserver();
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhilosophySlides);
} else {
    initPhilosophySlides();
}
