function initPureActivationLab() {
    const typeSelect = document.getElementById('pure-act-type');
    const mathBox = document.getElementById('pure-math-box');
    const titleDisp = document.getElementById('act-title');
    const descDisp = document.getElementById('act-description');

    const acts = {
        identity: {
            name: "Identity / Linear",
            fn: (x) => x,
            tex: "f(x) = x",
            use: "Wird meistens in der **letzten Schicht bei Regressions-Aufgaben** genutzt (z.B. wenn die KI einen Preis vorhersagen soll).",
            pro: "Verändert die Daten nicht.",
            con: "Kann keine komplexen Muster lernen, da sie linear bleibt."
        },
        sigmoid: {
            name: "Sigmoid",
            fn: (x) => 1 / (1 + Math.exp(-x)),
            tex: "f(x) = \\frac{1}{1 + e^{-x}}",
            use: "Ideal für **Binäre Klassifizierung** (Ja/Nein). Gibt Werte als Wahrscheinlichkeit zwischen 0 und 1 aus.",
            pro: "Sanfter Übergang, differenzierbar.",
            con: "Problem der 'Verschwindenden Gradienten' bei sehr hohen/niedrigen Werten."
        },
        relu: {
            name: "ReLU (Rectified Linear Unit)",
            fn: (x) => Math.max(0, x),
            tex: "f(x) = max(0, x)",
            use: "Der **Gold-Standard** für versteckte Schichten in fast allen modernen KIs.",
            pro: "Extrem schnell zu berechnen und verhindert Sättigung im positiven Bereich.",
            con: "Neuronen können 'sterben', wenn sie nur noch 0 ausgeben."
        },
        tanh: {
            name: "Tanh (Tangens Hyperbolicus)",
            fn: (x) => Math.tanh(x),
            tex: "f(x) = tanh(x)",
            use: "Gute Wahl für versteckte Schichten, wenn die Daten um den **Nullpunkt zentriert** sein sollen (-1 bis 1).",
            pro: "Stärkerer Gradient als Sigmoid.",
            con: "Ähnlich wie Sigmoid anfällig für Sättigung."
        },
        step: {
            name: "Step Function (Binary)",
            fn: (x) => x >= 0 ? 1 : 0,
            tex: "f(x) = \\begin{cases} 1 & x \\ge 0 \\\\ 0 & x < 0 \\end{cases}",
            use: "Wurde in den allerersten KIs (Perzeptron) genutzt. Heute fast nur noch theoretisch relevant.",
            pro: "Klare Ja/Nein Entscheidung.",
            con: "Nicht differenzierbar! Man kann sie nicht mit Gradient Descent trainieren, da die Steigung überall 0 ist (außer am Sprung)."
        }
    };

    function update() {
        const type = typeSelect.value;
        const selected = acts[type];
        
        const xValues = [], yValues = [];
        for (let x = -5; x <= 5; x += 0.05) { // feinere Auflösung
            xValues.push(x);
            yValues.push(selected.fn(x));
        }

        const data = [{
            x: xValues, y: yValues,
            line: { 
                color: '#22c55e', 
                width: 3,
                // Step-Funktion muss 'hv' (horizontal-then-vertical) gezeichnet werden!
                shape: type === 'step' ? 'hv' : 'linear' 
            }
        }];

        Plotly.newPlot('plot-pure-activation', data, {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            xaxis: { range: [-5, 5] },
            yaxis: { range: [-1.2, 1.2] }
        });

        // Texte & Mathe updaten
        titleDisp.innerText = selected.name;
        mathBox.innerHTML = `$$${selected.tex}$$`;
        if (window.MathJax) MathJax.typesetPromise([mathBox]);

        descDisp.innerHTML = `
            <p>${selected.use}</p>
            <p>✅ <b>Vorteil:</b> ${selected.pro}</p>
            <p>❌ <b>Nachteil:</b> ${selected.con}</p>
        `;
    }

    typeSelect.onchange = update;
    update();
}

window.addEventListener('load', initPureActivationLab);
