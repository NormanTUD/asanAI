let optInterval = null;

function runOptimizerAnimation() {
    if (optInterval) clearInterval(optInterval);
    
    const type = document.getElementById('opt-type').value;
    const lr = parseFloat(document.getElementById('opt-lr').value);
    const startX = parseFloat(document.getElementById('opt-start-x').value);
    const consoleLog = document.getElementById('opt-console');
    
    // Die Zielfunktion (Loss Landscape): f(x) = x^2 + sin(5x)/2
    const f = (x) => x * x + Math.sin(5 * x) / 2;
    const df = (x) => 2 * x + (5 * Math.cos(5 * x)) / 2; // Die Ableitung

    let currentX = startX;
    let velocity = 0; // Für Momentum
    let m = 0, v = 0, t = 0; // Für Adam
    const pathX = [currentX];
    const pathY = [f(currentX)];

    consoleLog.innerHTML = `Starte ${type.toUpperCase()} Optimierung...<br>`;

    optInterval = setInterval(() => {
        const grad = df(currentX);
        t++;

        if (type === 'sgd') {
            currentX = currentX - lr * grad;
        } 
        else if (type === 'momentum') {
            const beta = 0.9;
            velocity = beta * velocity + (1 - beta) * grad;
            currentX = currentX - lr * velocity;
        } 
        else if (type === 'adam') {
            const b1 = 0.9, b2 = 0.999, eps = 1e-8;
            m = b1 * m + (1 - b1) * grad;
            v = b2 * v + (1 - b2) * (grad * grad);
            const mHat = m / (1 - Math.pow(b1, t));
            const vHat = v / (1 - Math.pow(b2, t));
            currentX = currentX - lr * mHat / (Math.sqrt(vHat) + eps);
        }

        pathX.push(currentX);
        pathY.push(f(currentX));

        updateOptPlot(f, pathX, pathY);

        if (pathX.length > 50 || Math.abs(grad) < 0.001) {
            clearInterval(optInterval);
            consoleLog.innerHTML = `Ziel erreicht bei x = ${currentX.toFixed(4)}<br>` + consoleLog.innerHTML;
        }
    }, 100);
}

function updateOptPlot(f, pathX, pathY) {
    const xBase = [], yBase = [];
    for (let x = -5; x <= 5; x += 0.1) {
        xBase.push(x);
        yBase.push(f(x));
    }

    const data = [
        { x: xBase, y: yBase, name: 'Loss Landscape', line: {color: '#94a3b8'} },
        { x: pathX, y: pathY, name: 'Pfad', mode: 'lines+markers', marker: {color: '#ef4444'}, line: {color: '#ef4444'} },
        { x: [pathX[pathX.length-1]], y: [pathY[pathY.length-1]], mode: 'markers', marker: {size: 15, color: '#10b981'} }
    ];

    Plotly.react('plot-optimizer', data, {
        margin: { t: 10, b: 30, l: 30, r: 10 },
        showlegend: false,
        xaxis: { range: [-5, 5] },
        yaxis: { range: [-2, 20] }
    });
}

// Initialer Plot
window.addEventListener('load', () => {
    const f = (x) => x * x + Math.sin(5 * x) / 2;
    updateOptPlot(f, [], []);
    document.getElementById('opt-lr').oninput = (e) => 
        document.getElementById('opt-lr-val').innerText = `LR = ${e.target.value}`;
});
