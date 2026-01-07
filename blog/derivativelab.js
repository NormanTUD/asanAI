function initDerivativeLab() {
    const controls = {
        select: document.getElementById('deriv-func-select'),
        xSlider: document.getElementById('deriv-x-slider'),
        hSlider: document.getElementById('deriv-h-slider'),
        zSlider: document.getElementById('deriv-zoom-slider'),
        xDisp: document.getElementById('deriv-x-value'),
        hDisp: document.getElementById('deriv-h-value'),
        mathDisp: document.getElementById('deriv-math-details')
    };

    function update() {
        const xPos = parseFloat(controls.xSlider.value);
        const h = parseFloat(controls.hSlider.value);
        const zoom = parseFloat(controls.zSlider.value);
        const funcStr = controls.select.value;
        
        const f = (x) => eval(funcStr);
        
        controls.xDisp.innerText = `x = ${xPos.toFixed(2)}`;
        controls.hDisp.innerText = `h = ${h.toFixed(4)}`;

        const xValues = [], yValues = [];
        const range = 10 / zoom;
        for (let i = xPos - range; i <= xPos + range; i += range/100) {
            xValues.push(i);
            yValues.push(f(i));
        }

        const f_x = f(xPos);
        const f_xh = f(xPos + h);
        const slope = (f_xh - f_x) / h;

        // Tangente zur Visualisierung
        const tangentLine = xValues.map(x => slope * (x - xPos) + f_x);

        const data = [
            { x: xValues, y: yValues, name: 'Funktion', line: {color: '#3b82f6', width: 3} },
            { x: [xPos, xPos + h], y: [f_x, f_xh], mode: 'markers+lines', name: 'Sekante', marker: {size: 10, color: '#ef4444'}, line: {dash: 'dot', color: '#ef4444'} },
            { x: xValues, y: tangentLine, name: 'Ableitung', line: {color: '#10b981', width: 2} }
        ];

        const layout = {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            xaxis: { range: [xPos - range/2, xPos + range/2], gridcolor: '#e2e8f0' },
            yaxis: { range: [f_x - range/2, f_x + range/2], gridcolor: '#e2e8f0' },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false
        };

        Plotly.newPlot('plot-derivative', data, layout);

        controls.mathDisp.innerHTML = `
            <span style="color:#94a3b8">Punkt A:</span> (${xPos.toFixed(2)}, ${f_x.toFixed(2)})<br>
            <span style="color:#94a3b8">Punkt B:</span> (${(xPos+h).toFixed(2)}, ${f_xh.toFixed(2)})<br>
            <hr style="border:0; border-top:1px solid #334155; margin:10px 0;">
            <span style="color:#10b981">Δy / Δx:</span><br>
            (${f_xh.toFixed(3)} - ${f_x.toFixed(3)}) / ${h.toFixed(3)}<br><br>
            <b style="font-size:1.2em">Steigung: ${slope.toFixed(4)}</b><br>
            <p style="font-size:0.8em; color:#94a3b8; margin-top:10px;">
                *Je kleiner h, desto genauer weiß die KI, in welche Richtung sie lernen muss.
            </p>
        `;
    }

    Object.values(controls).forEach(c => {
        if(c.addEventListener) c.addEventListener('input', update);
    });
    update();
}

window.addEventListener('load', initDerivativeLab);
