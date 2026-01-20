const NormLab = {
	data: [
		[10, 2, 8, 5],   
		[40, 10, 32, 25], 
		[15, 25, 5, 12]   
	],

	init: function() {
		this.renderTable('input-table', this.data);
		this.process(); 

		// Listen for live edits in the table
		document.getElementById('input-table').addEventListener('input', () => {
			this.syncData();
			this.process();
		});

		// NEW: Listen for changes in Gamma and Beta inputs
		document.getElementById('gamma-input').addEventListener('input', () => this.process());
		document.getElementById('beta-input').addEventListener('input', () => this.process());
	},

	syncData: function() {
		const rows = document.querySelectorAll('#input-table tr:not(:first-child)');
		this.data = Array.from(rows).map(row => {
			const cells = Array.from(row.querySelectorAll('td[contenteditable]'));
			return cells.map(td => {
				const val = parseFloat(td.innerText);
				return isNaN(val) ? 0 : val; // Sanitize invalid input to 0
			});
		});
	},

	process: function() {
		const container = document.getElementById('math-display');
		const epsilon = 1e-5;

		const gamma = parseFloat(document.getElementById('gamma-input').value) || 0;
		const beta = parseFloat(document.getElementById('beta-input').value) || 0;

		let html = `<h2 style="color:#10b981; margin-top:0;">Detailed Mathematical Breakdown</h2>`;
		
		const results = this.data.map((row, i) => {
			const mean = row.reduce((a, b) => a + b, 0) / row.length;
			const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;
			const stdDev = Math.sqrt(variance + epsilon);

			const normalizedRow = row.map(x => {
				const xHat = (x - mean) / stdDev;
				return (gamma * xHat) + beta;
			});

			// Updated LaTeX with \underbrace for gamma and beta
			html += `
	<div style="margin-bottom: 25px; padding: 20px; border-left: 5px solid #10b981; background: #f0fdf4; border-radius: 8px;">
	    <h4 style="margin:0 0 10px 0; color:#065f46;">Step-by-Step for Sample ${i+1}:</h4>
	    <div style="font-size: 0.95rem; line-height: 2.8;">
		$\\text{Mean } (\\mu) = ${mean.toFixed(2)}, \\text{ Variance } (\\sigma^2) = ${variance.toFixed(2)}$ <br>
		$\\text{Formula: } y = \\underbrace{${gamma.toFixed(1)}}_{\\gamma} \\left( \\frac{x - \\mu}{\\sigma} \\right) + \\underbrace{${beta.toFixed(1)}}_{\\beta}$ <br>
		$F_1 \\text{ result}: ${normalizedRow[0].toFixed(2)}$ | $F_2 \\text{ result}: ${normalizedRow[1].toFixed(2)}$
	    </div>
	</div>`;

			return normalizedRow;
		});

		container.innerHTML = html;
		this.renderPlot('input-plot', this.data, 'Raw Features');
		this.renderPlot('output-plot', results, `LN (γ=${gamma}, β=${beta})`);
		if (window.MathJax) MathJax.typesetPromise();
	},

	renderTable: function(id, data) {
		let h = `<tr style="background:#f1f5f9"><th>#</th><th>F1</th><th>F2</th><th>F3</th><th>F4</th></tr>`;
		data.forEach((r, i) => {
			h += `<tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold;">${i+1}</td>`;
			r.forEach(val => h += `<td contenteditable="true" style="padding:8px; border:1px solid #e2e8f0; background: white; outline: #10b981;">${val}</td>`);
			h += `</tr>`;
		});
		document.getElementById(id).innerHTML = h;
	},

	renderPlot: function(id, data, title) {
		const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
		const traces = [];
		for (let f = 0; f < (data[0] ? data[0].length : 0); f++) {
			traces.push({
				x: data.map((_, i) => `S${i+1}`),
				y: data.map(row => row[f]),
				name: `Feat ${f+1}`,
				type: 'bar',
				marker: { color: colors[f], line: { color: '#1e293b', width: 1 } }
			});
		}
		const layout = { 
			title: title, barmode: 'group', margin: { t: 50, b: 30, l: 40, r: 10 },
			legend: { orientation: 'h', y: -0.2 },
			yaxis: {
				// Adjusting range for standardized output (usually within -3 to 3)
				range: id === 'output-plot' ? [-2.5, 2.5] : null,
				zeroline: true, zerolinecolor: '#475569', gridcolor: '#e2e8f0'
			}
		};
		Plotly.newPlot(id, traces, layout);
	}
};

window.addEventListener('load', () => NormLab.init());
