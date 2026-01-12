function initDerivativeLab() {
    const controls = {
        select: document.getElementById('deriv-func-select'),
        xSlider: document.getElementById('deriv-x-slider'),
        hSlider: document.getElementById('deriv-h-slider'),
        xDisp: document.getElementById('deriv-x-value'),
        hDisp: document.getElementById('deriv-h-value'),
        mathDisp: document.getElementById('math-output'),
        aiDisp: document.getElementById('ai-logic'),
        stepBtn: document.getElementById('take-step')
    };

    let currentSlope = 0;

    function update() {
        const xPos = parseFloat(controls.xSlider.value);
        const h = parseFloat(controls.hSlider.value);
        const f = (x) => eval(controls.select.value);
        
        controls.xDisp.innerText = `x = ${xPos.toFixed(2)}`;
        controls.hDisp.innerText = `h = ${h.toFixed(4)}`;

        const xValues = [], yValues = [];
        for (let i = -5; i <= 5; i += 0.05) {
            xValues.push(i);
            yValues.push(f(i));
        }

        const f_x = f(xPos);
        const f_xh = f(xPos + h);
        currentSlope = (f_xh - f_x) / h;

        const tangentLine = xValues.map(x => currentSlope * (x - xPos) + f_x);

        const data = [
            { x: xValues, y: yValues, name: 'f(x)', line: {color: '#3b82f6', width: 2} },
            { x: [xPos, xPos + h], y: [f_x, f_xh], mode: 'markers+lines', name: 'Secant', marker: {color: '#ef4444'} },
            { x: xValues, y: tangentLine, name: "f'(x)", line: {color: '#10b981', dash: 'dash'} }
        ];

        Plotly.newPlot('plot-derivative', data, {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            xaxis: { range: [-4, 4] },
            yaxis: { range: [-2, 8] },
            showlegend: false
        });

        // Update MathJax Content
        controls.mathDisp.innerHTML = `
            $$\\Delta y = ${f_xh.toFixed(3)} - ${f_x.toFixed(3)} = ${(f_xh - f_x).toFixed(3)}$$
            $$\\frac{\\Delta y}{\\Delta x} = \\frac{{${(f_xh - f_x).toFixed(3)}}}{{${h.toFixed(3)}}}$$
            $$\\mathbf{Slope \\approx ${currentSlope.toFixed(4)}}$$
        `;

        const action = currentSlope > 0 ? "Decrease $x$" : "Increase $x$";
        controls.aiDisp.innerHTML = `
            To reach the minimum (Loss = 0): <br>
            <b>AI must: ${action}</b> <br>
            Current Gradient: ${currentSlope.toFixed(2)}
        `;

        // Trigger MathJax re-render
        if (window.MathJax) {
            MathJax.typesetPromise([controls.mathDisp, controls.aiDisp]);
        }
    }

    controls.stepBtn.addEventListener('click', () => {
        const lr = 0.15; // Learning Rate
        controls.xSlider.value = parseFloat(controls.xSlider.value) - (lr * currentSlope);
        update();
    });

    Object.values(controls).forEach(c => c?.addEventListener?.('input', update));
    update();
}

window.addEventListener('load', initDerivativeLab);
