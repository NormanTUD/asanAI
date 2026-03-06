// ============================================================
// VISIONLAB.JS — Interactive Convolution & Feature Map Explorer
// Refactored for maximum DRY, readability, and debuggability.
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

const DOM_ID_MAP = {
	srcCanvas:   'conv-src-display',
	resCanvas:   'conv-res',
	kSize:       'k-size',
	kernelTable: 'kernel-table',
	focus:       'conv-focus',
	cross:       'conv-crosshair',
	mathStep:    'conv-math-step',
	pixelInfo:   'pixel-info',
	kernelViz:   'kernel-viz',
	srcHidden:   'conv-src-hidden',
	featSrc:     'feat-src',
	filterGrid:  'filter-grid',
	heatmapRes:  'heatmap-res',
};

function cacheDOMRefs() {
	console.debug('[visionlab] Caching DOM references...');
	for (const [key, id] of Object.entries(DOM_ID_MAP)) {
		DOM[key] = document.getElementById(id);
		if (!DOM[key]) {
			console.warn(`[visionlab] DOM element not found: #${id} (key: ${key}). It may be created later.`);
		}
	}
	console.debug('[visionlab] DOM cache complete:', Object.keys(DOM).filter(k => DOM[k]).length, 'elements found');
}

// --- Utility: Debounce ---
function debounce(fn, ms) {
	console.assert(typeof fn === 'function', '[visionlab] debounce: fn must be a function, got:', typeof fn);
	console.assert(typeof ms === 'number' && ms > 0, '[visionlab] debounce: ms must be a positive number, got:', ms);
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), ms);
	};
}

// --- Shared Helpers ---
function getKernelSize() {
	if (!DOM.kSize) {
		console.error('[visionlab] getKernelSize: DOM.kSize is null. Was cacheDOMRefs() called?');
		return CONFIG.DEFAULT_KERNEL_SIZE;
	}
	const size = parseInt(DOM.kSize.value) || CONFIG.DEFAULT_KERNEL_SIZE;
	if (size < CONFIG.MIN_KERNEL_SIZE || size > CONFIG.MAX_KERNEL_SIZE) {
		console.warn(`[visionlab] getKernelSize: size ${size} is outside valid range [${CONFIG.MIN_KERNEL_SIZE}, ${CONFIG.MAX_KERNEL_SIZE}]. Clamping.`);
		return Math.max(CONFIG.MIN_KERNEL_SIZE, Math.min(CONFIG.MAX_KERNEL_SIZE, size));
	}
	if (size % 2 === 0) {
		console.warn(`[visionlab] getKernelSize: even kernel size ${size} may cause alignment issues.`);
	}
	return size;
}

function getInputValues(selector) {
	const inputs = document.querySelectorAll(selector);
	if (inputs.length === 0) {
		console.warn(`[visionlab] getInputValues: no inputs found for selector "${selector}"`);
	}
	return Array.from(inputs).map(i => parseFloat(i.value) || 0);
}

function getKernelValues() {
	return getInputValues('.k-inp');
}

function clamp(v) {
	return Math.max(0, Math.min(255, Math.round(v)));
}

// --- Generic Canvas Helpers ---
function getCanvasCtx(canvas, label) {
	console.assert(canvas instanceof HTMLCanvasElement, `[visionlab] getCanvasCtx(${label || '?'}): expected HTMLCanvasElement, got:`, canvas);
	return canvas.getContext('2d', { willReadFrequently: true });
}

function drawImageToCanvas(canvas, image, width, height, label) {
	console.assert(canvas instanceof HTMLCanvasElement, `[visionlab] drawImageToCanvas(${label || '?'}): canvas is not an HTMLCanvasElement`);
	console.assert(width > 0 && height > 0, `[visionlab] drawImageToCanvas(${label || '?'}): invalid dimensions ${width}x${height}`);
	getCanvasCtx(canvas, label).drawImage(image, 0, 0, width, height);
	console.debug(`[visionlab] drawImageToCanvas(${label || '?'}): drew ${width}x${height}`);
}

function loadImageOntoCanvas(canvas, imageSource, width, height, callback, label) {
	console.assert(canvas instanceof HTMLCanvasElement, `[visionlab] loadImageOntoCanvas(${label || '?'}): canvas is not an HTMLCanvasElement`);
	const doSetup = () => {
		drawImageToCanvas(canvas, imageSource, width, height, label);
		console.debug(`[visionlab] loadImageOntoCanvas(${label || '?'}): image loaded and drawn`);
		if (callback) callback();
	};
	if (imageSource.complete && imageSource.naturalWidth > 0) {
		doSetup();
	} else {
		console.debug(`[visionlab] loadImageOntoCanvas(${label || '?'}): waiting for image to load...`);
		imageSource.onload = doSetup;
		imageSource.onerror = () => {
			console.error(`[visionlab] loadImageOntoCanvas(${label || '?'}): image failed to load. src="${imageSource.src}"`);
		};
	}
}

function getPixelAt(canvas, x, y, label) {
	console.assert(canvas instanceof HTMLCanvasElement, `[visionlab] getPixelAt(${label || '?'}): expected HTMLCanvasElement`);
	console.assert(
		x >= 0 && x < canvas.width && y >= 0 && y < canvas.height,
		`[visionlab] getPixelAt(${label || '?'}): coords (${x},${y}) out of bounds for ${canvas.width}x${canvas.height}`
	);
	return getCanvasCtx(canvas, label).getImageData(x, y, 1, 1).data;
}

// --- Generic Overlay Positioning ---
function positionOverlay(el, { display = 'block', left, top, width, height } = {}) {
	if (!el) {
		console.warn('[visionlab] positionOverlay: element is null/undefined, skipping.');
		return;
	}
	el.style.display = display;
	if (left !== undefined) el.style.left = left + 'px';
	if (top !== undefined) el.style.top = top + 'px';
	if (width !== undefined) el.style.width = width + 'px';
	if (height !== undefined) el.style.height = height + 'px';
}

function hideOverlays(...elements) {
	elements.forEach(el => {
		if (el) el.style.display = 'none';
	});
}

// --- Mouse Coordinate Helper ---
function canvasMouseCoords(e, canvas, logicalSize) {
	console.assert(canvas instanceof HTMLCanvasElement, '[visionlab] canvasMouseCoords: expected HTMLCanvasElement');
	const rect = canvas.getBoundingClientRect();
	const scale = rect.width / logicalSize;
	console.assert(scale > 0, `[visionlab] canvasMouseCoords: invalid scale ${scale} (rect.width=${rect.width}, logicalSize=${logicalSize})`);
	return {
		x: Math.floor((e.clientX - rect.left) / scale),
		y: Math.floor((e.clientY - rect.top) / scale),
		scale,
	};
}

// --- TF.js Tensor Shape Assertions ---
function assertTensorRank(tensor, expectedRank, label) {
	console.assert(
		tensor.rank === expectedRank,
		`[visionlab] ${label}: expected rank ${expectedRank}, got rank ${tensor.rank} with shape [${tensor.shape}]`
	);
}

function assertTensorShape(tensor, expectedShape, label) {
	const match = tensor.shape.length === expectedShape.length &&
		tensor.shape.every((dim, i) => expectedShape[i] === null || dim === expectedShape[i]);
	console.assert(
		match,
		`[visionlab] ${label}: expected shape [${expectedShape.map(d => d === null ? '?' : d)}], got [${tensor.shape}]`
	);
}

// --- Generic TF.js Convolution ---
// inputTensor4D MUST be [batch, height, width, channels] — always rank 4
function applyConv2D(inputTensor4D, kernelData, kernelSize, flipKernel = false) {
	assertTensorRank(inputTensor4D, 4, 'applyConv2D/input');
	const inChannels = inputTensor4D.shape[3];
	console.assert(
		inChannels === 1,
		`[visionlab] applyConv2D: input depth must be 1 for single-channel conv, got ${inChannels}. Shape: [${inputTensor4D.shape}]`
	);
	console.assert(
		kernelData.length === kernelSize * kernelSize,
		`[visionlab] applyConv2D: kernelData length ${kernelData.length} does not match kernelSize ${kernelSize}x${kernelSize}=${kernelSize * kernelSize}`
	);

	let ker = tf.tensor2d(kernelData, [kernelSize, kernelSize]);
	if (flipKernel) {
		ker = ker.reverse(0).reverse(1);
	}
	ker = ker.expandDims(-1).expandDims(-1);
	// ker shape: [kernelSize, kernelSize, 1, 1]
	assertTensorShape(ker, [kernelSize, kernelSize, 1, 1], 'applyConv2D/kernel');

	const result = tf.conv2d(inputTensor4D, ker, 1, 'same').squeeze();
	console.debug(`[visionlab] applyConv2D: input [${inputTensor4D.shape}] * kernel [${ker.shape}] => output [${result.shape}]`);
	return result;
}

function applyMultiChannelConv(sourceCanvas, kernelData, kernelSize) {
	console.assert(sourceCanvas instanceof HTMLCanvasElement, '[visionlab] applyMultiChannelConv: sourceCanvas is not an HTMLCanvasElement');
	const t = tf.browser.fromPixels(sourceCanvas).toFloat();
	assertTensorRank(t, 3, 'applyMultiChannelConv/fromPixels');
	console.debug(`[visionlab] applyMultiChannelConv: source tensor shape [${t.shape}]`);

	const channels = tf.split(t, 3, 2);
	console.assert(channels.length === 3, `[visionlab] applyMultiChannelConv: expected 3 channels, got ${channels.length}`);

	const processed = channels.map((ch, i) => {
		// ch shape: [H, W, 1] — need [1, H, W, 1]
		const ch4D = ch.expandDims(0);
		assertTensorShape(ch4D, [1, null, null, 1], `applyMultiChannelConv/channel${i}`);
		return applyConv2D(ch4D, kernelData, kernelSize, true);
	});

	return tf.stack(processed, 2).clipByValue(0, 255).cast('int32');
}

function applyGrayscaleConv(input4D, kernelData) {
	assertTensorRank(input4D, 4, 'applyGrayscaleConv/input');
	assertTensorShape(input4D, [1, null, null, 1], 'applyGrayscaleConv/input');
	console.assert(
		kernelData.length === 9,
		`[visionlab] applyGrayscaleConv: expected 9 kernel values (3x3), got ${kernelData.length}`
	);
	return applyConv2D(input4D, kernelData, 3, false).abs();
}

// --- Normalization Helper ---
function normalizeTensor(tensor, label) {
	const maxVal = tensor.max();
	const maxScalar = maxVal.dataSync()[0];
	if (maxScalar < CONFIG.EPSILON) {
		console.warn(`[visionlab] normalizeTensor(${label || '?'}): max value is near zero (${maxScalar}). Output will be all black.`);
	}
	return tensor.div(maxVal.add(CONFIG.EPSILON));
}

// --- Kernel Heatmap Visualization ---
function kernelValueToColor(norm) {
	console.assert(
		norm >= -1 && norm <= 1,
		`[visionlab] kernelValueToColor: norm ${norm} is outside [-1, 1]`
	);
	if (norm >= 0) {
		const inv = Math.round(255 * (1 - norm));
		return { r: inv, g: inv, b: 255 };
	} else {
		const inv = Math.round(255 * (1 + norm));
		return { r: 255, g: inv, b: inv };
	}
}

function updateKernelViz(kValues, size) {
	if (!DOM.kernelViz) {
		console.warn('[visionlab] updateKernelViz: DOM.kernelViz is null, skipping.');
		return;
	}
	console.assert(
		kValues.length === size * size,
		`[visionlab] updateKernelViz: kValues length ${kValues.length} != size*size ${size * size}`
	);

	DOM.kernelViz.width = size;
	DOM.kernelViz.height = size;
	const ctx = DOM.kernelViz.getContext('2d');
	const maxAbs = Math.max(...kValues.map(Math.abs), CONFIG.EPSILON);

	for (let i = 0; i < kValues.length; i++) {
		const { r, g, b } = kernelValueToColor(kValues[i] / maxAbs);
		ctx.fillStyle = `rgb(${r},${g},${b})`;
		ctx.fillRect(i % size, Math.floor(i / size), 1, 1);
	}
}

// --- Convolution Runner ---
async function runConv() {
	if (!DOM.srcCanvas || DOM.srcCanvas.width === 0) {
		console.warn('[visionlab] runConv: srcCanvas not ready, skipping.');
		return;
	}
	if (!DOM.resCanvas) {
		console.error('[visionlab] runConv: resCanvas is null. Cannot render output.');
		return;
	}

	const size = getKernelSize();
	const kValues = getKernelValues();

	if (kValues.length !== size * size) {
		console.error(`[visionlab] runConv: kernel values count ${kValues.length} does not match expected ${size}x${size}=${size * size}. Aborting.`);
		return;
	}

	try {
		tf.tidy(() => {
			const combined = applyMultiChannelConv(DOM.srcCanvas, kValues, size);
			tf.browser.toPixels(combined, DOM.resCanvas);
		});
		updateKernelViz(kValues, size);
		console.debug(`[visionlab] runConv: completed successfully with ${size}x${size} kernel`);
	} catch (err) {
		console.error('[visionlab] runConv: TF.js error:', err.message, err.stack);
	}
}

// --- Kernel Preset Setter ---
function setKernel(matrix) {
	console.assert(Array.isArray(matrix) && matrix.length > 0, '[visionlab] setKernel: matrix must be a non-empty array');
	console.assert(
		matrix.every(row => Array.isArray(row) && row.length === matrix.length),
		'[visionlab] setKernel: matrix must be square'
	);

	DOM.kSize.value = matrix.length;
	initVisionLab();
	const inps = document.querySelectorAll('.k-inp');

	const flat = matrix.flat();
	if (inps.length !== flat.length) {
		console.error(`[visionlab] setKernel: input count ${inps.length} does not match matrix size ${flat.length}`);
		return;
	}

	flat.forEach((val, i) => {
		inps[i].value = parseFloat(val.toFixed(4));
	});
	runConv();
	console.info(`[visionlab] setKernel: applied ${matrix.length}x${matrix.length} kernel preset`);
}

// --- Convolution Math Display ---
let mathRafId = null;

function updateConvMath(x, y, size) {
	if (mathRafId) cancelAnimationFrame(mathRafId);
	mathRafId = requestAnimationFrame(() => _updateConvMathInner(x, y, size));
}

function extractPatchData(ctx, x, y, size) {
	const offset = Math.floor(size / 2);
	const imgData = ctx.getImageData(x - offset, y - offset, size, size).data;
	const kValues = getKernelValues();

	console.assert(
		imgData.length === size * size * 4,
		`[visionlab] extractPatchData: expected ${size * size * 4} bytes, got ${imgData.length}`
	);
	console.assert(
		kValues.length === size * size,
		`[visionlab] extractPatchData: kernel values count ${kValues.length} != ${size * size}`
	);

	const pixels = [];
	const sums = { r: 0, g: 0, b: 0 };

	for (let i = 0; i < kValues.length; i++) {
		const base = i * 4;
		const r = imgData[base];
		const g = imgData[base + 1];
		const b = imgData[base + 2];
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
	if (!DOM.srcCanvas || !DOM.mathStep) {
		console.warn('[visionlab] _updateConvMathInner: required DOM elements missing.');
		return;
	}
	const ctx = getCanvasCtx(DOM.srcCanvas, 'mathInner');
	const { pixels, sums } = extractPatchData(ctx, x, y, size);
	DOM.mathStep.innerHTML = `$$ ${buildConvLatex(x, y, pixels, sums)} $$`;
	render_temml();
}

// --- Pixel Info Tooltip ---
function showPixelInfo(x, y, srcCanvas) {
	if (!DOM.pixelInfo) {
		console.warn('[visionlab] showPixelInfo: DOM.pixelInfo is null, skipping.');
		return;
	}
	const px = getPixelAt(srcCanvas, x, y, 'pixelInfo');
	DOM.pixelInfo.style.display = 'block';
	DOM.pixelInfo.innerHTML = [
		{ color: '#ef4444', label: 'R', val: px[0] },
		{ color: '#22c55e', label: 'G', val: px[1] },
		{ color: '#3b82f6', label: 'B', val: px[2] },
		{ color: '#94a3b8', label: null, val: `(${x}, ${y})` },
	].map(c => `<span style="color:${c.color}">${c.label ? c.label + ':' : ''}${c.val}</span>`).join('');
}

// --- Kernel Table Builder ---
function buildKernelTable(size) {
	if (!DOM.kernelTable) {
		console.error('[visionlab] buildKernelTable: DOM.kernelTable is null.');
		return;
	}
	console.debug(`[visionlab] buildKernelTable: building ${size}x${size} table`);
	DOM.kernelTable.innerHTML = "";
	const center = Math.floor(size / 2);

	for (let i = 0; i < size; i++) {
		const tr = DOM.kernelTable.insertRow();
		for (let j = 0; j < size; j++) {
			const td = tr.insertCell();
			const inp = document.createElement('input');
			Object.assign(inp, {
				type: "number",
				className: "k-inp",
				step: "0.1",
				value: (i === center && j === center) ? 1 : 0,
			});
			inp.style.cssText = "width:48px; text-align:center;";
			inp.oninput = debounce(runConv, CONFIG.DEBOUNCE_MS);
			td.appendChild(inp);
		}
	}
}

// --- Main Init ---
function initVisionLab() {
	console.info('[visionlab] initVisionLab: initializing...');
	cacheDOMRefs();

	if (!DOM.srcCanvas) {
		console.error('[visionlab] initVisionLab: srcCanvas (#conv-src-display) not found. Aborting.');
		return;
	}
	if (!DOM.srcHidden) {
		console.error('[visionlab] initVisionLab: srcHidden (#conv-src-hidden) not found. Aborting.');
		return;
	}

	const size = getKernelSize();
	buildKernelTable(size);

	loadImageOntoCanvas(DOM.srcCanvas, DOM.srcHidden, CONFIG.SRC_SIZE, CONFIG.SRC_SIZE, () => {
		setTimeout(runConv, 100);
	}, 'srcCanvas');

	DOM.srcCanvas.onmousemove = (e) => {
		const { x, y, scale } = canvasMouseCoords(e, DOM.srcCanvas, CONFIG.SRC_SIZE);
		const offset = Math.floor(size / 2);

		positionOverlay(DOM.focus, {
			left: (x - offset) * scale,
			top: DOM.srcCanvas.offsetTop + (y - offset) * scale,
			width: size * scale,
			height: size * scale,
		});

		positionOverlay(DOM.cross, {
			left: x * scale + scale / 2,
			top: DOM.resCanvas.offsetTop + y * scale + scale / 2,
		});

		showPixelInfo(x, y, DOM.srcCanvas);
		updateConvMath(x, y, size);
	};

	DOM.srcCanvas.onmouseleave = () => {
		hideOverlays(DOM.focus, DOM.cross, DOM.pixelInfo);
	};

	console.info('[visionlab] initVisionLab: complete.');
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
		console.info('[FeatureLab] init: starting...');

		if (!DOM.featSrc) {
			console.error('[FeatureLab] init: DOM.featSrc (#feat-src) not found. Aborting.');
			return;
		}
		if (!DOM.filterGrid) {
			console.error('[FeatureLab] init: DOM.filterGrid (#filter-grid) not found. Aborting.');
			return;
		}

		this.renderInterface();

		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = "stop_sign.jpg";

		loadImageOntoCanvas(DOM.featSrc, img, CONFIG.FEAT_SIZE, CONFIG.FEAT_SIZE, () => {
			console.info('[FeatureLab] init: source image loaded, running filters...');
			this.runAll();
		}, 'featSrc');
	},

	createFilterCard: function (filter, index) {
		console.assert(filter && filter.type, `[FeatureLab] createFilterCard: invalid filter at index ${index}`);
		console.assert(
			this.presets[filter.type],
			`[FeatureLab] createFilterCard: no preset found for type "${filter.type}"`
		);

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
		if (!DOM.filterGrid) {
			console.error('[FeatureLab] renderInterface: DOM.filterGrid is null. Aborting.');
			return;
		}
		console.debug('[FeatureLab] renderInterface: building UI...');
		DOM.filterGrid.innerHTML = "";
		DOM.filterGrid.style.gridTemplateColumns = "repeat(2, 1fr)";

		this.activeFilters.forEach((f, i) => {
			DOM.filterGrid.appendChild(this.createFilterCard(f, i));
		});

		DOM.filterGrid.appendChild(this.createHeatmapSection());

		// Re-cache heatmap canvas after it's been dynamically created
		DOM.heatmapRes = document.getElementById('heatmap-res');
		if (!DOM.heatmapRes) {
			console.error('[FeatureLab] renderInterface: heatmap-res canvas was not created.');
		}
		console.debug('[FeatureLab] renderInterface: complete.');
	},

	getFilterKernelValues: function (index) {
		return getInputValues(`#matrix-${index} input`);
	},

	runAll: async function () {
		if (!DOM.featSrc) {
			console.error('[FeatureLab] runAll: DOM.featSrc is null. Was init() called?');
			return;
		}
		if (!DOM.heatmapRes) {
			console.error('[FeatureLab] runAll: DOM.heatmapRes is null. Was renderInterface() called?');
			return;
		}

		console.debug('[FeatureLab] runAll: starting filter pass...');
		const filterCount = this.activeFilters.length;

		try {
			tf.tidy(() => {
				const raw = tf.browser.fromPixels(DOM.featSrc);
				assertTensorRank(raw, 3, 'FeatureLab.runAll/fromPixels');

				// Convert to grayscale: [H, W, 3] -> [1, H, W, 1]
				const input = raw.mean(2).expandDims(-1).expandDims(0).toFloat();
				assertTensorShape(input, [1, CONFIG.FEAT_SIZE, CONFIG.FEAT_SIZE, 1], 'FeatureLab.runAll/input');

				let combinedActivations = tf.zeros([CONFIG.FEAT_SIZE, CONFIG.FEAT_SIZE, 1]);

				for (let i = 0; i < filterCount; i++) {
					const resCanvas = document.getElementById(`res-${i}`);
					const statsDiv = document.getElementById(`stats-${i}`);

					if (!resCanvas) {
						console.error(`[FeatureLab] runAll: canvas #res-${i} not found. Skipping filter ${i}.`);
						continue;
					}

					const kData = this.getFilterKernelValues(i);
					if (kData.length !== 9) {
						console.error(`[FeatureLab] runAll: filter ${i} has ${kData.length} kernel values, expected 9. Skipping.`);
						continue;
					}

					const conv = applyGrayscaleConv(input, kData);
					assertTensorRank(conv, 2, `FeatureLab.runAll/conv[${i}]`);

					combinedActivations = combinedActivations.add(conv.expandDims(-1));

					// Stats
					const maxVal = conv.max().dataSync()[0];
					const meanVal = conv.mean().dataSync()[0];
					if (statsDiv) {
						statsDiv.textContent = `max: ${maxVal.toFixed(1)} | mean: ${meanVal.toFixed(1)}`;
					}
					console.debug(`[FeatureLab] filter ${i}: max=${maxVal.toFixed(1)}, mean=${meanVal.toFixed(1)}`);

					const norm = normalizeTensor(conv, `filter-${i}`);
					tf.browser.toPixels(norm, resCanvas);
				}

				// --- Heatmap: combine all activations ---
				const heatData = combinedActivations.squeeze().pow(2);
				assertTensorRank(heatData, 2, 'FeatureLab.runAll/heatData');

				const heatNorm = normalizeTensor(heatData, 'heatmap');

				// Colormap: dark → orange → bright yellow
				const yellowHeat = tf.stack([
					heatNorm,
					heatNorm.mul(0.75),
					heatNorm.mul(0.15)
				], 2);
				assertTensorRank(yellowHeat, 3, 'FeatureLab.runAll/yellowHeat');

				tf.browser.toPixels(yellowHeat, DOM.heatmapRes);
				console.debug('[FeatureLab] runAll: heatmap rendered.');
			});

			console.info(`[FeatureLab] runAll: completed ${filterCount} filters + heatmap.`);
		} catch (err) {
			console.error('[FeatureLab] runAll: TF.js error:', err.message, err.stack);
		}
	}
};

// ============================================================
// MODULE LOADER
// ============================================================
// ============================================================
// LAZY LOADING FOR VISION MODULE
// ============================================================

const _visLazyRegistry = [];
let _visLazyObserver = null;

function _visLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _visLazyRegistry.push({ el, initFn, initialized: false });
}

function _visLazyCreateObserver() {
    if (_visLazyObserver) return;

    _visLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const match = _visLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _visLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, {
        rootMargin: rootMargin // uses the already-defined global const
    });

    _visLazyRegistry.forEach(r => {
        if (!r.initialized) {
            _visLazyObserver.observe(r.el);
        }
    });
}

// ============================================================
// REPLACEMENT: loadVisionModule (drop-in replacement)
// ============================================================

async function loadVisionModule() {
    console.info('[visionlab] loadVisionModule: registering lazy sections...');
    updateLoadingStatus("Loading section about Computer Vision...");

    // 1. Convolution Explorer (kernel table + source/result canvases)
    _visLazyRegister('conv-src-display', () => {
        console.info('[visionlab] lazy: initializing convolution explorer');
        cacheDOMRefs();
        initVisionLab();
    });

    // 2. Feature Lab (filter grid + heatmap)
    _visLazyRegister('filter-grid', () => {
        console.info('[visionlab] lazy: initializing FeatureLab');
        cacheDOMRefs();
        FeatureLab.init();
    });

    // Start observing
    _visLazyCreateObserver();

    console.info('[visionlab] loadVisionModule: lazy registration complete.');
    return Promise.resolve();
}

