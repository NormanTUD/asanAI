function initPureActivationLab() {
    const typeSelect = document.getElementById('pure-act-type');
    const xSlider = document.getElementById('pure-x-input');
    const resultDisp = document.getElementById('pure-result-display');
    const mathBox = document.getElementById('pure-math-box');

    const acts = {
        identity: { fn: (x) => x, tex: "f(x) = x" },
        sigmoid: { fn: (x) => 1 / (1 + Math.exp(-x)), tex: "f(x) = \\frac{1}{1 + e^{-x}}" },
        relu: { fn: (x) => Math.max(0, x), tex: "f(x) = max(0, x)" },
        tanh: { fn: (x) => Math.tanh(x), tex: "f(x) = tanh(x)" },
        step: { fn: (x) => x >= 0 ? 1 : 0, tex: "f(x) = 1 \\text{ if } x \\ge 0 \\text{ else } 0" }
    };

    function update() {
        const type = typeSelect.value;
        const testX = parseFloat(xSlider.value);
        const selected = acts[type];
        
        const xValues = [], yValues = [];
        for (let x = -5; x <= 5; x += 0.1) {
            xValues.push(x);
            yValues.push(selected.fn(x));
        }

        const testY = selected.fn(testX);

        const data = [
            { x: xValues, y: yValues, name: 'Funktion', line: {color: '#22c55e', width: 3} },
            { x: [testX], y: [testY], mode: 'markers', marker: {size: 12, color: '#ef4444'}, name: 'Dein Input' }
        ];

        Plotly.newPlot('plot-pure-activation', data, {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            xaxis: { range: [-5, 5], title: "Input" },
            yaxis: { range: [-2, 2], title: "Output" }
        });

        mathBox.innerHTML = `$$${selected.tex}$$`;
        if (window.MathJax) MathJax.typesetPromise([mathBox]);
        
        resultDisp.innerText = `f(${testX.toFixed(2)}) = ${testY.toFixed(4)}`;
    }

    typeSelect.onchange = update;
    xSlider.oninput = update;
    update();
}

window.addEventListener('load', initPureActivationLab);
