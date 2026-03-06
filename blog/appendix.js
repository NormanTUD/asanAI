function initTaylorSeries() {
	const sliderTaylor = document.getElementById('slider-taylor-n');

	function factorial(n) {
		let r = 1;
		for (let i = 2; i <= n; i++) r *= i;
		return r;
	}

	function sinTaylor(x, N) {
		let sum = 0;
		for (let n = 0; n < N; n++) {
			sum += Math.pow(-1, n) * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1);
		}
		return sum;
	}

	function updateTaylor() {
		const N = parseInt(sliderTaylor.value);
		document.getElementById('disp-taylor-n').textContent = N;

		// Build formula string
		const terms = [];
		for (let n = 0; n < N; n++) {
			const sign = n === 0 ? '' : (n % 2 === 0 ? ' + ' : ' - ');
			const exp = 2 * n + 1;
			const denom = factorial(exp);
			if (n === 0) {
				terms.push('\\theta');
			} else {
				terms.push(`${sign}\\frac{\\theta^{${exp}}}{${denom}}`);
			}
		}
		document.getElementById('taylor-formula').innerHTML =
			`$$\\sin\\theta \\approx ${terms.join('')}$$`;
		render_temml();

		const xVals = [], yTrue = [], yApprox = [];
		for (let t = -2 * Math.PI; t <= 2 * Math.PI; t += 0.05) {
			xVals.push(t);
			yTrue.push(Math.sin(t));
			yApprox.push(sinTaylor(t, N));
		}

		const data = [
			{ x: xVals, y: yTrue, mode: 'lines', line: { color: '#94a3b8', width: 2, dash: 'dot' }, name: 'True sin θ' },
			{ x: xVals, y: yApprox, mode: 'lines', line: { color: '#dc2626', width: 3 }, name: `Taylor (${N} term${N > 1 ? 's' : ''})` },
		];

		const layout = {
			margin: { t: 10, b: 40, l: 40, r: 10 },
			xaxis: { title: 'θ (radians)', range: [-2 * Math.PI, 2 * Math.PI], zeroline: true },
			yaxis: { title: 'Value', range: [-3, 3], zeroline: true },
			legend: { orientation: 'h', y: -0.25 },
		};

		Plotly.react('plot-taylor', data, layout);
	}

	sliderTaylor.addEventListener('input', updateTaylor);
	updateTaylor();
}

function initGroupStructureDemo() {
	var N = 12; // clock size

	/* ────────── helper: clock position → (x, y) ────────── */
	function clockXY(i) {
		var theta = -Math.PI / 2 + ((i % N) * 2 * Math.PI) / N;
		return { x: Math.cos(theta), y: Math.sin(theta) };
	}

	/* ═══════════════════════════════════════════════════════
       VIZ 1 — Group Axioms on ℤ₁₂
       ═══════════════════════════════════════════════════════ */
	function renderGroupAxioms(a, b) {
		var ab   = (a + b) % N;
		var invA = (N - a) % N;

		// smooth circle outline
		var cX = [], cY = [];
		for (var t = 0; t <= 2 * Math.PI + 0.01; t += 0.04) {
			cX.push(Math.cos(t));
			cY.push(Math.sin(t));
		}

		// all 12 clock positions
		var allX = [], allY = [], allLabels = [];
		for (var i = 0; i < N; i++) {
			var p = clockXY(i);
			allX.push(p.x);  allY.push(p.y);  allLabels.push(String(i));
		}

		var traces = [
			{ x: cX, y: cY, mode: 'lines', line: { color: '#e2e8f0', width: 1 },
				showlegend: false, hoverinfo: 'skip' },
			{ x: allX, y: allY, mode: 'markers+text',
				marker: { size: 10, color: '#cbd5e1' },
				text: allLabels, textposition: 'top center',
				textfont: { size: 11, color: '#94a3b8' },
				showlegend: false, hoverinfo: 'text',
				hovertext: allLabels.map(function(l){ return 'Position ' + l; }) },
			// identity
			{ x: [clockXY(0).x], y: [clockXY(0).y], mode: 'markers',
				marker: { size: 16, color: '#a3a3a3', symbol: 'star',
					line: { width: 2, color: '#525252' } },
				name: 'Identity (M₀ = I)' },
			// a
			{ x: [clockXY(a).x], y: [clockXY(a).y], mode: 'markers',
				marker: { size: 18, color: '#2563eb', symbol: 'circle',
					line: { width: 2, color: '#1d4ed8' } },
				name: 'a = M' + a },
			// b
			{ x: [clockXY(b).x], y: [clockXY(b).y], mode: 'markers',
				marker: { size: 18, color: '#dc2626', symbol: 'diamond',
					line: { width: 2, color: '#b91c1c' } },
				name: 'b = M' + b },
			// a · b
			{ x: [clockXY(ab).x], y: [clockXY(ab).y], mode: 'markers',
				marker: { size: 18, color: '#16a34a', symbol: 'square',
					line: { width: 2, color: '#15803d' } },
				name: 'a·b = M' + ab + ' (closure)' },
			// inverse of a
			{ x: [clockXY(invA).x], y: [clockXY(invA).y], mode: 'markers',
				marker: { size: 16, color: '#9333ea', symbol: 'triangle-up',
					line: { width: 2, color: '#7e22ce' } },
				name: 'a⁻¹ = M' + invA + ' (inverse)' }
		];

		var shapes = [
			{ type:'line', x0:0, y0:0, x1:clockXY(a).x,  y1:clockXY(a).y,
				line:{ color:'#2563eb', width:2, dash:'dot' } },
			{ type:'line', x0:0, y0:0, x1:clockXY(b).x,  y1:clockXY(b).y,
				line:{ color:'#dc2626', width:2, dash:'dot' } },
			{ type:'line', x0:0, y0:0, x1:clockXY(ab).x, y1:clockXY(ab).y,
				line:{ color:'#16a34a', width:2, dash:'dot' } }
		];

		var layout = {
			title: 'Group Axioms on ℤ₁₂ (Clock Arithmetic)',
			xaxis: { range:[-1.55,1.55], scaleanchor:'y',
				showgrid:false, zeroline:false, showticklabels:false },
			yaxis: { range:[-1.55,1.55],
				showgrid:false, zeroline:false, showticklabels:false },
			margin: { t:50, b:55, l:30, r:160 },
			shapes: shapes,
			showlegend: true,
			legend: { x:1.02, y:1, font:{ size:11 } },
			annotations: [{
				x:0, y:-1.45, xref:'x', yref:'y', showarrow:false,
				text: 'M<sub>'+a+'</sub> · M<sub>'+b+'</sub> = M<sub>'+ab+
				'</sub>   |   M<sub>'+a+'</sub> · M<sub>'+invA+'</sub> = M<sub>0</sub> = I',
				font:{ size:13, color:'#475569' }
			}]
		};

		Plotly.newPlot('group-axioms-chart', traces, layout, { responsive:true });
	}

	/* ═══════════════════════════════════════════════════════
       VIZ 3 — Cayley Table heatmap
       ═══════════════════════════════════════════════════════ */
	function renderCayleyTable() {
		var z = [], labels = [];
		for (var i = 0; i < N; i++) {
			labels.push('M'+i);
			var row = [];
			for (var j = 0; j < N; j++) row.push((i+j) % N);
			z.push(row);
		}

		var trace = {
			z:z, x:labels, y:labels, type:'heatmap',
			colorscale:'Viridis',
			hovertemplate:'%{y} · %{x} = M<sub>%{z}</sub><extra></extra>',
			showscale:true,
			colorbar:{ title:'Result index' }
		};

		// cell value text
		var ann = [];
		for (var ii = 0; ii < N; ii++) {
			for (var jj = 0; jj < N; jj++) {
				ann.push({
					x:labels[jj], y:labels[ii],
					text:String(z[ii][jj]), showarrow:false,
					font:{ size:10, color: z[ii][jj] > N/2 ? 'white' : '#333' }
				});
			}
		}

		var layout = {
			title:'Cayley Table: Mᵢ · Mⱼ = M<sub>(i+j) mod 12</sub>',
			xaxis:{ title:'Mⱼ', side:'bottom' },
			yaxis:{ title:'Mᵢ', autorange:'reversed' },
			margin:{ t:50, b:60, l:60, r:20 },
			annotations:ann
		};

		Plotly.newPlot('group-cayley-chart', [trace], layout, { responsive:true });
	}

	/* ── initial render ── */
	renderGroupAxioms(3, 5);
	renderCayleyTable();

	/* ── wire sliders ── */
	document.getElementById('group-a-slider').addEventListener('input', function(){
		document.getElementById('group-a-label').textContent = this.value;
		renderGroupAxioms(+this.value, +document.getElementById('group-b-slider').value);
	});
	document.getElementById('group-b-slider').addEventListener('input', function(){
		document.getElementById('group-b-label').textContent = this.value;
		renderGroupAxioms(+document.getElementById('group-a-slider').value, +this.value);
	});
}

// ============================================================
// LAZY LOADING FOR APPENDIX MODULE
// ============================================================

const _appLazyRegistry = [];
let _appLazyObserver = null;

function _appLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _appLazyRegistry.push({ el, initFn, initialized: false });
}

function _appLazyCreateObserver() {
    if (_appLazyObserver) return;

    _appLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _appLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _appLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin
    });

    _appLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _appLazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// REPLACEMENT: loadAppendixModule (drop-in replacement)
// ============================================================

async function loadAppendixModule() {
    // 1. Taylor Series
    _appLazyRegister('plot-taylor', () => {
        initTaylorSeries();
    });

    // 2. Group Structure Demo (Cayley table + clock)
    _appLazyRegister('group-axioms-chart', () => {
        initGroupStructureDemo();
    });

    _appLazyCreateObserver();

    return Promise.resolve();
}
