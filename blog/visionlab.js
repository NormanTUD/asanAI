// ============================================================
// VISIONLAB.JS — Interactive Convolution & Feature Map Explorer
// Refactored for readability, maintainability, and performance.
// ============================================================

// --- Configuration Constants ---
const CONFIG = {
	SRC_SIZE: 50,
	FEAT_SIZE: 100,
	EPSILON: 1e-4,
	DEBOUNCE_MS: 80,
	DEFAULT_KERNEL_SIZE: 3,
	MAX_KERNEL_SIZE: 7,
	MIN_KERNEL_SIZE: 1,
};

// --- Cached DOM References ---
const DOM = {};

function cacheDOMRefs() {
	DOM.srcCanvas    = document.getElementById('conv-src-display');
	DOM.resCanvas    = document.getElementById('conv-res');
	DOM.kSize        = document.getElementById('k-size');
	DOM.kernelTable  = document.getElementById('kernel-table');
	DOM.focus        = document.getElementById('conv-focus');
	DOM.cross        = document.getElementById('conv-crosshair');
	DOM.mathStep     = document.getElementById('conv-math-step');
	DOM.pixelInfo    = document.getElementById('pixel-info');
	DOM.kernelViz    = document.getElementById('kernel-viz');
	DOM.srcHidden    = document.getElementById('conv-src-hidden');
	DOM.featSrc      = document.getElementById('feat-src');
	DOM.filterGrid   = document.getElementById('filter-grid');
	DOM.heatmapRes   = document.getElementById('heatmap-res');
}

// --- Utility: Debounce to prevent excessive recomputation ---
function debounce(fn, ms) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), ms);
	};
}

// --- Shared Helpers (DRY) ---
function getKernelSize() {
	return parseInt(DOM.kSize.value) || CONFIG.DEFAULT_KERNEL_SIZE;
}

function getKernelValues() {
	return Array.from(document.querySelectorAll('.k-inp'))
		.map(i => parseFloat(i.value) || 0);
}

function clamp(v) {
	return Math.max(0, Math.min(255, Math.round(v)));
}

// --- Convolution Runner (optimized with error guard) ---
async function runConv() {
	if (!DOM.srcCanvas || DOM.srcCanvas.width === 0 || !DOM.resCanvas) return;

	const size = getKernelSize();
	const kValues = getKernelValues();

	try {
		tf.tidy(() => {
			const t = tf.browser.fromPixels(DOM.srcCanvas).toFloat();
			const ker = tf.tensor2d(kValues, [size, size])
				.reverse(0).reverse(1)
				.expandDims(-1).expandDims(-1);

			const channels = tf.split(t, 3, 2);
			const processed = channels.map(ch =>
				tf.conv2d(ch.expandDims(0), ker, 1, 'same').squeeze()
			);

			const combined = tf.stack(processed, 2).clipByValue(0, 255).cast('int32');
			tf.browser.toPixels(combined, DOM.resCanvas);
		});
		updateKernelViz(kValues, size);
	} catch (err) {
		warn('visionlab', `TFJS not ready yet: ${err}`);
	}
}

// --- Kernel Preset Setter ---
function setKernel(matrix) {
	DOM.kSize.value = matrix.length;
	initVisionLab();
	const inps = document.querySelectorAll('.k-inp');
	matrix.flat().forEach((val, i) => {
		if (inps[i]) inps[i].value = parseFloat(val.toFixed(4));
	});
	runConv();
}

// --- Kernel Heatmap Visualization ---
function updateKernelViz(kValues, size) {
	if (!DOM.kernelViz) return;
	DOM.kernelViz.width = size;
	DOM.kernelViz.height = size;
	const ctx = DOM.kernelViz.getContext('2d');

	const maxAbs = Math.max(...kValues.map(Math.abs), CONFIG.EPSILON);

	for (let i = 0; i < kValues.length; i++) {
		const x = i % size;
		const y = Math.floor(i / size);
		const norm = kValues[i] / maxAbs; // -1 to 1

		let r, g, b;
		if (norm >= 0) {
			r = Math.round(255 * (1 - norm));
			g = Math.round(255 * (1 - norm));
			b = 255;
		} else {
			r = 255;
			g = Math.round(255 * (1 + norm));
			b = Math.round(255 * (1 + norm));
		}
		ctx.fillStyle = `rgb(${r},${g},${b})`;
		ctx.fillRect(x, y, 1, 1);
	}
}

// --- Convolution Math Display ---
let mathRafId = null;

function updateConvMath(x, y, size) {
	if (mathRafId) cancelAnimationFrame(mathRafId);
	mathRafId = requestAnimationFrame(() => {
		_updateConvMathInner(x, y, size);
	});
}

function extractPatchData(ctx, x, y, size) {
	const offset = Math.floor(size / 2);
	const imgData = ctx.getImageData(x - offset, y - offset, size, size).data;
	const kValues = getKernelValues();

	const pixels = [];
	const sums = { r: 0, g: 0, b: 0 };

	for (let i = 0; i < kValues.length; i++) {
		const r = imgData[i * 4];
		const g = imgData[i * 4 + 1];
		const b = imgData[i * 4 + 2];
		const weight = kValues[i];

		sums.r += r * weight;
		sums.g += g * weight;
		sums.b += b * weight;

		pixels.push({
			r, g, b, weight,
			localX: (x - offset) + (i % size),
			localY: (y - offset) + Math.floor(i / size),
		});
	}
	return { pixels, sums };
}

function buildConvLatex(x, y, pixels, sums) {
	const parts = pixels.map(p => {
		const vec = `\\begin{pmatrix} ${p.r} \\\\ ${p.g} \\\\ ${p.b} \\end{pmatrix}`;
		return `\\underbrace{${vec}}_{(${p.localX},\\, ${p.localY})} \\cdot ${p.weight.toFixed(2)}`;
	});

	return `
    \\text{Output at } (${x},\\, ${y}): \\quad
    \\begin{pmatrix} y_{\\color{red}R} \\\\ y_{\\color{green}G} \\\\ y_{\\color{blue}B} \\end{pmatrix} = 
    ${parts.join(" + ")} = 
    \\boxed{\\begin{pmatrix} ${clamp(sums.r)} \\\\ ${clamp(sums.g)} \\\\ ${clamp(sums.b)} \\end{pmatrix}}`;
}

function _updateConvMathInner(x, y, size) {
	const ctx = DOM.srcCanvas.getContext('2d', { willReadFrequently: true });
	const { pixels, sums } = extractPatchData(ctx, x, y, size);
	const formula = buildConvLatex(x, y, pixels, sums);

	DOM.mathStep.innerHTML = `$$ ${formula} $$`;
	render_temml();
}

// --- Pixel Info Tooltip ---
function showPixelInfo(x, y, srcCanvas) {
	const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
	const px = ctx.getImageData(x, y, 1, 1).data;
	if (!DOM.pixelInfo) return;
	DOM.pixelInfo.style.display = 'block';
	DOM.pixelInfo.innerHTML = `
		<span style="color:#ef4444">R:${px[0]}</span>
		<span style="color:#22c55e">G:${px[1]}</span>
		<span style="color:#3b82f6">B:${px[2]}</span>
		<span style="color:#94a3b8">(${x}, ${y})</span>
	`;
}

// --- Main Init ---
function initVisionLab() {
	cacheDOMRefs();

	const size = getKernelSize();
	DOM.kernelTable.innerHTML = "";

	for (let i = 0; i < size; i++) {
		let tr = DOM.kernelTable.insertRow();
		for (let j = 0; j < size; j++) {
			let td = tr.insertCell();
			let inp = document.createElement('input');
			inp.type = "number";
			inp.className = "k-inp";
			inp.style.width = "48px";
			inp.style.textAlign = "center";
			inp.step = "0.1";
			inp.value = (i === Math.floor(size / 2) && j === Math.floor(size / 2)) ? 1 : 0;
			inp.oninput = debounce(runConv, CONFIG.DEBOUNCE_MS);
			td.appendChild(inp);
		}
	}

	const setupCanvas = () => {
		const ctx = DOM.srcCanvas.getContext('2d', { willReadFrequently: true });
		ctx.drawImage(DOM.srcHidden, 0, 0, CONFIG.SRC_SIZE, CONFIG.SRC_SIZE);
		setTimeout(runConv, 100);
	};

	if (DOM.srcHidden.complete) setupCanvas();
	else DOM.srcHidden.onload = setupCanvas;

	DOM.srcCanvas.onmousemove = (e) => {
		const rect = DOM.srcCanvas.getBoundingClientRect();
		const scale = rect.width / CONFIG.SRC_SIZE;

		const x = Math.floor((e.clientX - rect.left) / scale);
		const y = Math.floor((e.clientY - rect.top) / scale);
		const offset = Math.floor(size / 2);

		DOM.focus.style.display = 'block';
		DOM.focus.style.width = (size * scale) + "px";
		DOM.focus.style.height = (size * scale) + "px";
		DOM.focus.style.left = ((x - offset) * scale) + "px";
		DOM.focus.style.top = (DOM.srcCanvas.offsetTop + (y - offset) * scale) + "px";

		DOM.cross.style.display = 'block';
		DOM.cross.style.left = (x * scale + scale / 2) + "px";
		DOM.cross.style.top = (DOM.resCanvas.offsetTop + y * scale + scale / 2) + "px";

		showPixelInfo(x, y, DOM.srcCanvas);
		updateConvMath(x, y, size);
	};

	DOM.srcCanvas.onmouseleave = () => {
		DOM.focus.style.display = 'none';
		DOM.cross.style.display = 'none';
		if (DOM.pixelInfo) DOM.pixelInfo.style.display = 'none';
	};
}

// ============================================================
// FEATURE LAB — Multi-filter Feature Map + Heatmap Explorer
// ============================================================
window.FeatureLab = {
	presets: {
		horizontal_0:  [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
		vertical_90:   [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
		diagonal_45:   [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]],
		diagonal_315:  [[2, 1, 0], [1, 0, -1], [0, -1, -2]],
		sharpen:       [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
		blur:          [[0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1]]
	},

	presetDescriptions: {
		horizontal_0:  "Sobel filter detecting horizontal edges (gradients in the Y direction). Bright pixels indicate strong horizontal transitions.",
		vertical_90:   "Sobel filter detecting vertical edges (gradients in the X direction). Bright pixels indicate strong vertical transitions.",
		diagonal_45:   "Detects edges running at 45° (bottom-left to top-right). Useful for finding angled structures.",
		diagonal_315:  "Detects edges running at 315° (top-left to bottom-right). Complements the 45° filter for full diagonal coverage."
	},

	activeFilters: [
		{ name: "0° (Horizontal)",    type: "horizontal_0" },
		{ name: "90° (Vertical)",     type: "vertical_90" },
		{ name: "45° (Diagonal ↗)",   type: "diagonal_45" },
		{ name: "315° (Diagonal ↘)",  type: "diagonal_315" }
	],

	init: function () {
		this.renderInterface();
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = "stop_sign.jpg";
		img.onload = () => {
			const ctx = DOM.featSrc.getContext('2d');
			ctx.drawImage(img, 0, 0, CONFIG.FEAT_SIZE, CONFIG.FEAT_SIZE);
			this.runAll();
		};
	},

	createFilterCard: function (filter, index) {
		const desc = this.presetDescriptions[filter.type] || "";
		const kernelInputs = this.presets[filter.type].flat()
			.map(v => `<input type="number" value="${v}" step="0.1" 
				oninput="FeatureLab.runAll()" 
				style="width:100%; font-size:0.7rem; text-align:center; padding:2px; border:1px solid #cbd5e1; border-radius:4px;">`)
			.join('');

		const container = document.createElement('div');
		container.className = "filter-card";
		container.style = "background: white; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: box-shadow 0.2s;";
		container.onmouseenter = () => container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
		container.onmouseleave = () => container.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
		container.innerHTML = `
			<div style="font-size:0.8rem; font-weight:600; margin-bottom:6px; color:#1e293b;">${filter.name}</div>
			<div style="font-size:0.7rem; color:#64748b; margin-bottom:8px; line-height:1.4;">${desc}</div>
			<div id="matrix-${index}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-bottom: 10px;">
				${kernelInputs}
			</div>
			<div style="position:relative;">
				<canvas id="res-${index}" width="${CONFIG.FEAT_SIZE}" height="${CONFIG.FEAT_SIZE}" style="background:#000; border-radius:6px; width:100%;"></canvas>
				<div id="stats-${index}" style="font-size:0.65rem; color:#94a3b8; margin-top:4px; text-align:center;"></div>
			</div>
		`;
		return container;
	},

	createHeatmapSection: function () {
		const heatmapWrap = document.createElement('div');
		heatmapWrap.style = "grid-column: span 2; margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; text-align: center;";
		heatmapWrap.innerHTML = `
			<strong style="display:block; margin-bottom:4px; color: #fbbf24; font-size:1rem;">Layer 2: Octagon Shape Detector</strong>
			<p style="font-size: 0.78rem; margin-bottom:12px; color: #cbd5e1; max-width:500px; margin-left:auto; margin-right:auto; line-height:1.5;">
				This heatmap combines all 4 edge detectors above. Bright yellow regions indicate areas where <em>multiple</em> edge orientations were detected simultaneously — a strong signal for corners and complex shapes like the octagonal stop sign.
			</p>
			<canvas id="heatmap-res" width="${CONFIG.FEAT_SIZE}" height="${CONFIG.FEAT_SIZE}" style="width:200px; height:200px; border: 2px solid #fbbf24; border-radius: 8px; image-rendering: pixelated;"></canvas>
			<div style="display:flex; justify-content:center; gap:20px; margin-top:10px;">
				<span style="font-size:0.7rem; color:#64748b;">⬛ No edges</span>
				<span style="font-size:0.7rem; color:#f59e0b;">🟨 Weak signal</span>
				<span style="font-size:0.7rem; color:#fbbf24;">🟧 Strong multi-edge</span>
			</div>
		`;
		return heatmapWrap;
	},

	renderInterface: function () {
		DOM.filterGrid.innerHTML = "";
		DOM.filterGrid.style.gridTemplateColumns = "repeat(2, 1fr)";

		this.activeFilters.forEach((f, i) => {
			DOM.filterGrid.appendChild(this.createFilterCard(f, i));
		});

		DOM.filterGrid.appendChild(this.createHeatmapSection());

		// Re-cache heatmap canvas after it's been created
		DOM.heatmapRes = document.getElementById('heatmap-res');
	},

	getFilterKernelValues: function (index) {
		const inputs = document.querySelectorAll(`#matrix-${index} input`);
		return Array.from(inputs).map(inp => parseFloat(inp.value) || 0);
	},

	runAll: async function () {
		if (!DOM.featSrc) return;

		tf.tidy(() => {
			const input = tf.browser.fromPixels(DOM.featSrc)
				.mean(2).expandDims(-1).expandDims(0).toFloat();
			let combinedActivations = tf.zeros([CONFIG.FEAT_SIZE, CONFIG.FEAT_SIZE, 1]);

			for (let i = 0; i < this.activeFilters.length; i++) {
				const resCanvas = document.getElementById(`res-${i}`);
				const statsDiv = document.getElementById(`stats-${i}`);
				const kData = this.getFilterKernelValues(i);
				const kernel = tf.tensor2d(kData, [3, 3]).expandDims(-1).expandDims(-1);

				let conv = tf.conv2d(input, kernel, 1, 'same').abs().squeeze();

				combinedActivations = combinedActivations.add(conv.expandDims(-1));

				// Stats
				const maxVal = conv.max().dataSync()[0];
				const meanVal = conv.mean().dataSync()[0];
				if (statsDiv) {
					statsDiv.textContent = `max: ${maxVal.toFixed(1)} | mean: ${meanVal.toFixed(1)}`;
				}

				const norm = conv.div(conv.max().add(CONFIG.EPSILON));
				tf.browser.toPixels(norm, resCanvas);
			}

			// Heatmap
			const heatCanvas = DOM.heatmapRes;
			const heatData = combinedActivations.squeeze().pow(2);
			const heatNorm = heatData.div(heatData.max().add(CONFIG.EPSILON));

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
	cacheDOMRefs();
	FeatureLab.init();
	initVisionLab();
	return Promise.resolve();
}
