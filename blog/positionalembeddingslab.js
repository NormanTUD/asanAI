// ── Sine & Cosine Interactive Section ───────────────────────────────────────
function initSineCosine() {
	// ── 1. Unit Circle ──────────────────────────────────────────────────────

	const sliderTheta = document.getElementById('slider-sc-theta');
	if (!sliderTheta) return;

	function updateUnitCircle() {
		const theta = parseFloat(sliderTheta.value);
		const sinT = Math.sin(theta);
		const cosT = Math.cos(theta);
		const deg = (theta * 180 / Math.PI).toFixed(1);

		document.getElementById('disp-sc-theta').textContent = theta.toFixed(2);
		document.getElementById('disp-sc-deg').textContent = deg + '°';

		document.getElementById('sc-equation-display').innerHTML =
			`$$ \\cos(${theta.toFixed(2)}) = ${cosT.toFixed(3)}, \\quad \\sin(${theta.toFixed(2)}) = ${sinT.toFixed(3)} $$`;
		render_temml();

		// Circle outline
		const circX = [], circY = [];
		for (let a = 0; a <= 2 * Math.PI + 0.05; a += 0.05) {
			circX.push(Math.cos(a));
			circY.push(Math.sin(a));
		}

		// Angle arc
		const arcX = [0], arcY = [0];
		const step = 0.02;
		for (let a = 0; a <= theta + 0.01; a += step) {
			arcX.push(0.25 * Math.cos(a));
			arcY.push(0.25 * Math.sin(a));
		}

		// "Unrolled" sine wave trace on the right side
		const waveX = [], waveY = [];
		const waveOffset = 1.8; // start x position for the wave
		const waveLen = 1.2;    // total width of the wave area
		for (let a = 0; a <= theta; a += 0.02) {
			waveX.push(waveOffset + (a / (2 * Math.PI)) * (2 * Math.PI * waveLen / (2 * Math.PI)) * 1);
			waveY.push(Math.sin(a));
		}
		// Simpler: map angle linearly to x
		const waveX2 = [], waveY2 = [];
		for (let a = 0; a <= 2 * Math.PI; a += 0.02) {
			waveX2.push(1.7 + a * 0.35);
			waveY2.push(Math.sin(a));
		}
		const currentWaveX = 1.7 + theta * 0.35;

		const data = [
			// Full sine wave (faint reference)
			{ x: waveX2, y: waveY2, mode: 'lines', line: { color: '#fecaca', width: 1.5 }, showlegend: false, hoverinfo: 'skip' },
			// Unit circle
			{ x: circX, y: circY, mode: 'lines', line: { color: '#cbd5e1', width: 2 }, showlegend: false, hoverinfo: 'skip' },
			// Radius line
			{ x: [0, cosT], y: [0, sinT], mode: 'lines', line: { color: '#334155', width: 3 }, showlegend: false, hoverinfo: 'skip' },
			// cos projection (horizontal blue line)
			{ x: [0, cosT], y: [0, 0], mode: 'lines', line: { color: '#2563eb', width: 5 }, name: 'cos θ (x-coord)' },
			// sin projection (vertical red line)
			{ x: [cosT, cosT], y: [0, sinT], mode: 'lines', line: { color: '#ef4444', width: 5 }, name: 'sin θ (y-coord)' },
			// Point on circle
			{ x: [cosT], y: [sinT], mode: 'markers', marker: { size: 12, color: '#1e293b', line: { color: '#fff', width: 2 } }, showlegend: false },
			// Dashed line from point to y-axis (shows sin value)
			{ x: [0, cosT], y: [sinT, sinT], mode: 'lines', line: { color: '#ef4444', width: 1, dash: 'dash' }, showlegend: false, hoverinfo: 'skip' },
			// Connecting line from circle point to wave
			{ x: [cosT, currentWaveX], y: [sinT, sinT], mode: 'lines', line: { color: '#f59e0b', width: 1, dash: 'dot' }, showlegend: false, hoverinfo: 'skip' },
			// Point on wave
			{ x: [currentWaveX], y: [sinT], mode: 'markers', marker: { size: 8, color: '#ef4444' }, showlegend: false },
			// Angle arc
			{ x: arcX, y: arcY, mode: 'lines', line: { color: '#f59e0b', width: 2 }, fill: 'toself', fillcolor: 'rgba(245,158,11,0.12)', showlegend: false, hoverinfo: 'skip' },
		];

		const layout = {
			margin: { t: 10, b: 40, l: 40, r: 10 },
			xaxis: { range: [-1.5, 4.2], zeroline: true, scaleanchor: 'y', scaleratio: 1, dtick: 0.5 },
			yaxis: { range: [-1.5, 1.5], zeroline: true, dtick: 0.5 },
			legend: { orientation: 'h', y: -0.15 },
			annotations: [
				{ x: cosT, y: sinT, text: `(${cosT.toFixed(2)}, ${sinT.toFixed(2)})`, showarrow: true, arrowhead: 0, ax: -40, ay: -25, font: { size: 13, color: '#1e293b' } },
				{ x: 0.32 * Math.cos(theta / 2), y: 0.32 * Math.sin(theta / 2), text: 'θ', showarrow: false, font: { size: 14, color: '#f59e0b', family: 'serif' } },
				{ x: 3.0, y: -1.35, text: 'sin wave "unrolled" →', showarrow: false, font: { size: 11, color: '#94a3b8' } },
			],
		};

		Plotly.react('plot-unit-circle', data, layout);
	}

	sliderTheta.addEventListener('input', updateUnitCircle);
	updateUnitCircle();

	// ── 2. Sine & Cosine Waves ──────────────────────────────────────────────

	const sliderAmp = document.getElementById('slider-wave-amp');
	const sliderFreq = document.getElementById('slider-wave-freq');
	const sliderPhase = document.getElementById('slider-wave-phase');

	function updateWavePlot() {
		const A = parseFloat(sliderAmp.value);
		const w = parseFloat(sliderFreq.value);
		const phi = parseFloat(sliderPhase.value);

		document.getElementById('disp-wave-amp').textContent = A.toFixed(1);
		document.getElementById('disp-wave-freq').textContent = w.toFixed(1);
		document.getElementById('disp-wave-phase').textContent = phi.toFixed(2);

		document.getElementById('wave-formula').innerHTML =
			`$$f(\\theta) = ${A.toFixed(1)}\\,\\sin(${w.toFixed(1)}\\,\\theta + ${phi.toFixed(2)})$$`;
		render_temml();

		const xVals = [], ySin = [], yCos = [], yCustom = [];
		for (let t = -2 * Math.PI; t <= 2 * Math.PI; t += 0.05) {
			xVals.push(t);
			ySin.push(Math.sin(t));
			yCos.push(Math.cos(t));
			yCustom.push(A * Math.sin(w * t + phi));
		}

		const data = [
			{ x: xVals, y: ySin, mode: 'lines', line: { color: '#cbd5e1', width: 1, dash: 'dot' }, name: 'sin θ' },
			{ x: xVals, y: yCos, mode: 'lines', line: { color: '#e2e8f0', width: 1, dash: 'dot' }, name: 'cos θ' },
			{ x: xVals, y: yCustom, mode: 'lines', line: { color: '#2563eb', width: 4 }, name: 'f(θ)' },
		];

		const layout = {
			margin: { t: 10, b: 40, l: 40, r: 10 },
			xaxis: { title: 'θ (radians)', range: [-2 * Math.PI, 2 * Math.PI], zeroline: true },
			yaxis: { title: 'Value', range: [-3.5, 3.5], zeroline: true },
			legend: { orientation: 'h', y: -0.25 },
		};

		Plotly.react('plot-sincos-wave', data, layout);
	}

	sliderAmp.addEventListener('input', updateWavePlot);
	sliderFreq.addEventListener('input', updateWavePlot);
	sliderPhase.addEventListener('input', updateWavePlot);
	updateWavePlot();
}

const PositionalLab = {
	d_model: 4, 
	baseVector: [1.688, -0.454, 0, 0], 

	getEncoding: function(pos, d_model) {
		let pe = new Array(d_model).fill(0);
		for (let i = 0; i < d_model; i += 2) {
			// Using the standard Transformer PE formula
			let div_term = Math.pow(10000, (2 * i) / d_model);
			pe[i] = Math.sin(pos / div_term);
			if (i + 1 < d_model) {
				pe[i + 1] = Math.cos(pos / div_term);
			}
		}
		return pe;
	},

	update: function(pos) {
		const numericPos = Number(pos);
		document.getElementById('pe-val').innerText = "Position " + numericPos;
		const peVec = this.getEncoding(numericPos, this.d_model);
		const combined = this.baseVector.map((val, i) => val + peVec[i]);

		this.renderComparison(numericPos, peVec, combined);
		this.renderChart(numericPos); // Pass current pos to the chart
	},

	renderComparison: function(pos, peVec, combined) {
		const container = document.getElementById('pe-viz-container');
		container.innerHTML = `
	    <table style="width:100%; border-collapse: collapse; font-family: monospace; font-size: 13px;">
		<tr style="background: #f3f4f6;">
		    <th style="padding:10px; border:1px solid #ddd;">Component</th>
		    <th style="border:1px solid #ddd;">Dim 0</th>
		    <th style="border:1px solid #ddd;">Dim 1</th>
		    <th style="border:1px solid #ddd;">Dim 2</th>
		    <th style="border:1px solid #ddd;">Dim 3</th>
		</tr>
		<tr>
		    <td style="padding:10px; border:1px solid #ddd;"><b>Static "king"</b></td>
		    ${this.baseVector.map(v => `<td style="border:1px solid #ddd;">${v.toFixed(3)}</td>`).join('')}
		</tr>
		<tr style="color: #2563eb;">
		    <td style="padding:10px; border:1px solid #ddd;"><b>+ PE (Pos ${pos})</b></td>
		    ${peVec.map(v => `<td style="border:1px solid #ddd;">${v.toFixed(3)}</td>`).join('')}
		</tr>
		<tr style="background: #eff6ff; font-weight: bold;">
		    <td style="padding:10px; border:1px solid #ddd;"><b>= Contextual "king"</b></td>
		    ${combined.map(v => `<td style="border:1px solid #ddd;">${v.toFixed(3)}</td>`).join('')}
		</tr>
	    </table>`;
	},

	renderChart: function(currentPos) {
		const traces = [];
		const resolution = 0.1; // Smaller steps for a smoother "rund" curve
		const maxPos = 10;

		// 1. Create smooth wave traces
		for (let i = 0; i < this.d_model; i++) {
			let x = [], y = [];
			for (let p = 0; p <= maxPos; p += resolution) {
				x.push(p);
				y.push(this.getEncoding(p, this.d_model)[i]);
			}
			traces.push({
				x: x,
				y: y,
				mode: 'lines',
				name: `Dim ${i} Wave`,
				line: { shape: 'spline', width: 2 },
				opacity: 0.4
			});
		}

		// 2. Add "moving" markers for the current position
		for (let i = 0; i < this.d_model; i++) {
			const currentVal = this.getEncoding(currentPos, this.d_model)[i];
			traces.push({
				x: [currentPos],
				y: [currentVal],
				mode: 'markers',
				name: `Pos ${currentPos} (D${i})`,
				marker: { size: 10, symbol: 'diamond' },
				showlegend: false
			});
		}

		const layout = {
			title: 'Positional Waves (Adjusting the 4D Space)',
			margin: { t: 40, b: 40, l: 40, r: 20 },
			xaxis: { title: 'Position', range: [0, maxPos] },
			yaxis: { title: 'PE Value', range: [-1.2, 1.2] },
			// Added a vertical line to show the "slice" of the current position
			shapes: [{
				type: 'line',
				x0: currentPos,
				x1: currentPos,
				y0: -1.1,
				y1: 1.1,
				line: { color: 'rgba(0,0,0,0.2)', width: 1, dash: 'dot' }
			}]
		};

		Plotly.newPlot('pe-chart', traces, layout, {responsive: true});
	}
};

function initRepetitionStarburstDemo() {
    const D = 8;
    const BASE = 10000;
    const NUM_REPETITIONS = 200;

    const baseWord = [1.688, -0.454, 0, 0, 0.5, -0.3, 0.1, 0.2];

    function pe(pos, d) {
        const v = [];
        for (let i = 0; i < d; i += 2) {
            const w = 1 / Math.pow(BASE, i / d);
            v.push(Math.sin(pos * w));
            if (i + 1 < d) v.push(Math.cos(pos * w));
        }
        return v;
    }

    function addVectors(a, b) {
        return a.map((val, i) => val + b[i]);
    }

    const allEmbeddings = [];
    for (let p = 0; p < NUM_REPETITIONS; p++) {
        const peVec = pe(p, D);
        allEmbeddings.push(addVectors(baseWord, peVec));
    }

    const centerX = baseWord[0];
    const centerY = baseWord[1];
    const centerZ = baseWord[2];

    // Build line traces from center to each endpoint
    const lineTraces = [];

    // Collect cone data (arrow tips at the endpoints)
    const coneX = [], coneY = [], coneZ = [];
    const coneU = [], coneV = [], coneW = [];
    const coneColors = [];

    for (let p = 0; p < NUM_REPETITIONS; p++) {
        const emb = allEmbeddings[p];

        // Direction vector from center to endpoint
        const dx = emb[0] - centerX;
        const dy = emb[1] - centerY;
        const dz = emb[2] - centerZ;

        // Normalize the direction for consistent cone size
        const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = mag > 0 ? dx / mag : 0;
        const ny = mag > 0 ? dy / mag : 0;
        const nz = mag > 0 ? dz / mag : 0;

        // Place the cone at the endpoint, pointing outward
        coneX.push(emb[0]);
        coneY.push(emb[1]);
        coneZ.push(emb[2]);
        coneU.push(nx);
        coneV.push(ny);
        coneW.push(nz);
        coneColors.push(p);

	    function getPositionColor(index, total, format = 'rgb') {
		    const t = total > 1 ? index / (total - 1) : 0;
		    const r = Math.round(59 + (16 - 59) * t);
		    const g = Math.round(130 + (185 - 130) * t);
		    const b = Math.round(246 + (129 - 246) * t);

		    if (format === 'object') return { r, g, b };
		    if (format === 'temml')  return `\\color[RGB]{${r},${g},${b}}`;
		    return `rgb(${r}, ${g}, ${b})`;
	    }


	    // Line from center to endpoint
	    lineTraces.push({
		    x: [centerX, emb[0]],
		    y: [centerY, emb[1]],
		    z: [centerZ, emb[2]],
		    mode: 'lines',
		    type: 'scatter3d',
		    line: {
			    color: getPositionColor(p, NUM_REPETITIONS),
			    width: 6
		    },
		    showlegend: false,
		    hoverinfo: 'skip'
	    });

    }

    // Cone trace — 3D arrowheads at each endpoint
    const coneTrace = {
        type: 'cone',
        x: coneX,
        y: coneY,
        z: coneZ,
        u: coneU,
        v: coneV,
        w: coneW,
        sizemode: 'absolute',
        sizeref: 0.12,
        anchor: 'tail',
        colorscale: 'HSV',
        cmin: 0,
        cmax: NUM_REPETITIONS,
        colorbar: {
            title: 'Position',
            thickness: 15,
            len: 0.6
        },
        hoverinfo: 'text',
        hovertext: coneX.map((_, i) => {
            const emb = allEmbeddings[i];
            return `"king" at pos ${i}<br>Δ = [${(emb[0] - centerX).toFixed(3)}, ${(emb[1] - centerY).toFixed(3)}, ${(emb[2] - centerZ).toFixed(3)}]`;
        }),
        name: '"king" + PE (positions 0–' + (NUM_REPETITIONS - 1) + ')',
        showscale: true
    };

    // Center point trace
    const centerTrace = {
        x: [centerX],
        y: [centerY],
        z: [centerZ],
        mode: 'markers+text',
        type: 'scatter3d',
        marker: {
            size: 10,
            color: '#000',
            symbol: 'diamond',
            line: { width: 2, color: '#fff' }
        },
        text: ['"king" (no PE)'],
        textposition: 'top center',
        textfont: { size: 13, color: '#000', family: 'sans-serif' },
        name: 'Original "king" (no PE)',
        hoverinfo: 'text',
        hovertext: ['Raw semantic embedding of "king"<br>[' + baseWord.slice(0, 3).map(v => v.toFixed(3)).join(', ') + ', ...]']
    };

    const traces = [...lineTraces, coneTrace, centerTrace];

    const layout = {
        title: '⭐ Repetition Starburst: "king" repeated ' + NUM_REPETITIONS + ' times',
        scene: {
            xaxis: { title: 'Dim 0 (sin, fast)' },
            yaxis: { title: 'Dim 1 (cos, fast)' },
            zaxis: { title: 'Dim 2 (sin, slow)' },
            camera: { eye: { x: 1.8, y: 1.2, z: 1.0 } }
        },
        margin: { t: 50, b: 20, l: 20, r: 20 },
        showlegend: false,
        legend: { x: 0.01, y: 0.99, font: { size: 11 } },
        annotations: [{
            text: 'Each arrow points from the raw "king" vector to its positionally-encoded copy. Cone tips reveal the PE geometry.',
            showarrow: false,
            x: 0.5, y: -0.05,
            xref: 'paper', yref: 'paper',
            font: { size: 12, color: '#475569' }
        }]
    };

    Plotly.newPlot('repetition-starburst', traces, layout, { responsive: true });
}

function initHelixManifoldDemo() {
	// Plot positions as points on a 3D helix using the first 3 PE dimensions
	const D = 8;
	const BASE = 10000;
	const maxPos = 120;

	function pe(pos, d) {
		const v = [];
		for (let i = 0; i < d; i += 2) {
			const w = 1 / Math.pow(BASE, i / d);
			v.push(Math.sin(pos * w));
			if (i + 1 < d) v.push(Math.cos(pos * w));
		}
		return v;
	}

	// Generate the helix curve (smooth)
	const helixX = [], helixY = [], helixZ = [];
	const markerX = [], markerY = [], markerZ = [], markerText = [];

	for (let p = 0; p <= maxPos; p += 0.2) {
		const v = pe(p, D);
		helixX.push(v[0]); // sin(pos * w0) — fast rotation
		helixY.push(v[1]); // cos(pos * w0) — fast rotation
		helixZ.push(v[2]); // sin(pos * w1) — slow drift = helix axis
	}

	// Integer position markers
	for (let p = 0; p <= maxPos; p++) {
		const v = pe(p, D);
		markerX.push(v[0]);
		markerY.push(v[1]);
		markerZ.push(v[2]);
		markerText.push('pos=' + p);
	}

	// Highlight two pairs to show translational symmetry:
	// Pair A: pos 5 → 8 (offset 3)
	// Pair B: pos 105 → 108 (offset 3)
	function pairTrace(posA, posB, color, label) {
		const vA = pe(posA, D), vB = pe(posB, D);
		return {
			x: [vA[0], vB[0]],
			y: [vA[1], vB[1]],
			z: [vA[2], vB[2]],
			mode: 'lines+markers+text',
			type: 'scatter3d',
			marker: { size: 7, color: color },
			line: { color: color, width: 5 },
			text: ['pos=' + posA, 'pos=' + posB],
			textposition: 'top center',
			name: label
		};
	}

	const traces = [
		{
			x: helixX, y: helixY, z: helixZ,
			mode: 'lines',
			type: 'scatter3d',
			line: { color: '#cbd5e1', width: 2 },
			opacity: 0.4,
			name: 'PE Manifold (helix)',
			showlegend: true
		},
		{
			x: markerX, y: markerY, z: markerZ,
			mode: 'markers',
			type: 'scatter3d',
			marker: {
				size: 3,
				color: markerZ.map((_, i) => i),
				colorscale: 'Viridis',
				opacity: 0.6
			},
			text: markerText,
			hoverinfo: 'text',
			name: 'Integer positions'
		},
		pairTrace(5, 8, '#2563eb', 'pos 5→8 (Δ=3)'),
		pairTrace(105, 108, '#dc2626', 'pos 105→108 (Δ=3)')
	];

	const layout = {
		title: '🌊 Positional Encoding Manifold: The High-Dimensional Helix',
		scene: {
			xaxis: { title: 'Dim 0 (sin, fast)' },
			yaxis: { title: 'Dim 1 (cos, fast)' },
			zaxis: { title: 'Dim 2 (sin, slow)' },
			camera: { eye: { x: 1.5, y: 1.5, z: 0.8 } }
		},
		margin: { t: 50, b: 20, l: 20, r: 20 },
		annotations: [{
			text: 'Blue & Red segments are the SAME length → translational symmetry!',
			showarrow: false,
			x: 0.5, y: -0.05,
			xref: 'paper', yref: 'paper',
			font: { size: 13, color: '#475569' }
		}]
	};

	Plotly.newPlot('helix-manifold', traces, layout, { responsive: true });
}

async function loadPositionalEmbeddingsModule() {
	updateLoadingStatus("Loading section about positional embeddings...");
	PositionalLab.update(1);

	// Lazy-load the repetition starburst demo
	const starburstTarget = document.getElementById('repetition-starburst');
	if (starburstTarget) {
		let starburstLoaded = false;
		const starburstObserver = new IntersectionObserver((entries, obs) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !starburstLoaded) {
					starburstLoaded = true;
					initRepetitionStarburstDemo();
					obs.unobserve(starburstTarget);
				}
			});
		}, { rootMargin: '200px' });
		starburstObserver.observe(starburstTarget);
	}


	// Lazy-load the helix manifold demo only when it's near the viewport
	const helixTarget = document.getElementById('helix-manifold');
	if (helixTarget) {
		let helixLoaded = false;
		const observer = new IntersectionObserver((entries, obs) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !helixLoaded) {
					helixLoaded = true;
					initHelixManifoldDemo();
					obs.unobserve(helixTarget); // Stop observing once loaded
				}
			});
		}, {
			// rootMargin lets you trigger *before* the element is fully in view.
			// '200px' means "fire when the element is within 200px of the viewport"
			rootMargin: '200px'
		});
		observer.observe(helixTarget);
	}

	// Lazy-load the group structure demo
	var groupTarget = document.getElementById('group-axioms-chart');
	if (groupTarget) {
		var groupLoaded = false;
		var groupObserver = new IntersectionObserver(function(entries, obs) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting && !groupLoaded) {
					groupLoaded = true;
					initGroupStructureDemo();
					obs.unobserve(groupTarget);
				}
			});
		}, { rootMargin: '200px' });
		groupObserver.observe(groupTarget);
	}

	lazyInit('plot-unit-circle', initSineCosine);

	return Promise.resolve();
}
