function initPureActivationLab() {
	const typeSelect = document.getElementById('pure-act-type');
	const mathBox = document.getElementById('pure-math-box');
	const titleDisp = document.getElementById('act-title');
	const descDisp = document.getElementById('act-description');

	const acts = {
		relu: {
			name: "ReLU (Rectified Linear Unit)",
			fn: (x) => Math.max(0, x),
			tex: "f(x) = \\max(0, x)",
			use: "The **industry standard** for hidden layers in Deep Learning. It is computationally efficient and helps networks train faster.",
			pro: "Solves the vanishing gradient problem for positive values and is extremely fast to compute.",
			con: "**Dying ReLU problem:** If a neuron gets stuck in the negative range, it outputs 0 and its gradient becomes 0, effectively 'dying' forever."
		},
		sigmoid: {
			name: "Sigmoid / Logistic",
			fn: (x) => 1 / (1 + Math.exp(-x)),
			tex: "f(x) = \\frac{1}{1 + e^{-x}}",
			use: "Primarily used in the **output layer for binary classification**. It maps any input to a probability between 0 and 1.",
			pro: "Smooth gradient and clear probabilistic interpretation.",
			con: "**Vanishing Gradients:** For very high or low inputs, the function becomes flat. The derivative becomes near-zero, stopping the network from learning."
		},
		tanh: {
			name: "Hyperbolic Tangent (Tanh)",
			fn: (x) => Math.tanh(x),
			tex: "f(x) = \\tanh(x)",
			use: "Often preferred over Sigmoid for hidden layers because the data becomes **zero-centered** (range -1 to 1).",
			pro: "Stronger gradients than Sigmoid; centered output helps the next layer's learning process.",
			con: "Still suffers from the vanishing gradient problem when values are far from zero."
		},
		leaky_relu: {
			name: "Leaky ReLU",
			fn: (x) => x >= 0 ? x : 0.1 * x,
			tex: "f(x) = \\max(0.1x, x)",
			use: "An attempt to fix the 'Dying ReLU' problem by allowing a small, non-zero gradient when the input is negative.",
			pro: "Prevents neurons from 'dying' by ensuring they always contribute at least a small amount to the gradient.",
			con: "The leak hyperparameter (0.1) may need tuning for specific tasks."
		},
		identity: {
			name: "Identity / Linear",
			fn: (x) => x,
			tex: "f(x) = x",
			use: "Used in the **output layer for regression tasks** where the output can be any real number.",
			pro: "Does not bound the output; preserves the full range of calculated values.",
			con: "A network with only linear activations is just a linear model, no matter how deep it is."
		}
	};

	function update() {
		const type = typeSelect.value;
		const selected = acts[type];

		const xValues = [], yValues = [];
		for (let x = -5; x <= 5; x += 0.05) {
			xValues.push(x);
			yValues.push(selected.fn(x));
		}

		const data = [{
			x: xValues, y: yValues,
			line: { color: '#10b981', width: 3, shape: type === 'step' ? 'hv' : 'linear' }
		}];

		Plotly.newPlot('plot-pure-activation', data, {
			margin: { t: 10, b: 30, l: 30, r: 10 },
			xaxis: { title: 'Input (z)', range: [-5, 5] },
			yaxis: { title: 'Output f(z)', range: [-1.2, 1.2] }
		});

		// Update LaTeX
		mathBox.innerHTML = `$ ${selected.tex} $`;
		if (window.MathJax) MathJax.typesetPromise([mathBox]);

		titleDisp.innerText = selected.name;

		// Injecting raw Markdown
		descDisp.innerHTML = `
		${selected.use}

* ✅ **Advantage:** ${selected.pro}
* ❌ **Disadvantage:** ${selected.con}
	`;

		// If your system uses a specific function to parse Markdown after injection, call it here.
		// For example, if using a standard library: 
		// descDisp.innerHTML = marked.parse(descDisp.innerHTML);
		renderMarkdown()
	}

	typeSelect.onchange = update;
	update();
}

/**
 * Softmax Lab: Visualizing how raw scores (logits) 
 * compete for a slice of the probability pie.
 */
function initSoftmaxLab() {
    const controlsContainer = document.getElementById('softmax-controls');
    const mathBox = document.getElementById('softmax-math');
    
    let logits = [0.2, 0.8]; // Start-Werte aus deinem Beispiel
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    function calculateSoftmax(arr) {
        const maxLogit = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x)); // Hier rechnen wir e^x
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return { 
            probs: exps.map(x => x / sumExps), 
            exps: exps, 
            total: sumExps 
        };
    }

    function renderInputs() {
        controlsContainer.innerHTML = '';
        logits.forEach((val, i) => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="color:${colors[i % colors.length]}; font-weight:bold;">Klasse ${String.fromCharCode(65 + i)}</label>
                    ${logits.length > 2 ? `<button class="remove-btn" data-index="${i}" style="color:#ef4444; cursor:pointer; background:none; border:none;">&times;</button>` : ''}
                </div>
                <input type="number" class="softmax-input" data-index="${i}" value="${val}" step="0.1" style="width:100%; padding:5px; border-radius:4px; border:1px solid #ccc;">
            `;
            controlsContainer.appendChild(div);
        });

        document.querySelectorAll('.softmax-input').forEach(input => {
            input.addEventListener('input', (e) => {
                logits[e.target.dataset.index] = parseFloat(e.target.value) || 0;
                update();
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                logits.splice(e.target.dataset.index, 1);
                renderInputs();
                update();
            });
        });
    }

    function update() {
        const result = calculateSoftmax(logits);
        const labels = logits.map((_, i) => `Klasse ${String.fromCharCode(65 + i)}`);

        Plotly.newPlot('softmax-pie-plot', [{
            values: result.probs.map(p => p * 100),
            labels: labels,
            type: 'pie',
            hole: 0.4,
            marker: { colors: colors },
            textinfo: 'label+percent'
        }], { height: 350, margin: { t: 40, b: 10, l: 10, r: 10 }, showlegend: false });

        Plotly.newPlot('softmax-bar-plot', [{
            x: logits,
            y: labels,
            type: 'bar',
            orientation: 'h',
            marker: { color: colors.slice(0, logits.length) }
        }], { height: 350, margin: { t: 40, b: 40, l: 60, r: 20 }, xaxis: { title: 'Input Score' } });

        // Detaillierte Formel-Anzeige
        let mathHtml = `<div style="text-align:left; font-size:0.9em;"><b>Calculation Path:</b><br>`;
        logits.forEach((val, i) => {
            mathHtml += `
                <span style="color:${colors[i % colors.length]}">●</span> 
                $e^{${val}} = ${result.exps[i].toFixed(2)}$ &nbsp;&nbsp;→&nbsp;&nbsp; 
                $${result.exps[i].toFixed(2)} / ${result.total.toFixed(2)} = ${(result.probs[i]*100).toFixed(1)}\\%$<br>`;
        });
        mathHtml += `</div>`;
        mathBox.innerHTML = mathHtml;
        if (window.MathJax) MathJax.typesetPromise([mathBox]);
    }

    document.getElementById('add-class-btn').addEventListener('click', () => {
        if (logits.length < 7) {
            logits.push(0.0);
            renderInputs();
            update();
        }
    });

    renderInputs();
    update();
}

window.addEventListener('load', () => {
	if (document.getElementById('softmax-controls')) initSoftmaxLab();
});

window.addEventListener('load', initPureActivationLab);
