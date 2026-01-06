/**
 * Master Visualization Lab: 
 * Visualisierung von hochdimensionalen Datenräumen & Loss-Landschaften
 */

function initMasterLab() {
    renderDataManifold();
    renderLossLandscape();
}

// 1. Visualisierung: Daten als "Manifold" (Struktur im Rauschen)
function renderDataManifold() {
    const container = 'master-manifold-plot';
    if (!document.getElementById(container)) return;

    // Wir simulieren 500 Datenpunkte, die eine "S-Kurve" im 3D Raum bilden
    // Das zeigt, wie KI komplexe Strukturen in Daten erkennt
    const n = 500;
    const t = Array.from({length: n}, (_, i) => (i / n) * 2 * Math.PI);
    
    const x = t.map(v => Math.sin(v));
    const y = t.map(v => Math.cos(v));
    const z = t.map(v => v);

    // Wir fügen "Rauschen" hinzu (unwichtige Features)
    const xNoise = x.map(v => v + (Math.random() - 0.5) * 0.2);
    const yNoise = y.map(v => v + (Math.random() - 0.5) * 0.2);
    const zNoise = z.map(v => v + (Math.random() - 0.5) * 0.2);

    const trace = {
        x: xNoise, y: yNoise, z: zNoise,
        mode: 'markers',
        marker: {
            size: 3,
            color: z, // Färbung nach Tiefe
            colorscale: 'Viridis',
            opacity: 0.8
        },
        type: 'scatter3d',
        name: 'Datenpunkte'
    };

    const layout = {
        title: 'Daten-Struktur (The Latent Space)',
        margin: { l: 0, r: 0, b: 0, t: 30 },
        scene: {
            xaxis: { title: 'Feature A' },
            yaxis: { title: 'Feature B' },
            zaxis: { title: 'Feature C' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } }
        }
    };

    Plotly.newPlot(container, [trace], layout);
}

// 2. Visualisierung: Die Loss-Landschaft (Wo lernt die KI?)
function renderLossLandscape() {
    const container = 'master-loss-landscape';
    if (!document.getElementById(container)) return;

    // Erstellung einer "gebirgigen" Landschaft (mathematische Funktion)
    // Repräsentiert das Problem: Wo ist der Fehler am kleinsten?
    const size = 50;
    const x = [], y = [], z = [];
    
    for (let i = 0; i < size; i++) {
        x[i] = (i - size/2) / 10;
        y[i] = (i - size/2) / 10;
    }

    for (let i = 0; i < size; i++) {
        z[i] = [];
        for (let j = 0; j < size; j++) {
            const r2 = x[i]**2 + y[j]**2;
            // Eine komplexe Funktion mit lokalen Minima
            z[i][j] = Math.sin(x[i]*3) * Math.cos(y[j]*3) / (r2 + 1) + (r2 * 0.05);
        }
    }

    const landscape = {
        z: z, x: x, y: y,
        type: 'surface',
        colorscale: 'RdBu',
        showscale: false
    };

    // Ein "Punkt" (der aktuelle Stand des Trainings)
    const agent = {
        x: [0.5], y: [0.8], z: [0.2],
        mode: 'markers',
        type: 'scatter3d',
        marker: { size: 8, color: 'yellow', symbol: 'diamond' },
        name: 'KI-Optimizer'
    };

    const layout = {
        title: 'Loss Landscape (Hyperparameter Optimierung)',
        margin: { l: 0, r: 0, b: 0, t: 30 },
        scene: {
            xaxis: { title: 'Weight 1' },
            yaxis: { title: 'Weight 2' },
            zaxis: { title: 'Fehler (Loss)' }
        }
    };

    Plotly.newPlot(container, [landscape, agent], layout);
}

// Event-Hooking
window.addEventListener('load', () => {
    setTimeout(initMasterLab, 1000); 
});
