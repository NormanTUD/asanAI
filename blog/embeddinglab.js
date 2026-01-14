const evoSpaces = {
	'1d': {
		vocab: { 
			'Freezing': [-30, 0, 0], 
			'Arctic': [-20, 0, 0],
			'Icy': [-10, 0, 0], 
			'Frosty': [-2, 0, 0],
			'Cold': [5, 0, 0], 
			'Chilly': [12, 0, 0],
			'Mild': [20, 0, 0], 
			'Warm': [35, 0, 0],
			'Hot': [60, 0, 0], 
			'Scalding': [85, 0, 0], 
			'Boiling': [100, 0, 0] 
		},
		axes: { x: 'Temperature (°C)' }, 
		dims: 1,
		rangeX: [-50, 120]
	},
	'2d': {
		vocab: { 
			'Man': [5, -10, 0], 'Woman': [5, 10, 0], 
			'Boy': [-10, -10, 0], 'Girl': [-10, 10, 0],
			'Prince': [15, -10, 0], 'Princess': [15, 10, 0], // Knight durch Prince ersetzt, Princess ergänzt
			'King': [25, -10, 0], 'Queen': [25, 10, 0],
			'Power': [15, 0, 0], 'Childhood': [-20, 0, 0]
		},
		axes: { x: 'Power / Age', y: 'Gender' }, 
		dims: 2,
		rangeX: [-30, 50]
	},
	'3d': {
		vocab: {
			'Human': [0, 0, 0], 'Man': [0, -10, 0], 'Woman': [0, 10, 0], 
			'Prince': [8, -10, 0], 'Princess': [8, 10, 0],
			'King': [15, -10, 0], 'Queen': [15, 10, 0],
			'Divine': [0, 0, 25], 
			'Demigod': [12, -10, 12], 'Demigoddess': [12, 10, 12],
			'God': [25, -10, 25], 'Goddess': [25, 10, 25], 
			'Animal': [0, 0, -20], 
			'Lion': [18, -10, -20], 'Lioness': [18, 10, -20], // Klare Gender-Trennung (-10, 10)
			'Tomcat': [0, -10, -20], 'Cat': [0, 10, -20],     // "Kater" vs "Katze"
			'Power': [15, 0, 0], 'Weak': [-15, 0, 0]
		},
		axes: { x: 'Power', y: 'Gender', z: 'Species' }, 
		dims: 3,
		rangeX: [-30, 30]
	}
};

function renderSpace(key, highlightPos = null, steps = []) {
    const divId = `plot-${key}`;
    const plotDiv = document.getElementById(divId);
    if (!plotDiv) return;

    const space = evoSpaces[key];
    const is3D = (space.dims === 3);
    const rangeX = space.rangeX || [-30, 30];
    let traces = [];
    let annotations = []; // Container for our 1D/2D arrows

    // Render Vocabulary Points
    Object.keys(space.vocab).forEach(word => {
        const v = space.vocab[word];
        let trace = {
            x: [v[0]], y: [v[1]],
            mode: 'markers+text',
            name: word, text: [word], textposition: 'top center',
            marker: { size: 6, opacity: 0.5, color: '#94a3b8' },
            cliponaxis: false
        };
        if (is3D) { trace.type = 'scatter3d'; trace.z = [v[2]]; } 
        else { trace.type = 'scatter'; }
        traces.push(trace);
    });

    // Render Calculation Steps (Paths)
    steps.forEach(step => {
        if (is3D) {
            // 3D Path logic using Lines + Cones
            traces.push({
                x: [step.from[0], step.to[0]], 
                y: [step.from[1], step.to[1]],
                z: [step.from[2], step.to[2]],
                mode: 'lines', 
                line: { color: '#3b82f6', width: 4 }, 
                hoverinfo: 'skip',
                type: 'scatter3d'
            });
            traces.push({
                type: 'cone', x: [step.to[0]], y: [step.to[1]], z: [step.to[2]],
                u: [step.to[0]-step.from[0]], v: [step.to[1]-step.from[1]], w: [step.to[2]-step.from[2]],
                sizemode: 'absolute', sizeref: 2, showscale: false, colorscale: [[0, '#3b82f6'], [1, '#3b82f6']]
            });
        } else {
            // 1D/2D Path logic using Annotations (Arrows)
            annotations.push({
                ax: step.from[0],
                ay: step.from[1],
                axref: 'x',
                ayref: 'y',
                x: step.to[0],
                y: step.to[1],
                xref: 'x',
                yref: 'y',
                showarrow: true,
                arrowhead: 2,
                arrowsize: 1.5,
                arrowwidth: 3,
                arrowcolor: '#3b82f6'
            });
        }
    });

    // Render Result Highlight
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
        margin: { l: 40, r: 40, b: 40, t: 20 },
        showlegend: false,
        xaxis: { range: rangeX, title: space.axes.x },
        yaxis: { range: [-30, 30], title: space.axes.y || '', visible: space.dims > 1 },
        annotations: annotations // Attach arrows to the layout
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

function renderComparison() {
    const divId = 'plot-comparison';
    const statsId = 'comparison-stats';
    const plotDiv = document.getElementById(divId);
    if (!plotDiv) return;

    const A = [12, 12];
    const B = [28, 28];
    const C = [-5, 25];

    const getMetrics = (v1, v2) => {
        const dot = v1[0] * v2[0] + v1[1] * v2[1];
        const mag1 = Math.sqrt(v1[0]**2 + v1[1]**2);
        const mag2 = Math.sqrt(v2[0]**2 + v2[1]**2);
        const cos = dot / (mag1 * mag2);
        return {
            dist: Math.sqrt((v1[0] - v2[0])**2 + (v1[1] - v2[1])**2).toFixed(1),
            cos: cos.toFixed(3),
            deg: (Math.acos(Math.min(1, Math.max(-1, cos))) * 180 / Math.PI).toFixed(1),
            angleRad: Math.acos(Math.min(1, Math.max(-1, cos))),
            startRad: Math.atan2(v1[1], v1[0]),
            endRad: Math.atan2(v2[1], v2[0])
        };
    };

    const statsC = getMetrics(A, C);
    const statsB = getMetrics(A, B);

    // Zeichnet einen echten kreisförmigen Bogen
    const createArcPath = (startRad, endRad, radius) => {
        const x1 = radius * Math.cos(startRad);
        const y1 = radius * Math.sin(startRad);
        const x2 = radius * Math.cos(endRad);
        const y2 = radius * Math.sin(endRad);
        const largeArc = Math.abs(endRad - startRad) > Math.PI ? 1 : 0;
        return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    const traces = [
        { x: [0, A[0]], y: [0, A[1]], name: 'A', mode: 'lines+markers', line: {width: 4, color: '#64748b'} },
        { x: [0, B[0]], y: [0, B[1]], name: 'B', mode: 'lines+markers', line: {width: 4, color: '#10b981'} },
        { x: [0, C[0]], y: [0, C[1]], name: 'C', mode: 'lines+markers', line: {width: 4, color: '#ef4444'} },
        // Distanz-Linie (Euclidean)
        { x: [A[0], C[0]], y: [A[1], C[1]], mode: 'lines', line: {dash: 'dot', color: '#cbd5e1', width: 2}, name: 'Distance' }
    ];

    const layout = {
        margin: { l: 30, r: 30, b: 30, t: 10 },
        showlegend: false,
        xaxis: { range: [-15, 35], fixedrange: true, zeroline: true },
        yaxis: { range: [-5, 35], fixedrange: true, zeroline: true },
        shapes: [{
            type: 'path',
            path: createArcPath(statsC.startRad, statsC.endRad, 8),
            fillcolor: 'rgba(239, 68, 68, 0.1)',
            line: { color: '#ef4444', width: 1 }
        }],
        annotations: [
            { x: A[0], y: A[1], text: 'A', showarrow: false, xshift: 10 },
            { x: C[0], y: C[1], text: `Cos: ${statsC.cos}`, showarrow: false, yshift: 15, font: {color: '#ef4444'} },
            { x: (A[0]+C[0])/2, y: (A[1]+C[1])/2, text: `d=${statsC.dist}`, showarrow: false, bgcolor: 'white', font: {size: 10} }
        ]
    };

    Plotly.react(divId, traces, layout);

    document.getElementById(statsId).innerHTML = `
        <div style="font-family: monospace; font-size: 0.9em;">
            <p><b style="color:#10b981">A → B:</b> Dist: ${statsB.dist} | Cos: ${statsB.cos} (0°)</p>
            <p><b style="color:#ef4444">A → C:</b> Dist: ${statsC.dist} | Cos: ${statsC.cos} (${statsC.deg}°)</p>
        </div>
    `;
}

function calcEvo(key) {
	const inputVal = document.getElementById(`input-${key}`).value;
	const space = evoSpaces[key];
	const resDiv = document.getElementById(`res-${key}`);

	// Create a lowercase map for lookups
	const lowerVocab = Object.keys(space.vocab).reduce((acc, word) => {
		acc[word.toLowerCase()] = { vec: space.vocab[word], original: word };
		return acc;
	}, {});

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
			return { val: [s, 0, 0], tex: `${s}`, isScalar: true, label: `${s}` };
		}

		// Perform case-insensitive lookup
		const entry = lowerVocab[token.toLowerCase()];
		const vec = [...(entry ? entry.vec : [0, 0, 0])];
		const displayName = entry ? entry.original : token;

		return { 
			val: vec, 
			tex: `\\underbrace{${toVecTex(vec)}}_{\\text{${displayName}}}`,
			isScalar: false,
			label: displayName
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
				} else {
					left.val = left.val.map(v => v * (right.isScalar ? right.val[0] : 1));
				}
			} else if (op === '/') {
				left.val = left.val.map(v => v / (right.val[0] || 1));
			}

			left.tex = `${left.tex} ${opTex} ${right.tex}`;
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

			if (op === '+') {
				left.val = left.val.map((v, i) => v + right.val[i]);
			} else if (op === '-') {
				left.val = left.val.map((v, i) => v - right.val[i]);
			}

			steps.push({ from: prev, to: [...left.val], label: `${op}${right.label}` });
			left.tex = `${left.tex} ${op} ${right.tex}`;
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

		const isExact = minDist < 0.01;
		const symbol = isExact ? "=" : "\\approx";

		resDiv.innerHTML = `
	    <div style="overflow-x: auto; padding: 15px 0; font-size: 1.1em;">
		$$ ${result.tex} = ${toVecTex(result.val)} ${symbol} \\text{${nearest}} $$
	    </div>
	`;
		if (window.MathJax) MathJax.typesetPromise([resDiv]);
		renderSpace(key, result.val, steps);
	} catch(e) { resDiv.innerText = "Syntax Error"; }
}

function renderComparison3D() {
    const divId = 'plot-comparison-3d';
    const statsId = 'comparison-stats-3d';
    const plotDiv = document.getElementById(divId);
    if (!plotDiv) return;

    // Vektoren in 3D
    const A = [10, 10, 5];
    const B = [20, 20, 10]; // Gleiche Richtung wie A
    const C = [-10, 15, 20]; // Andere Richtung

    const getMetrics3D = (v1, v2) => {
        const dot = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
        const mag1 = Math.sqrt(v1[0]**2 + v1[1]**2 + v1[2]**2);
        const mag2 = Math.sqrt(v2[0]**2 + v2[1]**2 + v2[2]**2);
        const cos = dot / (mag1 * mag2);
        const angleRad = Math.acos(Math.min(1, Math.max(-1, cos)));
        return {
            dist: Math.sqrt(v1.reduce((sum, val, i) => sum + (val - v2[i])**2, 0)).toFixed(1),
            cos: cos.toFixed(3),
            deg: (angleRad * 180 / Math.PI).toFixed(1),
            angleRad, mag1, mag2
        };
    };

    const statsC = getMetrics3D(A, C);

    // Bogen-Berechnung (Slerp-Prinzip für 3D)
    const arcPoints = { x: [], y: [], z: [] };
    const steps = 30;
    const arcRadius = 8;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps * statsC.angleRad;
        // Orthogonale Basis in der Ebene A-C finden
        // v = A / |A|
        const v = A.map(x => x / Math.sqrt(A[0]**2 + A[1]**2 + A[2]**2));
        // w = (C - (C·v)v) -> normalisieren
        const dotCv = C[0]*v[0] + C[1]*v[1] + C[2]*v[2];
        let w = C.map((x, i) => x - dotCv * v[i]);
        const magW = Math.sqrt(w[0]**2 + w[1]**2 + w[2]**2);
        w = w.map(x => x / magW);

        // Punkt auf dem Bogen: r * (cos(t)v + sin(t)w)
        arcPoints.x.push(arcRadius * (Math.cos(t) * v[0] + Math.sin(t) * w[0]));
        arcPoints.y.push(arcRadius * (Math.cos(t) * v[1] + Math.sin(t) * w[1]));
        arcPoints.z.push(arcRadius * (Math.cos(t) * v[2] + Math.sin(t) * w[2]));
    }

    const traces = [
        { type: 'scatter3d', x: [0, A[0]], y: [0, A[1]], z: [0, A[2]], name: 'A', mode: 'lines+markers', line: {width: 6, color: '#64748b'} },
        { type: 'scatter3d', x: [0, B[0]], y: [0, B[1]], z: [0, B[2]], name: 'B', mode: 'lines+markers', line: {width: 6, color: '#10b981'} },
        { type: 'scatter3d', x: [0, C[0]], y: [0, C[1]], z: [0, C[2]], name: 'C', mode: 'lines+markers', line: {width: 6, color: '#ef4444'} },
        // Der Winkel-Bogen
        { type: 'scatter3d', x: arcPoints.x, y: arcPoints.y, z: arcPoints.z, mode: 'lines', line: {width: 5, color: '#ef4444'}, name: 'Angle' },
        // Euclidean Distance A-C
        { type: 'scatter3d', x: [A[0], C[0]], y: [A[1], C[1]], z: [A[2], C[2]], mode: 'lines', line: {dash: 'dash', color: '#cbd5e1', width: 3}, name: 'Distance' }
    ];

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        showlegend: false,
        scene: {
            xaxis: { range: [-20, 25] },
            yaxis: { range: [-20, 25] },
            zaxis: { range: [0, 25] },
            camera: { eye: {x: 1.5, y: 1.5, z: 1.2} }
        }
    };

    Plotly.react(divId, traces, layout);

    document.getElementById(statsId).innerHTML = `
        <div style="font-family: monospace; padding: 10px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
            <b style="color:#ef4444">3D A → C:</b><br>
            Distance: ${statsC.dist}<br>
            Cosine: ${statsC.cos}<br>
            Angle: ${statsC.deg}°
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", function() {
	// 1. Definiere, was gerendert werden muss
	const tasks = [
		...Object.keys(evoSpaces).map(key => ({ type: 'space', id: `plot-${key}`, key: key })),
		{ type: 'comparison', id: 'plot-comparison' },
		{ type: 'comparison3d', id: 'plot-comparison-3d' }
	];

	// 2. Erstelle einen Observer für Lazy Loading (Performance-Boost)
	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const task = tasks.find(t => t.id === entry.target.id);
				if (task) {
					// Nutze requestAnimationFrame, um das Rendering weich zu takten
					requestAnimationFrame(() => executeTask(task));
				}
				observer.unobserve(entry.target); // Nur einmal initialisieren
			}
		});
	}, { 
		rootMargin: '100px' // Startet das Rendern schon 100px bevor man es sieht
	});

	// 3. Hilfsfunktion zur Ausführung der jeweiligen Render-Logik
	function executeTask(task) {
		if (task.type === 'space') {
			renderSpace(task.key);
		} else if (task.type === 'comparison') {
			renderComparison();
		} else if (task.type === 'comparison3d') {
			renderComparison3D();
		}
	}

	// 4. Registriere alle Container beim Observer
	tasks.forEach(task => {
		const el = document.getElementById(task.id);
		if (el) {
			observer.observe(el);
		} else {
			// Fallback: Falls ein Element (noch) nicht da ist, 
			// versuchen wir es nach einem kurzen Moment ohne Observer
			setTimeout(() => {
				const retryEl = document.getElementById(task.id);
				if (retryEl) observer.observe(retryEl);
			}, 100);
		}
	});
});
