async function runConv() {
	const resCanvas = document.getElementById('conv-res');
	const srcCanvas = document.getElementById('conv-src-display');
	if (!srcCanvas || srcCanvas.width === 0) return;

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
	} catch (err) {
		warn('visionlab', `TFJS not ready yet: ${err}`);
	}
}

function setKernel(matrix) {
	document.getElementById('k-size').value = matrix.length;
	initVisionLab();
	const inps = document.querySelectorAll('.k-inp');
	matrix.flat().forEach((val, i) => { if(inps[i]) inps[i].value = val; });
	runConv();
}

function updateConvMath(x, y, size) {
	const srcCanvas = document.getElementById('conv-src-display');
	const ctx = srcCanvas.getContext('2d', {willReadFrequently: true});
	const kValues = Array.from(document.querySelectorAll('.k-inp')).map(i => parseFloat(i.value) || 0);
	const offset = Math.floor(size/2);

	const imgData = ctx.getImageData(x - offset, y - offset, size, size).data;
	const targetDiv = document.getElementById('conv-math-step');

	let sums = { r: 0, g: 0, b: 0 };
	let latexParts = [];

	for(let i = 0; i < kValues.length; i++) {
		const weight = kValues[i];
		const localX = (x - offset) + (i % size);
		const localY = (y - offset) + Math.floor(i / size);

		const r = imgData[i * 4];
		const g = imgData[i * 4 + 1];
		const b = imgData[i * 4 + 2];

		sums.r += r * weight;
		sums.g += g * weight;
		sums.b += b * weight;

		// Create a vector for the RGB values at this specific coordinate
		const vector = `\\begin{bmatrix} ${r} \\\\ ${g} \\\\ ${b} \\end{bmatrix}`;
		latexParts.push(`\\underbrace{${vector}}_{${localX}, ${localY}} \\cdot ${weight.toFixed(1)}`);
	}

	const formula = `
    \\begin{bmatrix} y_\\text{Red} \\\\ y_\\text{Green} \\\\ y_\\text{Blue} \\end{bmatrix} = 
    ${latexParts.join(" + ")} = 
    \\mathbf{\\begin{bmatrix} ${Math.round(sums.r)} \\\\ ${Math.round(sums.g)} \\\\ ${Math.round(sums.b)} \\end{bmatrix}}`;

	targetDiv.innerHTML = `$$ ${formula} $$`;

	if (window.MathJax && window.MathJax.typesetPromise) {
		MathJax.typesetPromise([targetDiv]).catch((err) => console.log("visionlab", err.message));
	}
}

function initVisionLab() {
	const size = parseInt(document.getElementById('k-size').value) || 3;
	const kt = document.getElementById('kernel-table');
	kt.innerHTML = "";

	for(let i=0; i<size; i++) {
		let tr = kt.insertRow();
		for(let j=0; j<size; j++) {
			let td = tr.insertCell();
			let inp = document.createElement('input');
			inp.type="number"; inp.className="k-inp"; inp.style.width="40px";
			inp.value = (i === Math.floor(size/2) && j === Math.floor(size/2)) ? 1 : 0;
			inp.oninput = runConv;
			td.appendChild(inp);
		}
	}

	const img = document.getElementById('conv-src-hidden');
	const srcCanvas = document.getElementById('conv-src-display');
	const focus = document.getElementById('conv-focus');
	const cross = document.getElementById('conv-crosshair');
	const resCanvas = document.getElementById('conv-res');

	const setupCanvas = () => {
		const ctx = srcCanvas.getContext('2d', {willReadFrequently: true});
		ctx.drawImage(img, 0, 0, 50, 50);
		setTimeout(runConv, 100); 
	};

	if(img.complete) setupCanvas(); else img.onload = setupCanvas;

	srcCanvas.onmousemove = (e) => {
		const rect = srcCanvas.getBoundingClientRect();
		const scale = rect.width / 50;

		const x = Math.floor((e.clientX - rect.left) / scale);
		const y = Math.floor((e.clientY - rect.top) / scale);
		const offset = Math.floor(size/2);

		focus.style.display = 'block';
		focus.style.width = (size * scale) + "px";
		focus.style.height = (size * scale) + "px";
		focus.style.left = ((x - offset) * scale) + "px";
		focus.style.top = (srcCanvas.offsetTop + (y - offset) * scale) + "px";

		cross.style.display = 'block';
		cross.style.left = (x * scale + scale/2) + "px";
		cross.style.top = (resCanvas.offsetTop + y * scale + scale/2) + "px";

		updateConvMath(x, y, size);
	};

	srcCanvas.onmouseleave = () => {
		focus.style.display = 'none';
		cross.style.display = 'none';
	};
}

document.addEventListener('DOMContentLoaded', () => {
	initVisionLab();
});

window.FeatureLab = {
	// Verfügbare Presets für die Auswahl
	presets: {
		horizontal: [[-1,-2,-1],[0,0,0],[1,2,1]],
		vertical: [[-1,0,1],[-2,0,2],[-1,0,1]],
		diagonal: [[-2,-1,0],[-1,1,1],[0,1,2]],
		sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]],
		blur: [[0.1,0.1,0.1],[0.1,0.2,0.1],[0.1,0.1,0.1]],
		sobel_x: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
		sobel_y: [[1,2,1],[0,0,0],[-1,-2,-1]],
		diagonal_45: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]]
	},

	// Aktueller Zustand der 3 Filter
	activeFilters: [
		{ name: "Filter A", type: "horizontal" },
		{ name: "Filter B", type: "vertical" },
		{ name: "Filter C", type: "diagonal" }
	],

	init: function() {
		this.renderInterface();

		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = "example.jpg"; // Pfad zu deinem Testbild
		img.onload = () => {
			const ctx = document.getElementById('feat-src').getContext('2d');
			ctx.drawImage(img, 0, 0, 100, 100);
			this.runAll();
		};
	},

	renderInterface: function() {
		const grid = document.getElementById('filter-grid');
		grid.innerHTML = "";

		this.activeFilters.forEach((f, i) => {
			const container = document.createElement('div');
			container.className = "filter-card";
			container.style = "background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);";

			// UI für Preset-Wahl und Matrix-Editor
			container.innerHTML = `
		<div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
		    <strong style="color:#1e293b;">Slot ${String.fromCharCode(65+i)}</strong>
		    <select onchange="FeatureLab.applyPreset(${i}, this.value)" style="font-size: 0.75rem; padding: 2px;">
			${Object.keys(this.presets).map(p => `<option value="${p}" ${p===f.type?'selected':''}>${p}</option>`).join('')}
		    </select>
		</div>
		<div id="matrix-${i}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 15px;">
		    ${this.presets[f.type].flat().map(val => `
			<input type="number" step="0.1" value="${val}" 
			       oninput="FeatureLab.runAll()" 
			       style="width:100%; text-align:center; font-size:0.8rem; padding:4px; border:1px solid #cbd5e1; border-radius:4px;">
		    `).join('')}
		</div>
		<div style="text-align:center;">
		    <canvas id="res-${i}" width="100" height="100" style="width:100%; border-radius: 4px; background:#000; image-rendering: pixelated;"></canvas>
		    <small style="display:block; margin-top: 8px; color: #64748b;">Feature Map ${String.fromCharCode(65+i)}</small>
		</div>
	    `;
			grid.appendChild(container);
		});
	},

	applyPreset: function(index, presetKey) {
		const inputs = document.querySelectorAll(`#matrix-${index} input`);
		const values = this.presets[presetKey].flat();
		inputs.forEach((inp, i) => inp.value = values[i]);
		this.runAll();
	},

	runAll: async function() {
		const srcCanvas = document.getElementById('feat-src');
		if (!srcCanvas) return;

		try {
			tf.tidy(() => {
				const input = tf.browser.fromPixels(srcCanvas).mean(2).expandDims(-1).expandDims(0).toFloat();

				for (let i = 0; i < 3; i++) {
					const resCanvas = document.getElementById(`res-${i}`);
					const inputs = document.querySelectorAll(`#matrix-${i} input`);
					const kData = Array.from(inputs).map(inp => parseFloat(inp.value) || 0);

					const kernel = tf.tensor2d(kData, [3, 3]).expandDims(-1).expandDims(-1);
					let conv = tf.conv2d(input, kernel, 1, 'same').squeeze();

					// Normalisierung
					const min = conv.min();
					const max = conv.max();
					const normalized = conv.sub(min).div(max.sub(min).add(0.00001));

					tf.browser.toPixels(normalized, resCanvas);
				}
			});
		} catch (e) { console.error("Update error:", e); }
	}
};

window.addEventListener('load', () => FeatureLab.init());
