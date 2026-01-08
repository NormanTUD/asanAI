const evoSpaces = {
	'1d': {
		vocab: { 
			'Eisig': [-20, 0, 0], 
			'Frostig': [-12, 0, 0], 
			'Kalt': [-7, 0, 0], 
			'Lauwarm': [2, 0, 0], 
			'Mild': [8, 0, 0],
			'Warm': [15, 0, 0], 
			'Heiß': [22, 0, 0], 
			'Siedend': [28, 0, 0] 
		},
		axes: { x: 'Temperatur' }, 
		dims: 1
	},
	'2d': {
		vocab: { 
			// Basis-Personen
			'Man': [5, -10, 0], 
			'Woman': [5, 10, 0], 
			'Boy': [-10, -10, 0], 
			'Girl': [-10, 10, 0],

			// Macht-Hierarchie
			'Worker': [-15, -10, 0],
			'Knight': [15, -10, 0],
			'King': [25, -10, 0], 
			'Queen': [25, 10, 0],

			// Richtungs-Vektoren
			'Power': [15, 0, 0], 
			'Childhood': [-20, 0, 0]
		},
		axes: { x: 'Power / Alter', y: 'Gender' }, 
		dims: 2
	},
	'3d': {
		vocab: {
			// MENSCHEN (Z = 0)
			'Human': [0, 0, 0],
			'Man': [0, -10, 0], 
			'Male': [0, -20, 0], 
			'Woman': [0, 10, 0], 
			'Female': [0, 20, 0], 
			'King': [15, -10, 0], 
			'Queen': [15, 10, 0],
			'Prince': [8, -10, 0], 
			'Princess': [8, 10, 0],

			// GÖTTLICH & ÜBERNATÜRLICH (Z > 0)
			'Divine': [0, 0, 25],
			'God': [25, -10, 25], 
			'Goddess': [25, 10, 25], 
			'Demigod': [12, -10, 12], // Zwischen Mensch und Gott

			// NATUR & TIERE (Z < 0)
			'Animal': [0, 0, -20],
			'Dog': [0, -5, -20], 
			'Cat': [0, 5, -20], 
			'Lion': [18, -5, -20], 
			'Lioness': [18, 5, -20],
			'Centaur': [10, -10, -10], // Zwischen Mensch und Tier

			// TECHNIK & OBJEKTE (Extremwerte)
			'Robot': [10, 0, -30],     // Künstlich/Naturfern
			'Pizza': [5, 0, -20],

			// REINE RICHTUNGS-VEKTOREN
			'Power': [5, 0, 0],
			'Weak': [-15, 0, 0]
		},
		axes: { x: 'Power (Macht)', y: 'Gender', z: 'Species (Natur)' }, 
		dims: 3
	}
};

window.addEventListener('load', () => {
	setTimeout(() => {
		Object.keys(evoSpaces).forEach(key => renderSpace(key));
	}, 200);
});

function renderSpace(key, highlightPos = null, steps = []) {
    const divId = `plot-${key}`;
    const plotDiv = document.getElementById(divId);
    if (!plotDiv) return;

    const space = evoSpaces[key];
    const is3D = (space.dims === 3);
    let traces = [];

    // Basis-Vokabular
    Object.keys(space.vocab).forEach(word => {
        const v = space.vocab[word];
        let trace = {
            x: [v[0]], y: [v[1]],
            mode: 'markers+text',
            name: word, text: [word], textposition: 'top center',
            marker: { size: 6, opacity: 0.5, color: '#94a3b8' }
        };
        if (is3D) {
            trace.type = 'scatter3d';
            trace.z = [v[2]];
        } else {
            trace.type = 'scatter';
        }
        traces.push(trace);
    });

    // Pfad-Visualisierung (Blaue Pfeile + Beschriftung)
    steps.forEach(step => {
        // Die Linie
        let line = {
            x: [step.from[0], step.to[0]],
            y: [step.from[1], step.to[1]],
            mode: 'lines',
            line: { color: '#3b82f6', width: 3 },
            hoverinfo: 'skip'
        };

        // Der Text (in der Mitte des Pfeils)
        let midX = (step.from[0] + step.to[0]) / 2;
        let midY = (step.from[1] + step.to[1]) / 2;
        let midZ = is3D ? (step.from[2] + step.to[2]) / 2 : null;

        let labelTrace = {
            x: [midX], y: [midY],
            mode: 'text',
            text: [step.label],
            textposition: 'top right',
            textfont: { color: '#1d4ed8', size: 12, weight: 'bold' },
            hoverinfo: 'skip'
        };

        if (is3D) {
            line.type = 'scatter3d';
            line.z = [step.from[2], step.to[2]];
            labelTrace.type = 'scatter3d';
            labelTrace.z = [midZ];
        } else {
            line.type = 'scatter';
            labelTrace.type = 'scatter';
        }

        traces.push(line);
        traces.push(labelTrace);
        
        // Pfeilspitzen
        if (is3D) {
            traces.push({
                type: 'cone', x: [step.to[0]], y: [step.to[1]], z: [step.to[2]],
                u: [step.to[0]-step.from[0]], v: [step.to[1]-step.from[1]], w: [step.to[2]-step.from[2]],
                sizemode: 'absolute', sizeref: 2, showscale: false, colorscale: [[0, '#3b82f6'], [1, '#3b82f6']]
            });
        } else {
            traces.push({
                x: [step.to[0]], y: [step.to[1]],
                mode: 'markers',
                marker: { symbol: 'arrow-bar-up', size: 10, color: '#3b82f6', angleref: 'previous' },
                type: 'scatter', hoverinfo: 'skip'
            });
        }
    });

    if (highlightPos) {
        let res = {
            x: [highlightPos[0]], y: [highlightPos[1]],
            mode: 'markers', marker: { size: 12, color: '#ef4444', symbol: 'diamond' }
        };
        if (is3D) {
            res.type = 'scatter3d';
            res.z = [highlightPos[2]];
        } else {
            res.type = 'scatter';
        }
        traces.push(res);
    }

    const layout = {
        margin: { l: 20, r: 20, b: 20, t: 20 },
        showlegend: false,
        xaxis: { range: [-30, 30], title: space.axes.x },
        yaxis: { range: [-30, 30], title: space.axes.y || '', visible: space.dims > 1 }
    };

    if (is3D) {
        layout.scene = {
            xaxis: { title: space.axes.x, range: [-30, 30] },
            yaxis: { title: space.axes.y, range: [-30, 30] },
            zaxis: { title: space.axes.z, range: [-30, 30] }
        };
    }

    if (plotDiv.classList.contains('js-plotly-plot')) {
        Plotly.react(divId, traces, layout);
    } else {
        Plotly.newPlot(divId, traces, layout);
    }
}

function calcEvo(key) {
	const inputVal = document.getElementById(`input-${key}`).value;
	const space = evoSpaces[key];
	const resDiv = document.getElementById(`res-${key}`);

	const tokens = inputVal.match(/[a-zA-ZäöüÄÖÜ]+|\d*\.\d+|\d+|[\+\-\*\/\(\)]/g);
	if (!tokens) return;

	let pos = 0;
	let steps = [];

	const toVecTex = (arr) => `\\begin{pmatrix} ${arr.slice(0, space.dims).map(v => v.toFixed(1)).join(' \\\\ ')} \\end{pmatrix}`;

	function peek() { return tokens[pos]; }
	function consume() { return tokens[pos++]; }

	function parseFactor() {
		let token = consume();
		if (token === '(') {
			let res = parseExpression();
			consume(); 
			return { val: res.val, tex: `\\left( ${res.tex} \\right)`, isScalar: res.isScalar, label: res.label };
		}
		if (token === '-') {
			let res = parseFactor();
			return { val: res.val.map(v => -v), tex: `-${res.tex}`, isScalar: res.isScalar, label: `-${res.label}` };
		}
		if (!isNaN(token)) {
			const s = parseFloat(token);
			return { val: [s, s, s], tex: `${s}`, isScalar: true, label: `${s}` };
		}

		const vec = [...(space.vocab[token] || [0, 0, 0])];
		return { 
			val: vec, 
			tex: `\\underbrace{${toVecTex(vec)}}_{\\text{${token}}}`,
			isScalar: false,
			label: token
		};
	}

	function parseTerm() {
		let left = parseFactor();
		while (peek() === '*' || peek() === '/') {
			let op = consume();
			let right = parseFactor();
			let opTex = op === '*' ? '\\cdot' : '\\div';

			if (op === '*') {
				if (left.isScalar) {
					left.val = right.val.map(v => left.val[0] * v);
					left.isScalar = right.isScalar;
					left.label = `${left.label}·${right.label}`;
				} else {
					left.val = left.val.map(v => v * right.val[0]);
					left.label = `${left.label}·${right.label}`;
				}
			} else if (op === '/') {
				left.val = left.val.map(v => v / (right.val[0] || 1));
				left.label = `${left.label}/${right.label}`;
			}

			left.tex = `${left.tex} ${opTex} ${right.tex}`;
		}
		return left;
	}

	function parseExpression() {
		let left = parseTerm();
		while (peek() === '+' || peek() === '-') {
			let op = consume();
			let right = parseTerm();
			let prev = [...left.val];

			if (op === '+') {
				left.val = left.val.map((v, i) => v + right.val[i]);
			} else if (op === '-') {
				left.val = left.val.map((v, i) => v - right.val[i]);
			}

			steps.push({ 
				from: prev, 
				to: [...left.val], 
				label: `${op}${right.label}` 
			});

			left.tex = `${left.tex} ${op} ${right.tex}`;
			left.isScalar = left.isScalar && right.isScalar;
		}
		return left;
	}

	try {
		const result = parseExpression();

		let nearest = "None";
		let minDist = Infinity;
		Object.keys(space.vocab).forEach(w => {
			const v = space.vocab[w];
			const d = Math.sqrt(v.reduce((s, val, i) => s + Math.pow(val - result.val[i], 2), 0));
			if (d < minDist) { minDist = d; nearest = w; }
		});

		const isExact = minDist < 0.01;
		const symbol = isExact ? "=" : "\\approx";

		resDiv.innerHTML = `
	    <div style="overflow-x: auto; padding: 15px 0; font-size: 1.1em;">
		$$ ${result.tex} = ${toVecTex(result.val)} ${symbol} \\text{${nearest}} $$
	    </div>
	`;

		if (window.MathJax) {
			MathJax.typesetPromise([resDiv]);
		}

		renderSpace(key, result.val, steps);
	} catch(e) { 
		console.error(e);
		resDiv.innerText = "Syntax Fehler";
	}
}
