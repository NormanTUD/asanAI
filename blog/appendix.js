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
// LAYER INTERFERENCE PATTERN — WAVE GEOMETRY
// ============================================================

const layerWaveState = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    scanLayer: 0,
    depth: 96,
    cycles: 2.5,
    complexity: 0.7,
    currentInput: 'simple',
    animating: false,
    animFrame: null,
    inputs: {
        simple: {
            name: 'Simple Fact',
            description: '"The capital of France is Paris."',
            // Shape parameters: how the wave behaves
            baseAmplitude: 0.6,
            compressionDepth: 0.8,
            harmonicMix: [1.0, 0.2, 0.1], // fundamental + overtones
            noiseLevel: 0.05,
            phaseShift: 0
        },
        reasoning: {
            name: 'Reasoning',
            description: '"If all mammals breathe air, and whales are mammals, then..."',
            baseAmplitude: 0.7,
            compressionDepth: 0.95,
            harmonicMix: [1.0, 0.5, 0.3, 0.15],
            noiseLevel: 0.08,
            phaseShift: 0.2
        },
        creative: {
            name: 'Creative',
            description: '"The moonlight danced across the forgotten garden like..."',
            baseAmplitude: 0.8,
            compressionDepth: 0.5,
            harmonicMix: [1.0, 0.4, 0.35, 0.2, 0.15],
            noiseLevel: 0.12,
            phaseShift: -0.1
        },
        ambiguous: {
            name: 'Ambiguous',
            description: '"They saw her duck."',
            baseAmplitude: 0.75,
            compressionDepth: 0.6,
            harmonicMix: [1.0, 0.6, 0.4, 0.3],
            noiseLevel: 0.15,
            phaseShift: 0.3
        }
    }
};

window.loadWaveInput = function (name) {
    layerWaveState.currentInput = name;

    document.querySelectorAll('.wave-input-btn').forEach(btn => {
        btn.style.background = '#64748b';
    });
    const activeBtn = document.getElementById('wi-' + name);
    if (activeBtn) activeBtn.style.background = '#8b5cf6';

    renderLayerWave();
};

window.animateWaveScan = function () {
    const st = layerWaveState;
    const btn = document.getElementById('wave-animate-btn');

    if (st.animating) {
        st.animating = false;
        if (st.animFrame) cancelAnimationFrame(st.animFrame);
        if (btn) { btn.textContent = '▶ Scan'; btn.style.background = '#10b981'; }
        return;
    }

    st.animating = true;
    if (btn) { btn.textContent = '⏸ Pause'; btn.style.background = '#f59e0b'; }

    st.scanLayer = 0;
    const slider = document.getElementById('wave-scan-layer');

    function step() {
        if (!st.animating) return;
        st.scanLayer += 0.5;
        if (st.scanLayer >= st.depth - 1) {
            st.scanLayer = st.depth - 1;
            st.animating = false;
            if (btn) { btn.textContent = '▶ Scan'; btn.style.background = '#10b981'; }
            renderLayerWave();
            return;
        }
        if (slider) {
            slider.max = st.depth - 1;
            slider.value = Math.round(st.scanLayer);
        }
        renderLayerWave();
        st.animFrame = requestAnimationFrame(step);
    }
    st.animFrame = requestAnimationFrame(step);
};

function computeActivationWave(layer, depth, cycles, complexity, input) {
    const t = layer / (depth - 1); // 0 to 1

    // Base wave: expansion-compression-expansion envelope
    // Modeled as a sum of cosine harmonics
    let wave = 0;
    const harmonics = input.harmonicMix;

    for (let k = 0; k < harmonics.length; k++) {
        const freq = (k + 1) * cycles;
        wave += harmonics[k] * Math.cos(2 * Math.PI * freq * t + input.phaseShift * (k + 1));
    }

    // Normalize
    const maxPossible = harmonics.reduce((s, h) => s + Math.abs(h), 0);
    wave = wave / maxPossible;

    // Apply envelope: starts high, dips in middle, rises at end
    const envelope = 0.5 + 0.3 * Math.cos(2 * Math.PI * t - Math.PI) + 0.2 * Math.cos(4 * Math.PI * t);

    // Combine
    const activation = input.baseAmplitude * (0.5 + 0.5 * wave) * envelope;

    // Compression depth modulates how deep the valleys go
    const compressed = activation * (1 - input.compressionDepth * 0.3) + input.compressionDepth * 0.3 * activation * activation;

    // Add deterministic noise (seeded by layer index)
    const noise = input.noiseLevel * Math.sin(layer * 7.3 + 2.1) * Math.cos(layer * 3.7 + 0.8);

    return Math.max(0.05, Math.min(1.0, compressed + noise));
}

function computeDimensionHeatmap(depth, numDims, cycles, complexity, input) {
    // Generate a 2D heatmap: [layer][dimension] = activation strength
    const heatmap = [];

    for (let l = 0; l < depth; l++) {
        const row = [];
        const baseActivation = computeActivationWave(l, depth, cycles, complexity, input);

        for (let d = 0; d < numDims; d++) {
            // Each dimension has its own phase and amplitude
            const dimPhase = (d / numDims) * Math.PI * 2;
            const dimFreq = 1 + (d % 5) * 0.3;

            // Dimension activation: modulated by the layer wave
            const dimWave = Math.sin(dimFreq * (l / depth) * Math.PI * 2 * cycles + dimPhase);
            const dimActivation = baseActivation * (0.3 + 0.7 * (0.5 + 0.5 * dimWave));

            // Some dimensions are "always on" (bias dimensions)
            const bias = (d % 7 === 0) ? 0.3 : 0;

            // Sparsity: many dimensions are near zero
            const sparse = dimActivation > (0.4 - complexity * 0.2) ? dimActivation : dimActivation * 0.2;

            row.push(Math.max(0, Math.min(1, sparse + bias)));
        }
        heatmap.push(row);
    }

    return heatmap;
}



function initLayerWave() {
    const canvas = document.getElementById('canvas-layer-wave');
    if (!canvas) return;

    const st = layerWaveState;
    st.canvas = canvas;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        st.width = rect.width;
        st.height = rect.height;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        st.ctx = canvas.getContext('2d');
        st.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeCanvas();

    // Sliders
    const scanSlider = document.getElementById('wave-scan-layer');
    const depthSlider = document.getElementById('wave-depth');
    const cyclesSlider = document.getElementById('wave-cycles');
    const complexitySlider = document.getElementById('wave-complexity');

    if (scanSlider) {
        scanSlider.addEventListener('input', () => {
            st.scanLayer = parseInt(scanSlider.value);
            renderLayerWave();
        });
    }
    if (depthSlider) {
        depthSlider.addEventListener('input', () => {
            st.depth = parseInt(depthSlider.value);
            document.getElementById('wave-depth-val').textContent = st.depth;
            const ss = document.getElementById('wave-scan-layer');
            if (ss) { ss.max = st.depth - 1; ss.value = Math.min(st.scanLayer, st.depth - 1); }
            st.scanLayer = Math.min(st.scanLayer, st.depth - 1);
            renderLayerWave();
        });
    }
    if (cyclesSlider) {
        cyclesSlider.addEventListener('input', () => {
            st.cycles = parseFloat(cyclesSlider.value);
            document.getElementById('wave-cycles-val').textContent = st.cycles.toFixed(1);
            renderLayerWave();
        });
    }
    if (complexitySlider) {
        complexitySlider.addEventListener('input', () => {
            st.complexity = parseFloat(complexitySlider.value);
            document.getElementById('wave-complexity-val').textContent = st.complexity.toFixed(2);
            renderLayerWave();
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); renderLayerWave(); }, 150);
    });

    renderLayerWave();
}

function renderLayerWave() {
    const st = layerWaveState;
    if (!st.ctx) return;

    const ctx = st.ctx;
    const W = st.width;
    const H = st.height;
    const input = st.inputs[st.currentInput];
    const depth = st.depth;
    const cycles = st.cycles;
    const complexity = st.complexity;

    const showPhases = document.getElementById('wave-show-phases')?.checked ?? true;
    const showHarmonics = document.getElementById('wave-show-harmonics')?.checked ?? false;
    const showHeatmap = document.getElementById('wave-show-heatmap')?.checked ?? true;

    // Update scan label
    var scanVal = document.getElementById('wave-scan-val');
    if (scanVal) scanVal.textContent = `${Math.round(st.scanLayer)} / ${depth - 1}`;

    // ── Clear ──
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Layout: top 45% = heatmap, bottom 55% = wave curve
    const heatmapH = showHeatmap ? H * 0.40 : 0;
    const waveTop = heatmapH + 10;
    const waveH = H - waveTop - 40;
    const margin = { l: 50, r: 20 };
    const plotW = W - margin.l - margin.r;

    // ── Compute wave values ──
    const waveValues = [];
    for (let l = 0; l < depth; l++) {
        waveValues.push(computeActivationWave(l, depth, cycles, complexity, input));
    }

    // ── Dimension heatmap ──
    if (showHeatmap) {
        const numDims = 48; // simulated dimensions to display
        const heatmap = computeDimensionHeatmap(depth, numDims, cycles, complexity, input);

        const cellW = plotW / depth;
        const cellH = heatmapH / numDims;

        for (let l = 0; l < depth; l++) {
            for (let d = 0; d < numDims; d++) {
                const val = heatmap[l][d];
                const x = margin.l + l * cellW;
                const y = d * cellH;

                // Color: dark blue (inactive) → cyan → yellow → white (very active)
                let r, g, b;
                if (val < 0.25) {
                    const t2 = val / 0.25;
                    r = Math.round(15 + t2 * 10);
                    g = Math.round(23 + t2 * 50);
                    b = Math.round(42 + t2 * 80);
                } else if (val < 0.5) {
                    const t2 = (val - 0.25) / 0.25;
                    r = Math.round(25 + t2 * 20);
                    g = Math.round(73 + t2 * 90);
                    b = Math.round(122 + t2 * 50);
                } else if (val < 0.75) {
                    const t2 = (val - 0.5) / 0.25;
                    r = Math.round(45 + t2 * 180);
                    g = Math.round(163 + t2 * 60);
                    b = Math.round(172 - t2 * 100);
                } else {
                    const t2 = (val - 0.75) / 0.25;
                    r = Math.round(225 + t2 * 30);
                    g = Math.round(223 + t2 * 32);
                    b = Math.round(72 + t2 * 183);
                }

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
            }
        }

        // Heatmap label
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.fillText('Dim 0', margin.l - 4, 10);
        ctx.fillText(`Dim ${numDims - 1}`, margin.l - 4, heatmapH - 2);

        // Scan line on heatmap
        const scanX = margin.l + (st.scanLayer / (depth - 1)) * plotW;
        ctx.beginPath();
        ctx.moveTo(scanX, 0);
        ctx.lineTo(scanX, heatmapH);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Separator
        ctx.beginPath();
        ctx.moveTo(0, heatmapH + 2);
        ctx.lineTo(W, heatmapH + 2);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ── Phase regions ──
    if (showPhases) {
        // Detect phases: expansion (rising), compression (falling), re-expansion (rising again)
        for (let l = 0; l < depth - 1; l++) {
            const x = margin.l + (l / (depth - 1)) * plotW;
            const nextX = margin.l + ((l + 1) / (depth - 1)) * plotW;
            const val = waveValues[l];
            const nextVal = waveValues[l + 1];
            const rising = nextVal > val;

            // Determine phase by position and direction
            const t = l / (depth - 1);
            let phaseColor;
            if (t < 0.33) {
                phaseColor = rising ? 'rgba(59, 130, 246, 0.06)' : 'rgba(239, 68, 68, 0.06)';
            } else if (t < 0.66) {
                phaseColor = rising ? 'rgba(59, 130, 246, 0.06)' : 'rgba(239, 68, 68, 0.08)';
            } else {
                phaseColor = rising ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)';
            }

            ctx.fillStyle = phaseColor;
            ctx.fillRect(x, waveTop, nextX - x + 1, waveH);
        }
    }

    // ── Wave grid ──
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
    ctx.lineWidth = 0.5;
    for (let v = 0; v <= 1; v += 0.25) {
        const y = waveTop + waveH * (1 - v);
        ctx.beginPath();
        ctx.moveTo(margin.l, y);
        ctx.lineTo(W - margin.r, y);
        ctx.stroke();

        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.fillText((v * 100).toFixed(0) + '%', margin.l - 6, y + 3);
    }

    // Layer axis labels
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    const labelStep = depth > 64 ? 16 : depth > 32 ? 8 : 4;
    for (let l = 0; l < depth; l += labelStep) {
        const x = margin.l + (l / (depth - 1)) * plotW;
        ctx.fillText(l.toString(), x, waveTop + waveH + 16);
    }
    ctx.fillText('Layer →', margin.l + plotW / 2, waveTop + waveH + 32);

    // ── Individual harmonics (if toggled) ──
    if (showHarmonics) {
        const harmonics = input.harmonicMix;
        const harmColors = ['rgba(239,68,68,0.2)', 'rgba(59,130,246,0.2)', 'rgba(16,185,129,0.2)', 'rgba(245,158,11,0.2)', 'rgba(168,85,247,0.2)'];

        harmonics.forEach((amp, k) => {
            ctx.beginPath();
            for (let l = 0; l < depth; l++) {
                const x = margin.l + (l / (depth - 1)) * plotW;
                const t = l / (depth - 1);
                const freq = (k + 1) * cycles;
                const val = 0.5 + 0.5 * amp * Math.cos(2 * Math.PI * freq * t + input.phaseShift * (k + 1));
                const y = waveTop + waveH * (1 - val);
                if (l === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = harmColors[k % harmColors.length];
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            const labelX = W - margin.r - 5;
            const labelT = (depth - 1) / (depth - 1);
            const freq = (k + 1) * cycles;
            const labelVal = 0.5 + 0.5 * amp * Math.cos(2 * Math.PI * freq * labelT + input.phaseShift * (k + 1));
            const labelY = waveTop + waveH * (1 - labelVal);

            ctx.font = '8px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = harmColors[k % harmColors.length].replace('0.2', '0.5');
            ctx.fillText(`H${k + 1}`, labelX, labelY);
        });
    }

    // ── Main wave curve ──
    // Filled area under curve
    ctx.beginPath();
    ctx.moveTo(margin.l, waveTop + waveH);
    for (let l = 0; l < depth; l++) {
        const x = margin.l + (l / (depth - 1)) * plotW;
        const y = waveTop + waveH * (1 - waveValues[l]);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(margin.l + plotW, waveTop + waveH);
    ctx.closePath();

    // Gradient fill
    const grad = ctx.createLinearGradient(0, waveTop, 0, waveTop + waveH);
    grad.addColorStop(0, 'rgba(96, 165, 250, 0.2)');
    grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Wave line
    ctx.beginPath();
    for (let l = 0; l < depth; l++) {
        const x = margin.l + (l / (depth - 1)) * plotW;
        const y = waveTop + waveH * (1 - waveValues[l]);
        if (l === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    // Color the line by phase
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glow
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // ── Peaks and valleys markers ──
    for (let l = 1; l < depth - 1; l++) {
        const prev = waveValues[l - 1];
        const curr = waveValues[l];
        const next = waveValues[l + 1];

        const x = margin.l + (l / (depth - 1)) * plotW;
        const y = waveTop + waveH * (1 - curr);

        if (curr > prev && curr > next && curr > 0.5) {
            // Peak (expansion)
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
            ctx.fill();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (curr < prev && curr < next && curr < 0.4) {
            // Valley (compression)
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // ── Scan line ──
    const scanX = margin.l + (st.scanLayer / (depth - 1)) * plotW;
    var scanVal = waveValues[Math.min(Math.round(st.scanLayer), depth - 1)];
    const scanY = waveTop + waveH * (1 - scanVal);

    // Vertical scan line
    ctx.beginPath();
    ctx.moveTo(scanX, waveTop);
    ctx.lineTo(scanX, waveTop + waveH);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glow
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Scan dot on curve
    ctx.beginPath();
    ctx.arc(scanX, scanY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Scan value label
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${(scanVal * 100).toFixed(0)}%`, scanX + 12, scanY - 2);

    // ── Phase labels at top of wave area ──
    if (showPhases) {
        const phases = [
            { label: '🔵 Expansion', start: 0, end: 0.30, color: 'rgba(59,130,246,0.5)' },
            { label: '🔴 Compression', start: 0.30, end: 0.65, color: 'rgba(239,68,68,0.5)' },
            { label: '🟢 Re-expansion', start: 0.65, end: 1.0, color: 'rgba(16,185,129,0.5)' },
        ];

        phases.forEach(phase => {
            const px = margin.l + phase.start * plotW;
            const pw = (phase.end - phase.start) * plotW;

            ctx.font = '10px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = phase.color;
            ctx.fillText(phase.label, px + pw / 2, waveTop + 14);
        });
    }

    // ── Heartbeat EKG-style mini display (top right corner) ──
    const ekgW = 100;
    const ekgH = 30;
    const ekgX = W - margin.r - ekgW - 10;
    const ekgY = waveTop + 8;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(ekgX - 4, ekgY - 4, ekgW + 8, ekgH + 8);
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ekgX - 4, ekgY - 4, ekgW + 8, ekgH + 8);

    // Draw mini EKG
    ctx.beginPath();
    for (let i = 0; i < ekgW; i++) {
        const l = Math.round((i / ekgW) * (depth - 1));
        const val = waveValues[l];
        const x = ekgX + i;
        const y = ekgY + ekgH * (1 - val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mini scan position
    const miniScanX = ekgX + (st.scanLayer / (depth - 1)) * ekgW;
    ctx.beginPath();
    ctx.moveTo(miniScanX, ekgY);
    ctx.lineTo(miniScanX, ekgY + ekgH);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Heart icon
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('💓', ekgX - 8, ekgY + ekgH / 2 + 5);

    // ── Update panels ──
    updateWavePhaseInfo(st.scanLayer, depth, waveValues, input);
    updateWaveStats(depth, waveValues, cycles);
}

function updateWavePhaseInfo(scanLayer, depth, waveValues, input) {
    const phaseDiv = document.getElementById('wave-phase-info');
    const detailDiv = document.getElementById('wave-layer-detail');
    if (!phaseDiv || !detailDiv) return;

    phaseDiv.innerHTML = `
        <div style="margin-bottom: 6px; font-size: 0.9em;">
            <b>Input:</b> ${input.description}
        </div>
        <div style="font-size: 0.85em; color: #94a3b8; line-height: 1.6;">
            The activation pattern pulses through
            <span style="color:#3b82f6; font-weight:bold;">expansion</span> (broad, exploratory),
            <span style="color:#ef4444; font-weight:bold;">compression</span> (narrow, decisive), and
            <span style="color:#10b981; font-weight:bold;">re-expansion</span> (output preparation) phases —
            like a beating heart made of data.
        </div>
    `;

    const layerIdx = Math.min(Math.round(scanLayer), depth - 1);
    const val = waveValues[layerIdx];
    const t = layerIdx / (depth - 1);

    // Determine phase
    let phase, phaseColor, phaseIcon;
    const prevVal = layerIdx > 0 ? waveValues[layerIdx - 1] : val;
    const rising = val >= prevVal;

    if (t < 0.33) {
        phase = rising ? 'Expansion' : 'Early Compression';
        phaseColor = rising ? '#3b82f6' : '#ef4444';
        phaseIcon = rising ? '🔵' : '🔴';
    } else if (t < 0.66) {
        phase = rising ? 'Mid Recovery' : 'Deep Compression';
        phaseColor = rising ? '#8b5cf6' : '#ef4444';
        phaseIcon = rising ? '🟣' : '🔴';
    } else {
        phase = rising ? 'Re-expansion' : 'Late Compression';
        phaseColor = rising ? '#10b981' : '#ef4444';
        phaseIcon = rising ? '🟢' : '🔴';
    }

    // Activation bar
    const barPct = (val * 100).toFixed(0);

    detailDiv.innerHTML = `
        <div style="margin-bottom: 6px;">
            <b>Layer ${layerIdx}</b> of ${depth - 1}
            <span style="color: #94a3b8; font-size: 0.85em;">(${(t * 100).toFixed(0)}% depth)</span>
        </div>
        <div style="margin-bottom: 6px;">
            <b>Phase:</b> <span style="color:${phaseColor}; font-weight:bold;">${phaseIcon} ${phase}</span>
        </div>
        <div style="margin-bottom: 6px;">
            <b>Activation Width:</b> ${barPct}%
            <div style="background:#1e293b; border-radius:4px; height:10px; width:100%; margin-top:3px; overflow:hidden;">
                <div style="background: linear-gradient(90deg, #3b82f6, ${val > 0.6 ? '#60a5fa' : '#ef4444'}); height:100%; width:${barPct}%; border-radius:4px; transition: width 0.15s;"></div>
            </div>
        </div>
        <div style="margin-bottom: 4px;">
            <b>Trend:</b> ${rising ? '📈 Rising (expanding)' : '📉 Falling (compressing)'}
        </div>
        <div style="font-size: 0.8em; color: #94a3b8; margin-top: 6px; padding: 6px; background: ${phaseColor}10; border-radius: 4px; border-left: 3px solid ${phaseColor};">
            ${t < 0.33 ? '<b>Early layers:</b> The model is exploring — activating many dimensions to consider all possible interpretations of the input.' :
              t < 0.66 ? '<b>Middle layers:</b> The model is deciding — suppressing irrelevant dimensions, sharpening the signal, performing core reasoning.' :
                         '<b>Late layers:</b> The model is preparing output — fanning out from a sharp interpretation into a probability distribution over tokens.'}
        </div>
    `;
}

function updateWaveStats(depth, waveValues, cycles) {
    const statsDiv = document.getElementById('wave-stats');
    if (!statsDiv) return;

    // Find peaks and valleys
    let peaks = 0, valleys = 0;
    let maxVal = 0, minVal = 1;
    for (let l = 1; l < depth - 1; l++) {
        if (waveValues[l] > waveValues[l - 1] && waveValues[l] > waveValues[l + 1]) peaks++;
        if (waveValues[l] < waveValues[l - 1] && waveValues[l] < waveValues[l + 1]) valleys++;
        if (waveValues[l] > maxVal) maxVal = waveValues[l];
        if (waveValues[l] < minVal) minVal = waveValues[l];
    }

    const amplitude = maxVal - minVal;
    const avgActivation = waveValues.reduce((s, v) => s + v, 0) / waveValues.length;

    statsDiv.innerHTML = `
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Heartbeats</div>
            <div style="font-size:1.4em; font-weight:bold; color:#ef4444;">${peaks}</div>
            <div style="font-size:0.7em; color:#94a3b8;">expansion peaks</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Compressions</div>
            <div style="font-size:1.4em; font-weight:bold; color:#3b82f6;">${valleys}</div>
            <div style="font-size:0.7em; color:#94a3b8;">logic-check valleys</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Wave Amplitude</div>
            <div style="font-size:1.4em; font-weight:bold; color:#8b5cf6;">${(amplitude * 100).toFixed(0)}%</div>
            <div style="font-size:0.7em; color:#94a3b8;">peak-to-valley swing</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Avg. Activation</div>
            <div style="font-size:1.4em; font-weight:bold; color:#10b981;">${(avgActivation * 100).toFixed(0)}%</div>
            <div style="font-size:0.7em; color:#94a3b8;">mean width</div>
        </div>
    `;
}

// ============================================================
// ISOSURFACES OF PROBABILITY: TRUTH TUNNELS
// ============================================================

const isoState = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    temperature: 0.8,
    currentStep: 0,
    currentSentence: 'capital',
    animFrame: null,
    sentences: {
        capital: {
            tokens: ['The', 'capital', 'of', 'France', 'is', 'Paris', '.'],
            // entropy at each step (0-1 normalized): high = wide tunnel, low = narrow
            entropy: [0.95, 0.55, 0.20, 0.60, 0.15, 0.05, 0.10],
            // position path through 2D "embedding space" (normalized 0-1)
            path: [
                { x: 0.08, y: 0.50 },
                { x: 0.20, y: 0.42 },
                { x: 0.32, y: 0.38 },
                { x: 0.45, y: 0.35 },
                { x: 0.58, y: 0.32 },
                { x: 0.74, y: 0.30 },
                { x: 0.88, y: 0.32 },
            ],
            // branch points: at which step does a fork appear, and where does the branch go?
            branches: [
                {
                    atStep: 3, // after "of" — could be many countries
                    alternatives: [
                        { token: 'Germany', path: { x: 0.45, y: 0.55 }, entropy: 0.55 },
                        { token: 'Japan', path: { x: 0.45, y: 0.22 }, entropy: 0.50 },
                    ]
                },
                {
                    atStep: 5, // after "is" — very constrained
                    alternatives: [
                        { token: 'the', path: { x: 0.74, y: 0.40 }, entropy: 0.25 },
                    ]
                }
            ],
            description: 'A factual statement that starts wide open and narrows to a single answer.'
        },
        story: {
            tokens: ['Once', 'upon', 'a', 'time', ',', 'a', 'dragon', 'flew', 'over', 'the', 'kingdom'],
            entropy: [0.70, 0.15, 0.10, 0.12, 0.08, 0.85, 0.60, 0.50, 0.20, 0.15, 0.65],
            path: [
                { x: 0.05, y: 0.50 },
                { x: 0.13, y: 0.46 },
                { x: 0.19, y: 0.44 },
                { x: 0.25, y: 0.43 },
                { x: 0.31, y: 0.43 },
                { x: 0.39, y: 0.44 },
                { x: 0.49, y: 0.38 },
                { x: 0.58, y: 0.35 },
                { x: 0.66, y: 0.37 },
                { x: 0.74, y: 0.38 },
                { x: 0.85, y: 0.35 },
            ],
            branches: [
                {
                    atStep: 6, // after "a" — what creature?
                    alternatives: [
                        { token: 'princess', path: { x: 0.49, y: 0.55 }, entropy: 0.55 },
                        { token: 'knight', path: { x: 0.49, y: 0.25 }, entropy: 0.50 },
                        { token: 'wizard', path: { x: 0.52, y: 0.48 }, entropy: 0.45 },
                    ]
                },
                {
                    atStep: 10, // "the ___" — many possible places
                    alternatives: [
                        { token: 'castle', path: { x: 0.85, y: 0.50 }, entropy: 0.55 },
                        { token: 'village', path: { x: 0.85, y: 0.22 }, entropy: 0.50 },
                    ]
                }
            ],
            description: 'A fairy tale opening — formulaic start, then creative explosion at each noun.'
        },
        code: {
            tokens: ['function', '(', 'x', ',', 'y', ')', '{', 'return', 'x', '+', 'y'],
            entropy: [0.50, 0.05, 0.60, 0.08, 0.55, 0.05, 0.06, 0.30, 0.40, 0.25, 0.35],
            path: [
                { x: 0.05, y: 0.50 },
                { x: 0.14, y: 0.45 },
                { x: 0.22, y: 0.42 },
                { x: 0.29, y: 0.43 },
                { x: 0.36, y: 0.40 },
                { x: 0.43, y: 0.42 },
                { x: 0.50, y: 0.44 },
                { x: 0.59, y: 0.40 },
                { x: 0.68, y: 0.37 },
                { x: 0.77, y: 0.38 },
                { x: 0.88, y: 0.36 },
            ],
            branches: [
                {
                    atStep: 7, // after "{" — what operation?
                    alternatives: [
                        { token: 'if', path: { x: 0.59, y: 0.55 }, entropy: 0.60 },
                        { token: 'const', path: { x: 0.59, y: 0.28 }, entropy: 0.50 },
                    ]
                },
                {
                    atStep: 9, // "x ___" — what operator?
                    alternatives: [
                        { token: '*', path: { x: 0.77, y: 0.50 }, entropy: 0.30 },
                        { token: '-', path: { x: 0.77, y: 0.28 }, entropy: 0.30 },
                    ]
                }
            ],
            description: 'Code is highly structured — syntax tokens have near-zero entropy, variable names are open.'
        },
        ambiguous: {
            tokens: ['I', 'went', 'to', 'the', 'bank', 'of', 'the', 'river'],
            entropy: [0.80, 0.65, 0.15, 0.12, 0.70, 0.45, 0.12, 0.55],
            path: [
                { x: 0.06, y: 0.50 },
                { x: 0.17, y: 0.47 },
                { x: 0.27, y: 0.45 },
                { x: 0.36, y: 0.44 },
                { x: 0.48, y: 0.43 },
                { x: 0.60, y: 0.40 },
                { x: 0.72, y: 0.38 },
                { x: 0.87, y: 0.35 },
            ],
            branches: [
                {
                    atStep: 4, // "the ___" — bank is ambiguous!
                    alternatives: [
                        { token: 'store', path: { x: 0.48, y: 0.30 }, entropy: 0.50 },
                        { token: 'park', path: { x: 0.48, y: 0.60 }, entropy: 0.55 },
                    ]
                },
                {
                    atStep: 5, // "bank ___" — this resolves the ambiguity
                    alternatives: [
                        { token: 'to', path: { x: 0.60, y: 0.55 }, entropy: 0.40 },
                        { token: 'account', path: { x: 0.60, y: 0.28 }, entropy: 0.35 },
                    ]
                }
            ],
            description: 'The word "bank" creates a fork — geography vs. finance — resolved only by "river."'
        }
    }
};

window.loadIsoSentence = function (name) {
    isoState.currentSentence = name;
    isoState.currentStep = 0;

    const slider = document.getElementById('iso-step-slider');
    const sent = isoState.sentences[name];
    if (slider) {
        slider.max = sent.tokens.length - 1;
        slider.value = 0;
    }

    document.querySelectorAll('.iso-preset-btn').forEach(btn => {
        btn.style.background = '#64748b';
    });
    const activeBtn = document.getElementById('iso-' + name);
    if (activeBtn) activeBtn.style.background = '#8b5cf6';

    renderIsosurface();
};

function initIsosurface() {
    const canvas = document.getElementById('canvas-isosurface');
    if (!canvas) return;

    const st = isoState;
    st.canvas = canvas;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        st.width = rect.width;
        st.height = rect.height;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        st.ctx = canvas.getContext('2d');
        st.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeCanvas();

    const stepSlider = document.getElementById('iso-step-slider');
    const tempSlider = document.getElementById('iso-temperature');

    if (stepSlider) {
        const sent = st.sentences[st.currentSentence];
        stepSlider.max = sent.tokens.length - 1;
        stepSlider.addEventListener('input', () => {
            st.currentStep = parseInt(stepSlider.value);
            renderIsosurface();
        });
    }

    if (tempSlider) {
        tempSlider.addEventListener('input', () => {
            st.temperature = parseFloat(tempSlider.value);
            renderIsosurface();
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); renderIsosurface(); }, 150);
    });

    renderIsosurface();
}

function renderIsosurface() {
    const st = isoState;
    if (!st.ctx) return;

    const ctx = st.ctx;
    const W = st.width;
    const H = st.height;
    const sent = st.sentences[st.currentSentence];
    const step = Math.min(st.currentStep, sent.tokens.length - 1);
    const temp = st.temperature;

    // Update labels
    const tempVal = document.getElementById('iso-temp-val');
    const stepVal = document.getElementById('iso-step-val');
    if (tempVal) {
        tempVal.textContent = temp.toFixed(2);
        tempVal.style.color = temp < 0.4 ? '#3b82f6' : temp < 1.2 ? '#f59e0b' : '#ef4444';
    }
    if (stepVal) stepVal.textContent = `${step} / ${sent.tokens.length - 1}`;

    // ── Clear ──
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // ── Grid ──
    ctx.strokeStyle = 'rgba(51,65,85,0.3)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Helper: normalized coords to canvas
    function toCanvas(p) {
        return { x: p.x * W, y: p.y * H };
    }

    // ── Draw the full path as a faint guide ──
    ctx.beginPath();
    sent.path.forEach((p, i) => {
        const cp = toCanvas(p);
        if (i === 0) ctx.moveTo(cp.x, cp.y);
        else ctx.lineTo(cp.x, cp.y);
    });
    ctx.strokeStyle = 'rgba(96,165,250,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Draw isosurface envelope for completed steps ──
    // The envelope width at each point = entropy * temperature * baseWidth
    const baseWidth = 80;

    // Build upper and lower envelope paths
    if (step >= 1) {
        const upperPath = [];
        const lowerPath = [];

        for (let i = 0; i <= step; i++) {
            const cp = toCanvas(sent.path[i]);
            const envelope = sent.entropy[i] * temp * baseWidth;

            // Compute perpendicular direction
            let dx = 0, dy = -1; // default: perpendicular is up/down
            if (i < sent.path.length - 1) {
                const next = toCanvas(sent.path[i + 1]);
                const tdx = next.x - cp.x;
                const tdy = next.y - cp.y;
                const len = Math.hypot(tdx, tdy);
                if (len > 0) {
                    dx = -tdy / len;
                    dy = tdx / len;
                }
            } else if (i > 0) {
                const prev = toCanvas(sent.path[i - 1]);
                const tdx = cp.x - prev.x;
                const tdy = cp.y - prev.y;
                const len = Math.hypot(tdx, tdy);
                if (len > 0) {
                    dx = -tdy / len;
                    dy = tdx / len;
                }
            }

            upperPath.push({ x: cp.x + dx * envelope, y: cp.y + dy * envelope });
            lowerPath.push({ x: cp.x - dx * envelope, y: cp.y - dy * envelope });
        }

        // Draw envelope as filled shape
        // Gradient fill layers for glow effect
        for (let layer = 3; layer >= 0; layer--) {
            const scale = 1 + layer * 0.3;
            const alpha = 0.03 + (3 - layer) * 0.03;

            ctx.beginPath();
            upperPath.forEach((p, i) => {
                const cp = toCanvas(sent.path[i]);
                const ex = cp.x + (p.x - cp.x) * scale;
                const ey = cp.y + (p.y - cp.y) * scale;
                if (i === 0) ctx.moveTo(ex, ey);
                else ctx.lineTo(ex, ey);
            });
            for (let i = lowerPath.length - 1; i >= 0; i--) {
                const cp = toCanvas(sent.path[i]);
                const p = lowerPath[i];
                const ex = cp.x + (p.x - cp.x) * scale;
                const ey = cp.y + (p.y - cp.y) * scale;
                ctx.lineTo(ex, ey);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.fill();
        }

        // Inner envelope (brighter)
        ctx.beginPath();
        upperPath.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        for (let i = lowerPath.length - 1; i >= 0; i--) {
            ctx.lineTo(lowerPath[i].x, lowerPath[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // ── Draw branches at visible steps ──
    sent.branches.forEach(branch => {
        if (step >= branch.atStep) {
            const origin = toCanvas(sent.path[branch.atStep]);

            branch.alternatives.forEach(alt => {
                const target = toCanvas(alt.path);
                const altEnvelope = alt.entropy * temp * baseWidth * 0.6;

                // Branch line
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 5]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Branch envelope (small blob)
                ctx.beginPath();
                ctx.arc(target.x, target.y, altEnvelope, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.06)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Branch label
                ctx.font = '11px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
                ctx.fillText(alt.token, target.x, target.y - altEnvelope - 6);

                // Small dot
                ctx.beginPath();
                ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
            });
        }
    });

    // ── Draw the main trajectory (solid, up to current step) ──
    if (step >= 1) {
        ctx.beginPath();
        for (let i = 0; i <= step; i++) {
            const cp = toCanvas(sent.path[i]);
            if (i === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
        }
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Glow
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    // ── Draw token nodes ──
    for (let i = 0; i <= step; i++) {
        const cp = toCanvas(sent.path[i]);
        const entropy = sent.entropy[i];
        const radius = 5 + entropy * temp * 4;

        // Outer glow
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${0.1 + entropy * 0.1})`;
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, radius, 0, Math.PI * 2);

        // Color by entropy: blue (certain) → purple (moderate) → orange (uncertain)
        const hue = 220 - entropy * 180; // 220 (blue) → 40 (orange)
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Token label
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(sent.tokens[i], cp.x, cp.y - radius - 8);
    }

    // ── Future tokens (faint) ──
    for (let i = step + 1; i < sent.tokens.length; i++) {
        const cp = toCanvas(sent.path[i]);
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.fill();

        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.fillText(sent.tokens[i], cp.x, cp.y - 10);
    }

    // ── Entropy bar at current step ──
    if (step < sent.tokens.length) {
        const barX = W - 50;
        const barH = H - 80;
        const barW = 16;
        const barY = 40;

        // Background
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 4, barY - 4, barW + 8, barH + 8);

        // Gradient fill
        const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
        grad.addColorStop(0, '#3b82f6');   // low entropy (top) = blue = certain
        grad.addColorStop(0.5, '#8b5cf6'); // mid = purple
        grad.addColorStop(1, '#f59e0b');   // high entropy (bottom) = orange = uncertain
        ctx.fillStyle = grad;
        ctx.fillRect(barX, barY, barW, barH);

        // Current entropy marker
        const currentEntropy = sent.entropy[step];
        const effectiveEntropy = Math.min(1, currentEntropy * temp);
        const markerY = barY + (1 - effectiveEntropy) * barH; // invert: high entropy = bottom

        // Marker arrow
        ctx.beginPath();
        ctx.moveTo(barX - 8, markerY);
        ctx.lineTo(barX, markerY - 4);
        ctx.lineTo(barX, markerY + 4);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Marker line
        ctx.beginPath();
        ctx.moveTo(barX, markerY);
        ctx.lineTo(barX + barW, markerY);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Certain', barX + barW / 2, barY - 8);
        ctx.fillText('Uncertain', barX + barW / 2, barY + barH + 14);

        // Entropy value
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(`H=${effectiveEntropy.toFixed(2)}`, barX + barW + 6, markerY + 4);
    }

    // ── Temperature indicator (top left) ──
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.fillText(`T = ${temp.toFixed(2)}`, 12, 20);

    let tempLabel;
    if (temp < 0.3) tempLabel = '❄️ Frozen — deterministic';
    else if (temp < 0.7) tempLabel = '🧊 Cool — focused';
    else if (temp < 1.2) tempLabel = '🌡️ Warm — balanced';
    else tempLabel = '🔥 Hot — chaotic';
    ctx.fillText(tempLabel, 12, 36);

    // ── Update sentence panel ──
    updateIsoSentencePanel(sent, step, temp);
    updateIsoStats(sent, step, temp);
}

function updateIsoSentencePanel(sent, step, temp) {
    const displayDiv = document.getElementById('iso-sentence-display');
    const infoDiv = document.getElementById('iso-step-info');
    if (!displayDiv || !infoDiv) return;

    // Build sentence with highlighting
    let html = '';
    sent.tokens.forEach((token, i) => {
        if (i < step) {
            // Past tokens: solid
            html += `<span style="color:#1e293b; font-weight:bold;">${token}</span> `;
        } else if (i === step) {
            // Current token: highlighted
            const entropy = sent.entropy[i];
            const hue = 220 - entropy * 180;
            html += `<span style="background: hsl(${hue}, 80%, 90%); color: hsl(${hue}, 80%, 30%); font-weight:bold; padding: 2px 6px; border-radius: 4px; border: 2px solid hsl(${hue}, 80%, 60%);">${token}</span> `;
        } else {
            // Future tokens: faded
            html += `<span style="color:#cbd5e1;">${token}</span> `;
        }
    });
    displayDiv.innerHTML = html;

    // Step info
    const entropy = sent.entropy[step];
    const effectiveEntropy = Math.min(1, entropy * temp);
    const tunnelWidth = (effectiveEntropy * 100).toFixed(0);

    // Find branches at this step
    let branchHtml = '';
    sent.branches.forEach(branch => {
        if (branch.atStep === step) {
            branchHtml += `<div style="margin-top: 6px; padding: 6px 8px; background: rgba(251,191,36,0.1); border-radius: 4px; border-left: 3px solid #fbbf24;">
                <b style="color:#f59e0b;">🔀 Fork detected!</b><br>`;
            branch.alternatives.forEach(alt => {
                branchHtml += `<span style="color:#f59e0b;">→ "${alt.token}"</span> <span style="color:#94a3b8;">(H=${alt.entropy.toFixed(2)})</span><br>`;
            });
            branchHtml += `</div>`;
        }
    });

    let certaintyLabel, certaintyColor;
    if (effectiveEntropy < 0.15) { certaintyLabel = 'Near-certain'; certaintyColor = '#3b82f6'; }
    else if (effectiveEntropy < 0.35) { certaintyLabel = 'Confident'; certaintyColor = '#10b981'; }
    else if (effectiveEntropy < 0.55) { certaintyLabel = 'Moderate'; certaintyColor = '#f59e0b'; }
    else if (effectiveEntropy < 0.75) { certaintyLabel = 'Uncertain'; certaintyColor = '#f97316'; }
    else { certaintyLabel = 'Wide open'; certaintyColor = '#ef4444'; }

    infoDiv.innerHTML = `
        <div style="margin-bottom: 6px;">
            <b>Token:</b> <span style="font-size:1.1em; font-weight:bold; color:#1e293b;">"${sent.tokens[step]}"</span>
        </div>
        <div style="margin-bottom: 4px;">
            <b>Base Entropy:</b> ${entropy.toFixed(2)}
        </div>
        <div style="margin-bottom: 4px;">
            <b>Effective (×T):</b> ${effectiveEntropy.toFixed(2)}
        </div>
        <div style="margin-bottom: 4px;">
            <b>Tunnel Width:</b>
            <div style="background:#1e293b; border-radius:4px; height:10px; width:100%; margin-top:2px; overflow:hidden;">
                <div style="background: linear-gradient(90deg, #8b5cf6, #a78bfa); height:100%; width:${tunnelWidth}%; border-radius:4px; transition: width 0.3s;"></div>
            </div>
        </div>
        <div style="margin-bottom: 6px;">
            <b>Certainty:</b> <span style="color:${certaintyColor}; font-weight:bold;">${certaintyLabel}</span>
        </div>
        ${branchHtml}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 8px 0;">
        <div style="font-size: 0.8em; color: #94a3b8; font-style: italic;">
            ${sent.description}
        </div>
    `;
}

function updateIsoStats(sent, step, temp) {
    const statsDiv = document.getElementById('iso-stats');
    if (!statsDiv) return;

    const entropy = sent.entropy[step];
    const effectiveEntropy = Math.min(1, entropy * temp);

    // Count total branches visible
    let visibleBranches = 0;
    sent.branches.forEach(b => { if (step >= b.atStep) visibleBranches += b.alternatives.length; });

    // Average entropy so far
    let avgEntropy = 0;
    for (let i = 0; i <= step; i++) avgEntropy += sent.entropy[i];
    avgEntropy = step > 0 ? avgEntropy / (step + 1) : sent.entropy[0];
    const avgEffective = Math.min(1, avgEntropy * temp);

    // Narrowing ratio: how much has the tunnel narrowed from step 0?
    const narrowing = sent.entropy[0] > 0 ? (1 - effectiveEntropy / (sent.entropy[0] * temp)) * 100 : 0;

    statsDiv.innerHTML = `
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Current Entropy</div>
            <div style="font-size:1.4em; font-weight:bold; color:${effectiveEntropy < 0.3 ? '#3b82f6' : effectiveEntropy < 0.6 ? '#f59e0b' : '#ef4444'};">${effectiveEntropy.toFixed(2)}</div>
            <div style="font-size:0.7em; color:#94a3b8;">H × T</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Avg. Entropy</div>
            <div style="font-size:1.4em; font-weight:bold; color:#8b5cf6;">${avgEffective.toFixed(2)}</div>
            <div style="font-size:0.7em; color:#94a3b8;">across ${step + 1} steps</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Tunnel Narrowing</div>
            <div style="font-size:1.4em; font-weight:bold; color:${narrowing > 50 ? '#10b981' : narrowing > 20 ? '#f59e0b' : '#94a3b8'};">${Math.max(0, narrowing).toFixed(0)}%</div>
            <div style="font-size:0.7em; color:#94a3b8;">vs. first step</div>
        </div>
        <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <div style="font-size:0.75em; color:#64748b; margin-bottom:3px;">Visible Forks</div>
            <div style="font-size:1.4em; font-weight:bold; color:#fbbf24;">${visibleBranches}</div>
            <div style="font-size:0.7em; color:#94a3b8;">alternative paths</div>
        </div>
    `;
}



async function loadAppendixModule() {
    // 1. Taylor Series
    _appLazyRegister('plot-taylor', () => {
        initTaylorSeries();
    });

    // 2. Group Structure Demo (Cayley table + clock)
    _appLazyRegister('group-axioms-chart', () => {
        initGroupStructureDemo();
    });

    // 3. Layer Interference Pattern — Wave Geometry
    _appLazyRegister('canvas-layer-wave', () => {
        initLayerWave();
    });


    // 4. Isosurfaces of Probability — Truth Tunnels
    _appLazyRegister('canvas-isosurface', () => {
        initIsosurface();
    });

    _appLazyCreateObserver();

    return Promise.resolve();
}
