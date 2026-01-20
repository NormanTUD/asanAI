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

		let html = ``;

		const results = this.data.map((row, i) => {
			const sum = row.reduce((a, b) => a + b, 0);
			const mean = sum / row.length;
			const variance = row.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / row.length;
			const stdDev = Math.sqrt(variance + epsilon);

			const normalizedRow = row.map(x => (gamma * ((x - mean) / stdDev)) + beta);

			html += `
	<div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 15px; padding: 25px; margin-bottom: 40px; font-family: 'Segoe UI', system-ui, sans-serif;">
	    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
		<span style="font-size: 1.25rem; font-weight: bold; color: #6366f1;">Row Group #${i + 1}</span>
		<div style="text-align: right;">
		    <div style="font-size: 0.8rem; color: #64748b; font-weight: bold; text-transform: uppercase;">Row Stats</div>
		    <div style="font-size: 1rem; color: #1e293b;">
			$\\mu = ${mean.toFixed(2)}$ | $\\sigma = ${stdDev.toFixed(2)}$
		    </div>
		</div>
	    </div>

	    <div style="display: flex; flex-direction: column; gap: 20px;">
		${row.map((val, idx) => {
			const diff = val - mean;
			const standardized = diff / stdDev;
			const final = (gamma * standardized) + beta;

			return `
		    <div style="display: grid; grid-template-columns: 120px 1fr 120px; align-items: center; background: #f8fafc; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
			<div style="text-align: center; z-index: 1;">
			    <div style="font-size: 0.7rem; color: #64748b; font-weight: bold;">INPUT $x_{${idx+1}}$</div>
			    <div style="font-size: 1.6rem; font-weight: bold; color: #1e293b;">${val}</div>
			</div>

			<div style="padding: 0 30px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
			    <div style="margin-bottom: 10px;">
				<span style="font-size: 0.85rem; font-weight: bold; color: #be185d;">Step 1: Distance from Average</span>
				<div style="font-size: 1.1rem; padding: 4px 0;">$${val} - ${mean.toFixed(2)} = ${diff.toFixed(2)}$</div>
			    </div>

			    <div style="margin-bottom: 10px;">
				<span style="font-size: 0.85rem; font-weight: bold; color: #2563eb;">Step 2: The "Squish" (Standardize)</span>
				<div style="font-size: 1.1rem; padding: 4px 0;">$\\frac{${diff.toFixed(2)}}{${stdDev.toFixed(2)}} = ${standardized.toFixed(3)}$</div>
			    </div>

				<div>
				    <span style="font-size: 0.85rem; font-weight: bold; color: #059669;">Step 3: Gain & Bias adjustment</span>
				    <div style="font-size: 1.1rem; padding: 4px 0;">
					$\\underbrace{(${gamma.toFixed(1)})}_{\\gamma} \\times ${standardized.toFixed(3)} + \\underbrace{${beta.toFixed(1)}}_{\\beta} = ${final.toFixed(2)}$
				    </div>
				</div>
			</div>

			<div style="text-align: center; z-index: 1;">
			    <div style="font-size: 0.7rem; color: #64748b; font-weight: bold;">OUTPUT $y_{${idx+1}}$</div>
			    <div style="font-size: 1.6rem; font-weight: bold; color: #10b981;">${final.toFixed(2)}</div>
			</div>

			<div style="position: absolute; right: -10px; bottom: -10px; font-size: 4rem; opacity: 0.03; font-weight: 900; pointer-events: none;">
			    FEAT ${idx+1}
			</div>
		    </div>`;
		}).join('')}
	    </div>
	</div>`;

			return normalizedRow;
		});

			container.innerHTML = html;
			this.renderPlot('input-plot', this.data, 'Raw Magnitudes');
			this.renderPlot('output-plot', results, `Layer Normalized (γ=${gamma}, β=${beta})`);
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
