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
