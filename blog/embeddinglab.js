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
			'Power': [7.5, 0, 0], 'Weak': [-15, 0, 0]
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

function renderComparison3D(config) {
    const divId = 'plot-comparison-3d';
    const statsId = 'comparison-stats-3d';
    
    const Man = [0, -10, 0];
    const King = [20, -10, 0];
    const Lion = [18, -10, -20];

    const getMetrics3D = (v1, v2) => {
        const dot = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
        const mag1 = Math.sqrt(v1[0]**2 + v1[1]**2 + v1[2]**2);
        const mag2 = Math.sqrt(v2[0]**2 + v2[1]**2 + v2[2]**2);
        const cos = dot / (mag1 * mag2);
        const angle = Math.acos(Math.min(1, Math.max(-1, cos)));
        return { dist: Math.sqrt(v1.reduce((s,x,i)=>s+(x-v2[i])**2,0)).toFixed(1), cos: cos.toFixed(3), angle, deg: (angle*180/Math.PI).toFixed(1) };
    };

    const mk = getMetrics3D(Man, King);
    const ml = getMetrics3D(Man, Lion);

    function getArcPoints(v1, v2, angle, radius) {
        const pts = {x:[], y:[], z:[]};
        const steps = 20;
        const norm1 = v1.map(x => x / (Math.sqrt(v1.reduce((s,a)=>s+a**2,0)) || 1));
        const dot = v2[0]*norm1[0] + v2[1]*norm1[1] + v2[2]*norm1[2];
        let w = v2.map((x,i) => x - dot*norm1[i]);
        const magW = Math.sqrt(w.reduce((s,a)=>s+a**2,0)) || 1;
        w = w.map(x => x/magW);
        for(let i=0; i<=steps; i++) {
            const t = (i/steps) * angle;
            pts.x.push(radius * (Math.cos(t)*norm1[0] + Math.sin(t)*w[0]));
            pts.y.push(radius * (Math.cos(t)*norm1[1] + Math.sin(t)*w[1]));
            pts.z.push(radius * (Math.cos(t)*norm1[2] + Math.sin(t)*w[2]));
        }
        return pts;
    }

    const arcMK = getArcPoints(Man, King, mk.angle, 5);
    const arcML = getArcPoints(Man, Lion, ml.angle, 7);

    const traces = [
        { type:'scatter3d', x:[0,Man[0]], y:[0,Man[1]], z:[0,Man[2]], name:'Man', mode:'lines+markers+text', text:['','Man'], line:{width:6, color:'#64748b'} },
        { type:'scatter3d', x:[0,King[0]], y:[0,King[1]], z:[0,King[2]], name:'King', mode:'lines+markers+text', text:['','King'], line:{width:6, color:'#10b981'} },
        { type:'scatter3d', x:[0,Lion[0]], y:[0,Lion[1]], z:[0,Lion[2]], name:'Lion', mode:'lines+markers+text', text:['','Lion'], line:{width:6, color:'#ef4444'} },
        { type:'scatter3d', x:arcMK.x, y:arcMK.y, z:arcMK.z, mode:'lines', line:{color:'#10b981', width:4}, name:'Arc King' },
        { type:'scatter3d', x:arcML.x, y:arcML.y, z:arcML.z, mode:'lines', line:{color:'#ef4444', width:4}, name:'Arc Lion' },
        { type:'scatter3d', x:[Man[0], King[0]], y:[Man[1], King[1]], z:[Man[2], King[2]], mode:'lines', line:{dash:'dash', color:'#cbd5e1'}, name:'Dist MK' },
        { type:'scatter3d', x:[Man[0], Lion[0]], y:[Man[1], Lion[1]], z:[Man[2], Lion[2]], mode:'lines', line:{dash:'dash', color:'#cbd5e1'}, name:'Dist ML' }
    ];

    const layout = { margin:{l:0,r:0,b:0,t:0}, showlegend:false, scene:{ xaxis:{title:'Power'}, yaxis:{title:'Gender'}, zaxis:{title:'Species'} } };
    Plotly.react(divId, traces, layout, config);

    document.getElementById(statsId).innerHTML = `
        <div style="font-family: sans-serif; font-size: 0.85em; padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0;">
            <p><b style="color:#10b981">Man → King:</b><br>Angle: ${mk.deg}° | Dist: ${mk.dist}</p>
            <p><b style="color:#ef4444">Man → Lion:</b><br>Angle: ${ml.deg}° | Dist: ${ml.dist}</p>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", function() {
	const tasks = [
		...Object.keys(evoSpaces).map(key => ({ type: 'space', id: `plot-${key}`, key: key })),
		{ type: 'comparison', id: 'plot-comparison' },
		{ type: 'comparison3d', id: 'plot-comparison-3d' }
	];

	// Global Plotly config to reduce overhead
	const fastConfig = {
		displayModeBar: false, // Hides the heavy floating menu
		responsive: true,
		staticPlot: false,
		// This hint tells Plotly to prioritize frame rate
		glProto: 'webgl' 
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const task = tasks.find(t => t.id === entry.target.id);
				if (task) {
					// Use a slight delay based on the element's position
					// to ensure they don't all fire in the same millisecond
					const delay = entry.boundingClientRect.top < 500 ? 50 : 200;

					setTimeout(() => {
						requestAnimationFrame(() => {
							executeTask(task, fastConfig);
						});
					}, delay);
				}
				observer.unobserve(entry.target);
			}
		});
	}, { 
		// Reduced margin so we don't pre-render heavy 3D scenes 
		// that are too far down the page.
		rootMargin: '50px' 
	});

	function executeTask(task, config) {
		if (task.type === 'space') {
			// Passing config to the existing renderSpace call
			renderSpace(task.key, null, [], config);
		} else if (task.type === 'comparison3d') {
			renderComparison3D(config);
		}
	}

	tasks.forEach(task => {
		const el = document.getElementById(task.id);
		if (el) observer.observe(el);
	});
	initEmbeddingEditor();
});

/**
 * Initialisiert die Tabellen.
 * Diese Funktion wird am Ende der DOMContentLoaded-Funktion aufgerufen.
 */
function initEmbeddingEditor() {
	const containers = document.querySelectorAll('.embedding-table-container');

	containers.forEach(container => {
		const spaceKey = container.getAttribute('data-space');
		if (!spaceKey || !evoSpaces[spaceKey]) return;

		const space = evoSpaces[spaceKey];
		const words = Object.keys(space.vocab);

		let html = `
	<div style="overflow-x: auto; margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
	    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px;">
		<thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
		    <tr>
			<th style="padding: 10px; text-align: left;">Token</th>
			<th style="padding: 10px; text-align: center;">X</th>
			${space.dims >= 2 ? '<th style="padding: 10px; text-align: center;">Y</th>' : ''}
			${space.dims >= 3 ? '<th style="padding: 10px; text-align: center;">Z</th>' : ''}
		    </tr>
		</thead>
		<tbody>`;

		words.forEach(word => {
			const vec = space.vocab[word];
			html += `
	    <tr style="border-bottom: 1px solid #f1f5f9;">
		<td style="padding: 8px 10px; font-weight: 500;">${word}</td>
		${[0, 1, 2].slice(0, space.dims).map(dim => `
		    <td style="padding: 5px; text-align: center;">
			<input
			    type="number"
			    value="${vec[dim]}"
			    step="0.5"
			    data-space="${spaceKey}"
			    data-word="${word}"
			    data-dim="${dim}"
			    style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;"
			    oninput="updateEmbeddingFromTable(this)"
			>
		    </td>
		`).join('')}
	    </tr>`;
		});

		html += `</tbody></table></div>`;
		container.innerHTML = html;
	});
}

/**
 * Verarbeitet die Eingabe in der Tabelle und aktualisiert die Grafik.
 */
window.updateEmbeddingFromTable = function(input) {
	const spaceKey = input.getAttribute('data-space');
	const word = input.getAttribute('data-word');
	const dim = parseInt(input.getAttribute('data-dim'));
	const val = parseFloat(input.value) || 0;

	// 1. Wert im zentralen Datenobjekt speichern
	if (evoSpaces[spaceKey] && evoSpaces[spaceKey].vocab[word]) {
		evoSpaces[spaceKey].vocab[word][dim] = val;
	}

	// 2. Den Hauptplot aktualisieren
	renderSpace(spaceKey);

	// 3. Wenn es der 3D Raum ist, auch den Vergleichsplot (Man/King/Lion) updaten
	if (spaceKey === '3d') {
		renderComparison3D();
	}
};
