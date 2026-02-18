// ============================================================
// VISIONLAB.JS — Interactive Convolution & Feature Map Explorer
// Performance-optimized with requestAnimationFrame, debouncing,
// richer visualizations, and smoother interactions.
// ============================================================

// --- Utility: Debounce to prevent excessive recomputation ---
function debounce(fn, ms) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), ms);
	};
}

// --- Convolution Runner (optimized with error guard) ---
async function runConv() {
	const resCanvas = document.getElementById('conv-res');
	const srcCanvas = document.getElementById('conv-src-display');
	if (!srcCanvas || srcCanvas.width === 0 || !resCanvas) return;

	const size = parseInt(document.getElementById('k-size').value) || 3;
	const kValues = Array.from(document.querySelectorAll('.k-inp')).map(i => parseFloat(i.value) || 0);

	try {
		tf.tidy(() => {
			const t = tf.browser.fromPixels(srcCanvas).toFloat();
			const ker = tf.tensor2d(kValues, [size, size]).reverse(0).reverse(1).expandDims(-1).expandDims(-1);

			const channels = tf.split(t, 3, 2);
			const processed = channels.map(ch =>
				tf.conv2d(ch.expandDims(0), ker, 1, 'same').squeeze()
			);

			const combined = tf.stack(processed, 2).clipByValue(0, 255).cast('int32');
			tf.browser.toPixels(combined, resCanvas);
		});
		// Update the kernel visualization overlay
		updateKernelViz(kValues, size);
	} catch (err) {
		warn('visionlab', `TFJS not ready yet: ${err}`);
	}
}

// --- Kernel Preset Setter ---
function setKernel(matrix) {
	document.getElementById('k-size').value = matrix.length;
	initVisionLab();
	const inps = document.querySelectorAll('.k-inp');
	matrix.flat().forEach((val, i) => { if (inps[i]) inps[i].value = parseFloat(val.toFixed(4)); });
	runConv();
}

// --- Kernel Heatmap Visualization (NEW) ---
function updateKernelViz(kValues, size) {
	const vizCanvas = document.getElementById('kernel-viz');
	if (!vizCanvas) return;
	vizCanvas.width = size;
	vizCanvas.height = size;
	const ctx = vizCanvas.getContext('2d');

	const maxAbs = Math.max(...kValues.map(Math.abs), 0.0001);

	for (let i = 0; i < kValues.length; i++) {
		const x = i % size;
		const y = Math.floor(i / size);
		const norm = kValues[i] / maxAbs; // -1 to 1

		let r, g, b;
		if (norm >= 0) {
			// Positive: blue
			r = Math.round(255 * (1 - norm));
			g = Math.round(255 * (1 - norm));
			b = 255;
		} else {
			// Negative: red
			r = 255;
			g = Math.round(255 * (1 + norm));
			b = Math.round(255 * (1 + norm));
		}
		ctx.fillStyle = `rgb(${r},${g},${b})`;
		ctx.fillRect(x, y, 1, 1);
	}
}

// --- Math Step Display (with rAF for smoothness) ---
let mathRafId = null;
function updateConvMath(x, y, size) {
	if (mathRafId) cancelAnimationFrame(mathRafId);
	mathRafId = requestAnimationFrame(() => {
		_updateConvMathInner(x, y, size);
	});
}

function _updateConvMathInner(x, y, size) {
	const srcCanvas = document.getElementById('conv-src-display');
	const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
	const kValues = Array.from(document.querySelectorAll('.k-inp')).map(i => parseFloat(i.value) || 0);
	const offset = Math.floor(size / 2);

	const imgData = ctx.getImageData(x - offset, y - offset, size, size).data;
	const targetDiv = document.getElementById('conv-math-step');

	let sums = { r: 0, g: 0, b: 0 };
	let latexParts = [];

	for (let i = 0; i < kValues.length; i++) {
		const weight = kValues[i];
		const localX = (x - offset) + (i % size);
		const localY = (y - offset) + Math.floor(i / size);

		const r = imgData[i * 4];
		const g = imgData[i * 4 + 1];
		const b = imgData[i * 4 + 2];

		sums.r += r * weight;
		sums.g += g * weight;
		sums.b += b * weight;

		const vector = `\\begin{pmatrix} ${r} \\\\ ${g} \\\\ ${b} \\end{pmatrix}`;
		latexParts.push(`\\underbrace{${vector}}_{(${localX},\\, ${localY})} \\cdot ${weight.toFixed(2)}`);
	}

	// Clamp to [0,255] as the actual convolution does
	const clamp = v => Math.max(0, Math.min(255, Math.round(v)));

	const formula = `
    \\text{Output at } (${x},\\, ${y}): \\quad
    \\begin{pmatrix} y_{\\color{red}R} \\\\ y_{\\color{green}G} \\\\ y_{\\color{blue}B} \\end{pmatrix} = 
    ${latexParts.join(" + ")} = 
    \\boxed{\\begin{pmatrix} ${clamp(sums.r)} \\\\ ${clamp(sums.g)} \\\\ ${clamp(sums.b)} \\end{pmatrix}}`;

	targetDiv.innerHTML = `$$ ${formula} $$`;
	render_temml();
}

// --- Pixel Info Tooltip (NEW) ---
function showPixelInfo(x, y, srcCanvas) {
	const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
	const px = ctx.getImageData(x, y, 1, 1).data;
	const infoEl = document.getElementById('pixel-info');
	if (!infoEl) return;
	infoEl.style.display = 'block';
	infoEl.innerHTML = `
		<span style="color:#ef4444">R:${px[0]}</span>
		<span style="color:#22c55e">G:${px[1]}</span>
		<span style="color:#3b82f6">B:${px[2]}</span>
		<span style="color:#94a3b8">(${x}, ${y})</span>
	`;
}

// --- Main Init ---
function initVisionLab() {
	const size = parseInt(document.getElementById('k-size').value) || 3;
	const kt = document.getElementById('kernel-table');
	kt.innerHTML = "";

	for (let i = 0; i < size; i++) {
		let tr = kt.insertRow();
		for (let j = 0; j < size; j++) {
			let td = tr.insertCell();
			let inp = document.createElement('input');
			inp.type = "number";
			inp.className = "k-inp";
			inp.style.width = "48px";
			inp.style.textAlign = "center";
			inp.step = "0.1";
			inp.value = (i === Math.floor(size / 2) && j === Math.floor(size / 2)) ? 1 : 0;
			inp.oninput = debounce(runConv, 80);
			td.appendChild(inp);
		}
	}

	const img = document.getElementById('conv-src-hidden');
	const srcCanvas = document.getElementById('conv-src-display');
	const focus = document.getElementById('conv-focus');
	const cross = document.getElementById('conv-crosshair');
	const resCanvas = document.getElementById('conv-res');

	const setupCanvas = () => {
		const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
		ctx.drawImage(img, 0, 0, 50, 50);
		setTimeout(runConv, 100);
	};

	if (img.complete) setupCanvas(); else img.onload = setupCanvas;

	srcCanvas.onmousemove = (e) => {
		const rect = srcCanvas.getBoundingClientRect();
		const scale = rect.width / 50;

		const x = Math.floor((e.clientX - rect.left) / scale);
		const y = Math.floor((e.clientY - rect.top) / scale);
		const offset = Math.floor(size / 2);

		focus.style.display = 'block';
		focus.style.width = (size * scale) + "px";
		focus.style.height = (size * scale) + "px";
		focus.style.left = ((x - offset) * scale) + "px";
		focus.style.top = (srcCanvas.offsetTop + (y - offset) * scale) + "px";

		cross.style.display = 'block';
		cross.style.left = (x * scale + scale / 2) + "px";
		cross.style.top = (resCanvas.offsetTop + y * scale + scale / 2) + "px";

		showPixelInfo(x, y, srcCanvas);
		updateConvMath(x, y, size);
	};

	srcCanvas.onmouseleave = () => {
		focus.style.display = 'none';
		cross.style.display = 'none';
		const infoEl = document.getElementById('pixel-info');
		if (infoEl) infoEl.style.display = 'none';
	};
}

// ============================================================
// FEATURE LAB — Multi-filter Feature Map + Heatmap Explorer
// ============================================================
window.FeatureLab = {
	presets: {
		horizontal_0: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
		vertical_90: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
		diagonal_45: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]],
		diagonal_315: [[2, 1, 0], [1, 0, -1], [0, -1, -2]],
		sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
		blur: [[0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1]]
	},

	presetDescriptions: {
		horizontal_0: "Sobel filter detecting horizontal edges (gradients in the Y direction). Bright pixels indicate strong horizontal transitions.",
		vertical_90: "Sobel filter detecting vertical edges (gradients in the X direction). Bright pixels indicate strong vertical transitions.",
		diagonal_45: "Detects edges running at 45° (bottom-left to top-right). Useful for finding angled structures.",
		diagonal_315: "Detects edges running at 315° (top-left to bottom-right). Complements the 45° filter for full diagonal coverage."
	},

	activeFilters: [
		{ name: "0° (Horizontal)", type: "horizontal_0" },
		{ name: "90° (Vertical)", type: "vertical_90" },
		{ name: "45° (Diagonal ↗)", type: "diagonal_45" },
		{ name: "315° (Diagonal ↘)", type: "diagonal_315" }
	],

	init: function () {
		this.renderInterface();
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = "stop_sign.jpg";
		img.onload = () => {
			const ctx = document.getElementById('feat-src').getContext('2d');
			ctx.drawImage(img, 0, 0, 100, 100);
			this.runAll();
		};
	},

	renderInterface: function () {
		const grid = document.getElementById('filter-grid');
		grid.innerHTML = "";
		grid.style.gridTemplateColumns = "repeat(2, 1fr)";

		this.activeFilters.forEach((f, i) => {
			const desc = this.presetDescriptions[f.type] || "";
			const container = document.createElement('div');
			container.className = "filter-card";
			container.style = "background: white; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: box-shadow 0.2s;";
			container.onmouseenter = () => container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
			container.onmouseleave = () => container.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
			container.innerHTML = `
				<div style="font-size:0.8rem; font-weight:600; margin-bottom:6px; color:#1e293b;">${f.name}</div>
				<div style="font-size:0.7rem; color:#64748b; margin-bottom:8px; line-height:1.4;">${desc}</div>
				<div id="matrix-${i}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-bottom: 10px;">
					${this.presets[f.type].flat().map(v => `<input type="number" value="${v}" step="0.1" oninput="FeatureLab.runAll()" style="width:100%; font-size:0.7rem; text-align:center; padding:2px; border:1px solid #cbd5e1; border-radius:4px;">`).join('')}
				</div>
				<div style="position:relative;">
					<canvas id="res-${i}" width="100" height="100" style="background:#000; border-radius:6px; width:100%;"></canvas>
					<div id="stats-${i}" style="font-size:0.65rem; color:#94a3b8; margin-top:4px; text-align:center;"></div>
				</div>
			`;
			grid.appendChild(container);
		});

		// Heatmap Section
		const heatmapWrap = document.createElement('div');
		heatmapWrap.style = "grid-column: span 2; margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; text-align: center;";
		heatmapWrap.innerHTML = `
			<strong style="display:block; margin-bottom:4px; color: #fbbf24; font-size:1rem;">Layer 2: Octagon Shape Detector</strong>
			<p style="font-size: 0.78rem; margin-bottom:12px; color: #cbd5e1; max-width:500px; margin-left:auto; margin-right:auto; line-height:1.5;">
				This heatmap combines all 4 edge detectors above. Bright yellow regions indicate areas where <em>multiple</em> edge orientations were detected simultaneously — a strong signal for corners and complex shapes like the octagonal stop sign.
			</p>
			<canvas id="heatmap-res" width="100" height="100" style="width:200px; height:200px; border: 2px solid #fbbf24; border-radius: 8px; image-rendering: pixelated;"></canvas>
			<div style="display:flex; justify-content:center; gap:20px; margin-top:10px;">
				<span style="font-size:0.7rem; color:#64748b;">⬛ No edges</span>
				<span style="font-size:0.7rem; color:#f59e0b;">🟨 Weak signal</span>
				<span style="font-size:0.7rem; color:#fbbf24;">🟧 Strong multi-edge</span>
			</div>
		`;
		grid.appendChild(heatmapWrap);
	},

	runAll: async function () {
		const srcCanvas = document.getElementById('feat-src');
		if (!srcCanvas) return;

		tf.tidy(() => {
			const input = tf.browser.fromPixels(srcCanvas).mean(2).expandDims(-1).expandDims(0).toFloat();
			let combinedActivations = tf.zeros([100, 100, 1]);

			for (let i = 0; i < this.activeFilters.length; i++) {
				const resCanvas = document.getElementById(`res-${i}`);
				const statsDiv = document.getElementById(`stats-${i}`);
				const inputs = document.querySelectorAll(`#matrix-${i} input`);
				const kData = Array.from(inputs).map(inp => parseFloat(inp.value) || 0);
				const kernel = tf.tensor2d(kData, [3, 3]).expandDims(-1).expandDims(-1);

				let conv = tf.conv2d(input, kernel, 1, 'same').abs().squeeze();

				combinedActivations = combinedActivations.add(conv.expandDims(-1));

				// Stats
				const maxVal = conv.max().dataSync()[0];
				const meanVal = conv.mean().dataSync()[0];
				if (statsDiv) {
					statsDiv.textContent = `max: ${maxVal.toFixed(1)} | mean: ${meanVal.toFixed(1)}`;
				}

				const norm = conv.div(conv.max().add(0.0001));
				tf.browser.toPixels(norm, resCanvas);
			}

			// Heatmap
			const heatCanvas = document.getElementById('heatmap-res');
			const heatData = combinedActivations.squeeze().pow(2);
			const heatNorm = heatData.div(heatData.max().add(0.0001));

			// Improved colormap: dark → orange → bright yellow
			const yellowHeat = tf.stack([
				heatNorm,
				heatNorm.mul(0.75),
				heatNorm.mul(0.15)
			], 2);

			tf.browser.toPixels(yellowHeat, heatCanvas);
		});
	}
};

// ============================================================
// MODULE LOADER
// ============================================================
async function loadVisionModule() {
	updateLoadingStatus("Loading section about Computer Vision...");
	FeatureLab.init();
	initVisionLab();
	return Promise.resolve();
}
