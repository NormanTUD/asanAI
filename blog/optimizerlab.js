let optInterval = null;
let pathX = [];
let pathY = [];
let currentX = -3.5;
let isRunning = false;

// Optimizer Internal States
let velocity = 0;
let m = 0, v = 0, t = 0;

const f = (x) => x * x + Math.sin(5 * x) / 2;
const df = (x) => 2 * x + (5 * Math.cos(5 * x)) / 2;

function toggleOptimizer() {
    if (isRunning) {
        pauseOptimizer();
    } else {
        startOptimizer();
    }
}

function startOptimizer() {
    const type = document.getElementById('opt-type').value;
    const lr = parseFloat(document.getElementById('opt-lr').value);
    const maxEpochs = parseInt(document.getElementById('opt-epochs').value);
    const consoleLog = document.getElementById('opt-console');
    const mainBtn = document.getElementById('btn-run-opt');
    const restartBtn = document.getElementById('btn-restart-opt');

    let stepsTaken = 0;
    isRunning = true;
    mainBtn.innerHTML = "⏸ Pause Training";
    restartBtn.style.display = "block";
    consoleLog.innerHTML = `Running for ${maxEpochs} epochs...<br>` + consoleLog.innerHTML;

    optInterval = setInterval(() => {
        const grad = df(currentX);
        t++; // Total steps across all "continues" for Adam bias correction
        stepsTaken++;

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
        updateOptPlot();

        // Stop only when the requested number of epochs is reached
        if (stepsTaken >= maxEpochs) {
            pauseOptimizer(`Finished ${maxEpochs} steps.`);
        }
    }, 100);
}

function pauseOptimizer(msg = "Paused") {
    clearInterval(optInterval);
    isRunning = false;
    document.getElementById('btn-run-opt').innerHTML = "▶ Continue Training";
    document.getElementById('opt-console').innerHTML = `${msg}<br>` + document.getElementById('opt-console').innerHTML;
}

function resetOptimizer() {
    clearInterval(optInterval);
    isRunning = false;
    
    currentX = parseFloat(document.getElementById('opt-start-x').value);
    pathX = [currentX];
    pathY = [f(currentX)];
    
    // Reset optimizer memory
    velocity = 0; m = 0; v = 0; t = 0;

    document.getElementById('btn-run-opt').innerHTML = "▶ Start Simulation";
    document.getElementById('btn-restart-opt').style.display = "none";
    document.getElementById('opt-console').innerHTML = "Reset to starting position.<br>";
    updateOptPlot();
}

function updateOptPlot() {
    const xBase = [], yBase = [];
    for (let x = -5; x <= 5; x += 0.1) {
        xBase.push(x);
        yBase.push(f(x));
    }

    const data = [
        { x: xBase, y: yBase, name: 'Landscape', line: {color: '#94a3b8', width: 1} },
        { x: pathX, y: pathY, name: 'Path', mode: 'lines+markers', marker: {color: '#ef4444', size: 4}, line: {color: '#ef4444'} },
        { x: [currentX], y: [f(currentX)], mode: 'markers', marker: {size: 14, color: '#10b981'} }
    ];

    Plotly.react('plot-optimizer', data, {
        margin: { t: 10, b: 30, l: 30, r: 10 },
        showlegend: false,
        xaxis: { range: [-5, 5], fixedrange: true },
        yaxis: { range: [-2, 20], fixedrange: true }
    });
}

window.addEventListener('load', () => {
    currentX = parseFloat(document.getElementById('opt-start-x').value);
    pathX = [currentX];
    pathY = [f(currentX)];
    updateOptPlot();

    // Live update when sliding (only when not running)
    document.getElementById('opt-start-x').oninput = (e) => {
        if (!isRunning) {
            currentX = parseFloat(e.target.value);
            pathX = [currentX];
            pathY = [f(currentX)];
            updateOptPlot();
        }
    };

    document.getElementById('opt-lr').oninput = (e) => 
        document.getElementById('opt-lr-val').innerText = `LR = ${e.target.value}`;
});
