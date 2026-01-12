const evoSpaces = {
	'1d': {
		vocab: { 
			'Deep Freeze': [-50, 0, 0],
			'Freezing': [-30, 0, 0], 
			'Arctic': [-20, 0, 0],
			'Icy': [-10, 0, 0], 
			'Frosty': [-2, 0, 0],
			'Cold': [5, 0, 0], 
			'Chilly': [12, 0, 0],
			'Mild': [20, 0, 0], 
			'Room Temp': [25, 0, 0],
			'Warm': [35, 0, 0],
			'Toasty': [45, 0, 0],
			'Hot': [60, 0, 0], 
			'Sweltering': [75, 0, 0],
			'Scalding': [85, 0, 0], 
			'Boiling': [100, 0, 0],
			'Steam': [120, 0, 0]
		},
		axes: { x: 'Temperature (°C)' }, 
		dims: 1,
        rangeX: [-60, 140] 
	},
	'2d': {
		vocab: { 
			'Man': [5, -10, 0], 'Woman': [5, 10, 0], 
			'Boy': [-10, -10, 0], 'Girl': [-10, 10, 0],
			'Worker': [-15, -10, 0], 'Prince': [15, -10, 0],
			'King': [35, -10, 0], 'Queen': [35, 10, 0],
			'Power': [15, 0, 0], 'Childhood': [-20, 0, 0],
			'Princess': [15, 10, 0]
		},
		axes: { x: 'Power / Age', y: 'Gender' }, 
		dims: 2,
        rangeX: [-30, 40]
	},
	'3d': {
		vocab: {
			'Human': [0, 0, 0], 'Man': [0, -10, 0], 'Woman': [0, 10, 0], 
			'King': [15, -10, 0], 'Queen': [15, 10, 0],
			'God': [25, -10, 25], 'Goddess': [25, 10, 25], 
			'Animal': [0, 0, -20], 'Dog': [0, -5, -20], 'Lion': [18, -5, -20], 
			'Robot': [10, 0, -30], 'Power': [5, 0, 0], 'Weak': [-15, 0, 0]
		},
		axes: { x: 'Power', y: 'Gender', z: 'Species' }, 
		dims: 3,
        rangeX: [-30, 30]
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
    const rangeX = space.rangeX || [-30, 30];
    let traces = [];

    Object.keys(space.vocab).forEach(word => {
        const v = space.vocab[word];
        let trace = {
            x: [v[0]], y: [v[1]],
            mode: 'markers+text',
            name: word, text: [word], textposition: 'top center',
            marker: { size: 6, opacity: 0.5, color: '#94a3b8' },
            cliponaxis: false // Verhindert das Abschneiden von Text am Rand
        };
        if (is3D) {
            trace.type = 'scatter3d';
            trace.z = [v[2]];
        } else {
            trace.type = 'scatter';
        }
        traces.push(trace);
    });

    steps.forEach(step => {
        let line = {
            x: [step.from[0], step.to[0]],
            y: [step.from[1], step.to[1]],
            mode: 'lines',
            line: { color: '#3b82f6', width: 3 },
            hoverinfo: 'skip'
        };

        if (is3D) {
            line.type = 'scatter3d';
            line.z = [step.from[2], step.to[2]];
        } else {
            line.type = 'scatter';
        }
        traces.push(line);
    });

    if (highlightPos) {
        let res = {
            x: [highlightPos[0]], y: [highlightPos[1]],
            mode: 'markers', marker: { size: 12, color: '#ef4444', symbol: 'diamond' }
        };
        if (is3D) { res.type = 'scatter3d'; res.z = [highlightPos[2]]; } 
        else { res.type = 'scatter'; }
        traces.push(res);
    }

    const layout = {
        margin: { l: 50, r: 50, b: 50, t: 20 }, // Mehr Padding für Text
        showlegend: false,
        xaxis: { range: rangeX, title: space.axes.x },
        yaxis: { range: [-30, 30], title: space.axes.y || '', visible: space.dims > 1 }
    };

    if (is3D) {
        layout.scene = {
            xaxis: { title: space.axes.x, range: rangeX },
            yaxis: { title: space.axes.y, range: [-30, 30] },
            zaxis: { title: space.axes.z, range: [-30, 30] }
        };
    }

    Plotly.react(divId, traces, layout);
}

function calcEvo(key) {
	const inputVal = document.getElementById(`input-${key}`).value;
	const space = evoSpaces[key];
	const resDiv = document.getElementById(`res-${key}`);

	const tokens = inputVal.match(/[a-zA-ZäöüÄÖÜ\s]+|\d*\.\d+|\d+|[\+\-\*\/\(\)]/g);
	if (!tokens) return;

	let pos = 0;
	let steps = [];

	const toVecTex = (arr) => `\\begin{pmatrix} ${arr.slice(0, space.dims).map(v => v.toFixed(1)).join(' \\\\ ')} \\end{pmatrix}`;

	function peek() { return tokens[pos]; }
	function consume() { return tokens[pos++].trim(); }

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
			return { val: [s, 0, 0], tex: `${s}`, isScalar: true, label: `${s}` };
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
			if (op === '*') {
				left.val = left.val.map((v, i) => left.isScalar ? left.val[0] * right.val[i] : v * (right.isScalar ? right.val[0] : 1));
			}
			left.label = `${left.label}${op}${right.label}`;
		}
		return left;
	}

	function parseExpression() {
		let left = parseTerm();
		while (peek() === '+' || peek() === '-') {
			let op = consume();
			let right = parseTerm();
			let prev = [...left.val];
			left.val = left.val.map((v, i) => op === '+' ? v + right.val[i] : v - right.val[i]);
			steps.push({ from: prev, to: [...left.val], label: `${op}${right.label}` });
			left.label = `${left.label}${op}${right.label}`;
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

		resDiv.innerHTML = `<div>$$ Result \\approx \\text{${nearest}} $$</div>`;
		if (window.MathJax) MathJax.typesetPromise([resDiv]);
		renderSpace(key, result.val, steps);
	} catch(e) { resDiv.innerText = "Error"; }
}
