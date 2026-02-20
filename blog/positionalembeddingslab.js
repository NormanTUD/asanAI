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

function initPeFourierDemo() {
	const root = document.getElementById("pe-fourier-demo");
	if (!root) return;

	root.innerHTML = `
    <div style="font-family:sans-serif;max-width:820px;margin:0 auto;">
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
	<div style="flex:1;min-width:380px;">
	  <h3 style="margin:0 0 6px;">🌊 Fourier Wave Bank <span style="font-weight:normal;font-size:13px;">(d_model = 8)</span></h3>
	  <canvas id="pfd-waves" width="380" height="260" style="border:1px solid #ccc;border-radius:6px;background:#fafafa;width:100%;"></canvas>
	  <div style="margin-top:8px;">
	    <label><b>Position:</b></label>
	    <input type="range" id="pfd-pos" min="0" max="100" value="3" style="width:70%;vertical-align:middle;">
	    <span id="pfd-pos-label" style="font-weight:bold;">3</span>
	  </div>
	  <div style="margin-top:4px;">
	    <label><b>Offset k:</b></label>
	    <input type="range" id="pfd-k" min="0" max="20" value="5" style="width:70%;vertical-align:middle;">
	    <span id="pfd-k-label" style="font-weight:bold;">5</span>
	  </div>
	</div>
	<div style="flex:0 0 220px;">
	  <h3 style="margin:0 0 6px;">🔄 Rotation (Dim 0,1)</h3>
	  <canvas id="pfd-circle" width="220" height="220" style="border:1px solid #ccc;border-radius:6px;background:#fafafa;"></canvas>
	  <p style="font-size:12px;color:#555;margin:6px 0 0;">Blue = PE(pos), Red = PE(pos+k).<br>The rotation angle depends only on <b>k</b>.</p>
	</div>
      </div>
      <div style="margin-top:14px;">
	<h3 style="margin:0 0 6px;">📊 Position Fingerprint Vector</h3>
	<canvas id="pfd-bar" width="760" height="100" style="border:1px solid #ccc;border-radius:6px;background:#fafafa;width:100%;"></canvas>
	<p style="font-size:12px;color:#555;margin:4px 0 0;">Each bar = one dimension's PE value in [-1, 1]. No two positions produce the same pattern.</p>
      </div>
    </div>
  `;

	const D = 8;
	const BASE = 10000;
	const colors = [
		"#2563eb", "#7c3aed", "#db2777", "#ea580c",
		"#16a34a", "#0891b2", "#4f46e5", "#b91c1c",
	];

	function pe(pos, d) {
		const v = [];
		for (let i = 0; i < d; i += 2) {
			const w = 1 / Math.pow(BASE, i / d);
			v.push(Math.sin(pos * w));
			if (i + 1 < d) v.push(Math.cos(pos * w));
		}
		return v;
	}

	function drawWaves(pos) {
		const c = document.getElementById("pfd-waves");
		const ctx = c.getContext("2d");
		const W = c.width, H = c.height;
		ctx.clearRect(0, 0, W, H);

		const maxP = 100;
		const padL = 30, padR = 10, padT = 10, padB = 24;
		const gW = W - padL - padR, gH = H - padT - padB;

		ctx.strokeStyle = "#bbb";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(padL, padT);
		ctx.lineTo(padL, padT + gH);
		ctx.lineTo(padL + gW, padT + gH);
		ctx.stroke();
		ctx.fillStyle = "#888";
		ctx.font = "10px sans-serif";
		ctx.fillText("-1", 2, padT + gH);
		ctx.fillText("+1", 2, padT + 10);
		ctx.fillText("0", padL + gW / 2, H - 2);
		ctx.fillText(String(maxP), padL + gW - 14, H - 2);

		for (let dim = 0; dim < D; dim++) {
			ctx.strokeStyle = colors[dim];
			ctx.lineWidth = 1.5;
			ctx.globalAlpha = 0.5;
			ctx.beginPath();
			for (let px = 0; px <= gW; px++) {
				const p = (px / gW) * maxP;
				const val = pe(p, D)[dim];
				const x = padL + px;
				const y = padT + gH / 2 - val * (gH / 2 - 4);
				px === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
			}
			ctx.stroke();
			ctx.globalAlpha = 1;
		}

		const sx = padL + (pos / maxP) * gW;
		ctx.setLineDash([4, 3]);
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(sx, padT);
		ctx.lineTo(sx, padT + gH);
		ctx.stroke();
		ctx.setLineDash([]);

		const vals = pe(pos, D);
		for (let dim = 0; dim < D; dim++) {
			const y = padT + gH / 2 - vals[dim] * (gH / 2 - 4);
			ctx.fillStyle = colors[dim];
			ctx.beginPath();
			ctx.arc(sx, y, 4, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function drawCircle(pos, k) {
		const c = document.getElementById("pfd-circle");
		const ctx = c.getContext("2d");
		const W = c.width, H = c.height;
		ctx.clearRect(0, 0, W, H);

		const cx = W / 2, cy = H / 2, r = 85;

		ctx.strokeStyle = "#ddd";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(cx - r - 10, cy);
		ctx.lineTo(cx + r + 10, cy);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(cx, cy - r - 10);
		ctx.lineTo(cx, cy + r + 10);
		ctx.stroke();

		const w0 = 1 / Math.pow(BASE, 0 / D);
		const angle1 = pos * w0;
		const angle2 = (pos + k) * w0;

		const x1 = cx + r * Math.sin(angle1), y1 = cy - r * Math.cos(angle1);
		ctx.strokeStyle = "#2563eb";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(x1, y1);
		ctx.stroke();
		ctx.fillStyle = "#2563eb";
		ctx.beginPath();
		ctx.arc(x1, y1, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.font = "bold 11px sans-serif";
		ctx.fillText("pos=" + pos, x1 + 8, y1 - 4);

		const x2 = cx + r * Math.sin(angle2), y2 = cy - r * Math.cos(angle2);
		ctx.strokeStyle = "#dc2626";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.fillStyle = "#dc2626";
		ctx.beginPath();
		ctx.arc(x2, y2, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.font = "bold 11px sans-serif";
		ctx.fillText("pos+" + k, x2 + 8, y2 + 12);

		ctx.strokeStyle = "#f59e0b";
		ctx.lineWidth = 2;
		ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.arc(cx, cy, r * 0.45, -(Math.PI / 2 - angle1), -(Math.PI / 2 - angle2), angle2 > angle1);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.fillStyle = "#b45309";
		ctx.font = "11px sans-serif";
		ctx.fillText("k=" + k + " (fixed)", cx - 24, cy + r + 14);
	}

	function drawBar(pos) {
		const c = document.getElementById("pfd-bar");
		const ctx = c.getContext("2d");
		const W = c.width, H = c.height;
		ctx.clearRect(0, 0, W, H);

		const vals = pe(pos, D);
		const padL = 40, padR = 10, padT = 8, padB = 18;
		const gW = W - padL - padR, gH = H - padT - padB;
		const barW = gW / D - 6;

		const zeroY = padT + gH / 2;
		ctx.strokeStyle = "#ccc";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(padL, zeroY);
		ctx.lineTo(padL + gW, zeroY);
		ctx.stroke();
		ctx.fillStyle = "#999";
		ctx.font = "10px sans-serif";
		ctx.fillText("+1", 4, padT + 10);
		ctx.fillText(" 0", 8, zeroY + 3);
		ctx.fillText("-1", 4, padT + gH);

		for (let i = 0; i < D; i++) {
			const x = padL + i * (gW / D) + 3;
			const h = vals[i] * (gH / 2 - 2);
			ctx.fillStyle = colors[i];
			ctx.fillRect(x, zeroY - Math.max(h, 0), barW, Math.abs(h));
			ctx.fillStyle = "#333";
			ctx.font = "10px sans-serif";
			ctx.fillText("D" + i, x + barW / 2 - 6, H - 4);
			ctx.fillStyle = colors[i];
			ctx.font = "9px sans-serif";
			ctx.fillText(
				vals[i].toFixed(2),
				x + barW / 2 - 12,
				zeroY - h + (h >= 0 ? -4 : 12)
			);
		}
	}

	function render() {
		const pos = +document.getElementById("pfd-pos").value;
		const k = +document.getElementById("pfd-k").value;
		document.getElementById("pfd-pos-label").textContent = pos;
		document.getElementById("pfd-k-label").textContent = k;
		drawWaves(pos);
		drawCircle(pos, k);
		drawBar(pos);
	}

	document.getElementById("pfd-pos").addEventListener("input", render);
	document.getElementById("pfd-k").addEventListener("input", render);
	render();
}

async function loadPositionalEmbeddingsModule() {
	updateLoadingStatus("Loading section about positional embeddings...");
	PositionalLab.update(1)
	initPeFourierDemo();
	return Promise.resolve();
}
