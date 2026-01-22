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
    presets: {
        horizontal_0: [[-1,-2,-1],[0,0,0],[1,2,1]],
        vertical_90: [[-1,0,1],[-2,0,2],[-1,0,1]],
        diagonal_45: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]],
        diagonal_315: [[2, 1, 0], [1, 0, -1], [0, -1, -2]],
        sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]],
        blur: [[0.1,0.1,0.1],[0.1,0.1,0.1],[0.1,0.1,0.1]]
    },

    activeFilters: [
        { name: "0° (Horiz)", type: "horizontal_0" },
        { name: "90° (Vert)", type: "vertical_90" },
        { name: "45° (Diag)", type: "diagonal_45" },
        { name: "315° (Diag)", type: "diagonal_315" }
    ],

    init: function() {
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

    renderInterface: function() {
        const grid = document.getElementById('filter-grid');
        grid.innerHTML = "";
        grid.style.gridTemplateColumns = "repeat(2, 1fr)";

        // Create the 4 feature map cards
        this.activeFilters.forEach((f, i) => {
            const container = document.createElement('div');
            container.className = "filter-card";
            container.style = "background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;";
            container.innerHTML = `
                <div style="font-size:0.75rem; margin-bottom:5px;"><strong>${f.name}</strong></div>
                <div id="matrix-${i}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-bottom: 8px;">
                    ${this.presets[f.type].flat().map(v => `<input type="number" value="${v}" oninput="FeatureLab.runAll()" style="width:100%; font-size:0.7rem;">`).join('')}
                </div>
                <canvas id="res-${i}" width="100" height="100" style="width:100%; background:#000;"></canvas>
            `;
            grid.appendChild(container);
        });

        // Append the Heatmap Section
        const heatmapWrap = document.createElement('div');
        heatmapWrap.style = "grid-column: span 2; margin-top: 20px; padding: 15px; color: white; border-radius: 12px; text-align: center;";
        heatmapWrap.innerHTML = `
            <strong style="display:block; margin-bottom:10px; color: black;">Layer 2: Octagon Shape Detector (Heatmap)</strong>
            <canvas id="heatmap-res" width="100" height="100" style="width:180px; height:180px; border: 2px solid #fbbf24; border-radius: 8px; image-rendering: pixelated;"></canvas>
            <p style="font-size: 0.75rem; margin-top: 8px; color: #94a3b8;">Brightest areas show where all 4 filters detected something.</p>
        `;
        grid.appendChild(heatmapWrap);
    },

    runAll: async function() {
        const srcCanvas = document.getElementById('feat-src');
        if (!srcCanvas) return;

        tf.tidy(() => {
            const input = tf.browser.fromPixels(srcCanvas).mean(2).expandDims(-1).expandDims(0).toFloat();
            let combinedActivations = tf.zeros([100, 100, 1]);

            for (let i = 0; i < this.activeFilters.length; i++) {
                const resCanvas = document.getElementById(`res-${i}`);
                const inputs = document.querySelectorAll(`#matrix-${i} input`);
                const kData = Array.from(inputs).map(inp => parseFloat(inp.value) || 0);
                const kernel = tf.tensor2d(kData, [3, 3]).expandDims(-1).expandDims(-1);
                
                // Convolve and absolute for magnitude
                let conv = tf.conv2d(input, kernel, 1, 'same').abs().squeeze();
                
                // Accumulate for heatmap
                combinedActivations = combinedActivations.add(conv.expandDims(-1));

                // Visualize individual feature map
                const norm = conv.div(conv.max().add(0.0001));
                tf.browser.toPixels(norm, resCanvas);
            }

            // Generate Heatmap (Layer 2 Combination)
            const heatCanvas = document.getElementById('heatmap-res');
            // Square the activations to highlight "coincidence" (hotspots)
            const heatData = combinedActivations.squeeze().pow(2); 
            const heatNorm = heatData.div(heatData.max().add(0.0001));
            
            // Map grayscale to a simple "Hot" scale (Yellow/Orange)
            const yellowHeat = tf.stack([
                heatNorm, // Red channel
                heatNorm.mul(0.8), // Green channel (creates orange/yellow)
                heatNorm.mul(0.2)  // Blue channel
            ], 2);

            tf.browser.toPixels(yellowHeat, heatCanvas);
        });
    }
};

window.addEventListener('load', () => FeatureLab.init());
