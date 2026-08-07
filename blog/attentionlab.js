/**
 * Optimized 2D Transformer & Attention Simulation
 */
/**
 * THE NEURAL UNIVERSE
 */

// Numerically stable softmax: subtract the max before exponentiating
// so the result is unaffected by a constant shift of the inputs.
// Used by both the LDD demo and the Anatomy-of-Attention module.
function softmax(scores) {
	const max = Math.max(...scores);
	const exps = scores.map(s => Math.exp(s - max));
	const sum  = exps.reduce((a, b) => a + b, 0);
	return exps.map(e => e / sum);
}

const universeVocab = {
	'happy': [2, 8, 2], 'sad': [-2, 2, 1], 'love': [4, 9, 3], 'hate': [-4, 1, 0],
	'king': [8, 5, 10], 'queen': [8, 9, 10], 'man': [1, 5, 5], 'woman': [1, 9, 5],
	'dog': [0, 2, -8], 'cat': [0, 4, -9], 'puppy': [-2, 2, -10], 'kitten': [-2, 4, -10],
	'pizza': [10, 2, -5], 'apple': [8, 4, -6], 'burger': [10, 3, -7],
	'the': [0,0,0], 'is': [0,1,0], 'his': [1,0,0], 'a': [0,0,1]
};

function runUniverse() {
	const inputField = document.getElementById('universe-input');
	if (!inputField) return;

	const tokens = inputField.value.toLowerCase().split(/\s+/).filter(t => universeVocab[t]);
	const container = 'universe-plot';

	let traces = [];

	// 1. Hintergrund (Latent Space) - visible against current theme
	const allWords = Object.keys(universeVocab);
	traces.push({
		x: allWords.map(w => universeVocab[w][0]),
		y: allWords.map(w => universeVocab[w][1]),
		z: allWords.map(w => universeVocab[w][2]),
		mode: 'markers',
		marker: { size: 5, color: themeColor('#475569'), opacity: 0.7 },
		type: 'scatter3d'
	});

	// 2. Aktive Tokens & Attention Lines
	if (tokens.length > 0) {
		tokens.forEach(t => {
			const p = universeVocab[t];
			traces.push({
				x: [p[0]], y: [p[1]], z: [p[2]],
				mode: 'markers+text',
				text: t,
				textfont: { color: themeColor('#1e293b') },
				marker: { size: 12, color: '#2563eb', line: {color: themeColor('#fff'), width: 2} },
				type: 'scatter3d'
			});
		});
	}

	const layout = {
		margin: { l: 0, r: 0, b: 0, t: 0 },
		paper_bgcolor: themeColor('#fff'),
		scene: {
			xaxis: {
				gridcolor:    themeColor('#cbd5e1'),
				gridwidth: 1,
				showgrid: true,
				zeroline: true,
				zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 3,
				backgroundcolor: themeColor('#fff'),
				tickfont: { color: themeColor('#64748b') }
			},
			yaxis: {
				gridcolor:    themeColor('#cbd5e1'),
				gridwidth: 1,
				showgrid: true,
				zeroline: true,
				zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 3,
				backgroundcolor: themeColor('#fff'),
				tickfont: { color: themeColor('#64748b') }
			},
			zaxis: {
				gridcolor:    themeColor('#cbd5e1'),
				gridwidth: 1,
				showgrid: true,
				zeroline: true,
				zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 3,
				backgroundcolor: themeColor('#fff'),
				tickfont: { color: themeColor('#64748b') }
			},
			bgcolor: themeColor('#fff')
		},
		showlegend: false
	};

	Plotly.react(container, traces, layout, { responsive: true, displaylogo: false });
}

function log(type, msg) {
	const el = document.getElementById(type + '-console');
	if (el) el.innerText = msg;
}

// Renamed to SelfAttentionLab to avoid generic naming conflicts
const SelfAttentionLab = {
	data: {
		tokens: ["The", "hunter", "sees", "the", "bear"],
		matrix: [
			[0.10, 0.85, 0.05, 0.00, 0.00],
			[0.10, 0.60, 0.25, 0.00, 0.05],
			[0.00, 0.45, 0.10, 0.00, 0.45],
			[0.00, 0.00, 0.05, 0.10, 0.85],
			[0.00, 0.05, 0.45, 0.05, 0.45]
		]
	},
	hoverIndex: null,

	init: function() {
		this.renderTokens();
		this.drawTable();
		// Specific namespaced event listener
		window.addEventListener('resize', () => this.drawWeb());
		this.drawWeb();
	},

	renderTokens: function() {
		// Updated to namespaced ID: sa-token-stream
		const container = document.getElementById('sa-token-stream');
		if (!container) return;

		container.innerHTML = this.data.tokens.map((word, i) => `
	    <div class="sa-token-block"
		 onmouseover="SelfAttentionLab.hoverIndex=${i}; SelfAttentionLab.drawWeb();"
		 onmouseout="SelfAttentionLab.hoverIndex=null; SelfAttentionLab.drawWeb();">
		${word}
	    </div>
	`).join('');
	},

	drawWeb: function() {
		const canvas = document.getElementById('sa-attn-canvas');
		const container = document.getElementById('sa-attention-container');
		const chips = document.querySelectorAll('.sa-token-block');

		if (!canvas || !container || chips.length === 0) return;

		const ctx = canvas.getContext('2d');

		// Get precise dimensions to avoid incremental growth rounding issues
		const containerRect = container.getBoundingClientRect();

		// Only update if dimensions actually changed to prevent feedback loops
		if (canvas.width !== Math.floor(containerRect.width) ||
			canvas.height !== Math.floor(containerRect.height)) {
			canvas.width = containerRect.width;
			canvas.height = containerRect.height;
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		this.data.tokens.forEach((_, i) => {
			this.data.tokens.forEach((_, j) => {
				if (i === j) return;

				const strength = this.data.matrix[i][j];
				if (strength < 0.01) return;

				const chip1 = chips[i].getBoundingClientRect();
				const chip2 = chips[j].getBoundingClientRect();

				const x1 = (chip1.left + chip1.width / 2) - containerRect.left;
				const x2 = (chip2.left + chip2.width / 2) - containerRect.left;
				const baseY = (chip1.top - containerRect.top);

				const isSource = (this.hoverIndex === i);

				ctx.beginPath();
				if (isSource) {
					ctx.lineWidth = 2 + strength * 20;
					ctx.strokeStyle = isDarkMode()
						? `rgba(96, 165, 250, ${0.3 + strength * 0.7})`
						: `rgba(37, 99, 235, ${0.3 + strength * 0.7})`;
				} else {
					ctx.lineWidth = 1;
					ctx.strokeStyle = isDarkMode()
						? 'rgba(71, 85, 105, 0.35)'
						: 'rgba(203, 213, 225, 0.2)';
				}

				const dist = Math.abs(x2 - x1);
				const h = Math.min(dist * 0.5, 150);

				ctx.moveTo(x1, baseY);
				ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
				ctx.stroke();

				if (isSource && strength > 0.05) {
					ctx.fillStyle = isDarkMode() ? '#bfdbfe' : '#1e40af';
					ctx.font = "bold 14px Inter, sans-serif";
					const txt = Math.round(strength * 100) + "%";
					ctx.fillText(txt, (x1 + x2)/2 - 10, baseY - h/1.5);
				}
			});
		});
	},

	drawTable: function() {
		const { tokens, matrix } = this.data;
		// In dark mode the blue cell colour washes out, so pick a brighter
		// blue for the highlight colour and a darker text colour otherwise.
		const baseBlue   = isDarkMode() ? 'rgba(96, 165, 250, ' : 'rgba(37, 99, 235, ';
		const textOnCell = '#ffffff';
		const textOff    = themeColor('#475569');
		let html = '<table class="sa-attn-table"><tr><th>Source Word</th>';
		tokens.forEach(w => html += `<th>Attends to: ${w}</th>`);
		html += '</tr>';

		tokens.forEach((w, i) => {
			html += `<tr><td class="sa-row-label">${w}</td>`;
			matrix[i].forEach(val => {
				const color = `${baseBlue}${val})`;
				const textColor = val > 0.3 ? textOnCell : textOff;
				html += `<td style="background:${color}; color:${textColor}">${(val * 100).toFixed(0)}%</td>`;
			});
			html += '</tr>';
		});
		document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
	}
};

/* ═══════════════════════════════════════════════════════════
   ANATOMY OF ATTENTION — STEP-BY-STEP BUILD-UP
   Click "Next" to advance through each part of the equation,
   watching the 2D vector scene and score bars evolve together.
   ═══════════════════════════════════════════════════════════ */

// Four tokens. Token 0 is the query; tokens 1..3 are the keys/values.
const ATTN_TOKENS = [
	{ name: 'it',  color: '#ef4444' },
	{ name: 'cat', color: '#2563eb' },
	{ name: 'dog', color: '#3b82f6' },
	{ name: 'sat', color: '#60a5fa' }
];

// 2D query / keys / values. d_k = 2 keeps the geometry clean: the dot
// product is just (q[1]·k[1]) + (q[2]·k[2]) — two numbers, one vector.
const ATTN_2D = (function() {
	const q    = [ 1.00,  0.40 ];
	const keys = [
		[ 0.90,  0.45 ],   // k₁: "cat" — close to q, should win attention
		[-0.50,  0.80 ],   // k₂: "dog" — somewhat orthogonal
		[-0.60, -0.70 ]    // k₃: "sat" — pointing opposite-ish
	];
	const vals = [
		[ 0.80,  0.55 ],   // v₁
		[-0.30,  0.70 ],   // v₂
		[-0.70, -0.55 ]    // v₃
	];

	const d_k    = 2;
	const sqrtDk = Math.sqrt(d_k);

	const dot2 = (a, b) => a[0]*b[0] + a[1]*b[1];

	const scores  = keys.map(k => dot2(q, k));
	const scaled  = scores.map(s => s / sqrtDk);
	const exps    = scaled.map(s => Math.exp(s));
	const weights = softmax(scaled);

	const output = [0, 0];
	vals.forEach((v, j) => {
		output[0] += weights[j] * v[0];
		output[1] += weights[j] * v[1];
	});

	const weightedVals = vals.map((v, j) => [weights[j] * v[0], weights[j] * v[1]]);

	return { q, keys, vals, scores, scaled, exps, weights, output, weightedVals, d_k, sqrtDk };
})();

// Eight steps. `mode` decides what the 2D plot draws:
//   'keys'   → query + keys (steps 1-6)
//   'values' → query + values (step 7)
//   'output' → values + weighted values + output z with tip-to-tail (step 8)
// `computation` picks a template that shows the actual numerical math.
// `eqActive` lists the regions of the equation that should glow on this step.
const ATTN_STEPS = [
	{
		title: 'From embeddings to Q, K, V',
		computation: 'setup',
		intuition: 'setup',
		eqActive: [],
		desc: 'Each token starts as an <b>embedding vector</b> <b>x</b>. Three learned projections turn it into the three vectors we will use in attention: the query <b style="color:#ef4444">q</b> (asks "what am I looking for?"), the key <b style="color:#2563eb">k</b> (advertises "here is what I contain"), and the value <b style="color:#16a34a">v</b> (carries the actual content).',
		mode: 'keys'
	},
	{
		title: 'Element-wise product',
		computation: 'components',
		intuition: 'components',
		eqActive: ['dot'],
		desc: 'The dot product is built from component products: <b>q[1]·k₁[1] + q[2]·k₁[2]</b>. Each product captures alignment along one axis. k₂ and k₃ are dimmed to focus on what is being computed for k₁.',
		mode: 'keys', highlightKey: 0
	},
	{
		title: 'Sum: the dot product q · kⱼ',
		computation: 'dot',
		intuition: 'dot',
		eqActive: ['dot'],
		desc: 'Add the components for each key: <b>q·k₁</b> = 0.900 + 0.180 = <b>1.080</b>. Positive score = same direction; negative = opposite. k₁ wins because it points closest to q.',
		mode: 'keys'
	},
	{
		title: 'Scale by 1/√d_k',
		computation: 'scaled',
		intuition: 'scaled',
		eqActive: ['sqrt'],
		desc: 'Divide each score by √2 ≈ 1.414. This keeps the variance of scores near <b>1</b> regardless of d<sub>k</sub> — without it, softmax in a real d<sub>k</sub>=64 Transformer would saturate to a hard one-hot.',
		mode: 'keys'
	},
	{
		title: 'Exponentiate: eˢᶜᵒʳᵉ',
		computation: 'exps',
		intuition: 'exps',
		eqActive: ['exp'],
		desc: 'Apply exp() to each scaled score. Differences <b>amplify</b>: the largest score (0.764) becomes 2.146, but a small score (0.127) only grows to 0.881. The biggest input starts to dominate.',
		mode: 'keys'
	},
	{
		title: 'Normalize (softmax)',
		computation: 'weights',
		intuition: 'weights',
		eqActive: ['denom'],
		desc: 'Divide each exp(score) by the <b>sum</b> of all three. The numbers now sum to exactly 1 — a probability distribution. These are the <b>attention weights</b> α<sub>ij</sub>: α₁=60.2%, α₂=24.7%, α₃=15.1%.',
		mode: 'keys'
	},
	{
		title: 'Switch to value vectors',
		computation: 'values',
		intuition: 'values',
		eqActive: ['value'],
		desc: 'Drop the keys. Bring in the <b>Value</b> vectors <b style="color:#16a34a">v₁</b>, <b style="color:#15803d">v₂</b>, <b style="color:#166534">v₃</b> (green) — they live in a separate subspace and carry the actual semantic content. The attention weights carry over unchanged.',
		mode: 'values'
	},
	{
		title: 'Weighted sum → output z',
		computation: 'output',
		intuition: 'output',
		eqActive: ['sum', 'alpha', 'value'],
		desc: 'Compute <b>z = α₁v₁ + α₂v₂ + α₃v₃</b>. Each value is scaled by its weight (the dark-green dashed arrows), then tip-to-tail added together (gray dashed chain). The final <b style="color:#f59e0b">z</b> (orange) lives <b>inside the convex hull</b> of v₁, v₂, v₃ — attention can only interpolate.',
		mode: 'output'
	}
];

// Per-step "Currently computing" panels. Each shows the actual numerical
// computation on the real data, so the user sees exactly what the active
// sub-expression of the equation is doing with concrete numbers.
const ATTN_COMPUTATIONS = {
	setup: () => `
		<div class="comp-header">▶ The Players — inputs to the equation</div>
		<div class="comp-body">
			<div class="comp-row"><span class="comp-var">$\\mathbf{q}$</span>  <span class="comp-calc">$= (1.00,\\; 0.40)$</span></div>
			<div class="comp-row"><span class="comp-var">$\\mathbf{k}_1$</span> <span class="comp-calc">$= (0.90,\\; 0.45)$ <span class="comp-extra">(cat)</span></span></div>
			<div class="comp-row"><span class="comp-var">$\\mathbf{k}_2$</span> <span class="comp-calc">$= (-0.50,\\; 0.80)$ <span class="comp-extra">(dog)</span></span></div>
			<div class="comp-row"><span class="comp-var">$\\mathbf{k}_3$</span> <span class="comp-calc">$= (-0.60,\\; -0.70)$ <span class="comp-extra">(sat)</span></span></div>
			<div class="comp-note">No computation yet — these are the inputs the equation will operate on.</div>
		</div>
	`,
	components: () => `
		<div class="comp-header">▶ Currently computing: $q[d] \\cdot k_1[d]$ (element-wise product)</div>
		<div class="comp-body">
			<div class="comp-row highlighted">
				<span class="comp-var">$q[1] \\cdot k_1[1]$</span>
				<span class="comp-calc">$= (1.00) \\times (0.90)$</span>
				<span class="comp-result">$= 0.900$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$q[2] \\cdot k_1[2]$</span>
				<span class="comp-calc">$= (0.40) \\times (0.45)$</span>
				<span class="comp-result">$= 0.180$</span>
			</div>
			<div class="comp-note">Two scalar products, one per dimension. Next step: add them.</div>
		</div>
	`,
	dot: () => {
		const k = ATTN_2D.keys;
		const s = ATTN_2D.scores;
		return `
		<div class="comp-header">▶ Currently computing: $q \\cdot k_j$ (sum of components)</div>
		<div class="comp-body">
			<div class="comp-row highlighted">
				<span class="comp-var">$q \\cdot k_1$</span>
				<span class="comp-calc">$= (1.00)(0.90) + (0.40)(0.45) = 0.900 + 0.180$</span>
				<span class="comp-result">$= ${s[0].toFixed(3)}$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$q \\cdot k_2$</span>
				<span class="comp-calc">$= (1.00)(-0.50) + (0.40)(0.80) = -0.500 + 0.320$</span>
				<span class="comp-result">$= ${s[1].toFixed(3)}$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$q \\cdot k_3$</span>
				<span class="comp-calc">$= (1.00)(-0.60) + (0.40)(-0.70) = -0.600 - 0.280$</span>
				<span class="comp-result">$= ${s[2].toFixed(3)}$</span>
			</div>
			<div class="comp-note">Positive score = same direction as $\\mathbf{q}$. Negative = opposite.</div>
		</div>`;
	},
	scaled: () => {
		const s = ATTN_2D.scores;
		const sc = ATTN_2D.scaled;
		return `
		<div class="comp-header">▶ Currently computing: $(q \\cdot k_j) \\,/\\, \\sqrt{d_k}$ (variance control)</div>
		<div class="comp-body">
			<div class="comp-row highlighted">
				<span class="comp-var">$(${s[0].toFixed(3)}) \\,/\\, \\sqrt{2}$</span>
				<span class="comp-calc">$= ${s[0].toFixed(3)} \\,/\\, 1.414$</span>
				<span class="comp-result">$= ${sc[0].toFixed(3)}$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$(${s[1].toFixed(3)}) \\,/\\, \\sqrt{2}$</span>
				<span class="comp-calc">$= ${s[1].toFixed(3)} \\,/\\, 1.414$</span>
				<span class="comp-result">$= ${sc[1].toFixed(3)}$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$(${s[2].toFixed(3)}) \\,/\\, \\sqrt{2}$</span>
				<span class="comp-calc">$= ${s[2].toFixed(3)} \\,/\\, 1.414$</span>
				<span class="comp-result">$= ${sc[2].toFixed(3)}$</span>
			</div>
			<div class="comp-note">Keeps the variance of scores near $1$, regardless of $d_k$.</div>
		</div>`;
	},
	exps: () => {
		const sc = ATTN_2D.scaled;
		const ex = ATTN_2D.exps;
		return `
		<div class="comp-header">▶ Currently computing: $e^{\\mathrm{score}}$ (amplify differences)</div>
		<div class="comp-body">
			<div class="comp-row highlighted">
				<span class="comp-var">$e^{${sc[0].toFixed(3)}}$</span>
				<span class="comp-calc"></span>
				<span class="comp-result">$= ${ex[0].toFixed(3)}$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$e^{${sc[1].toFixed(3)}}$</span>
				<span class="comp-calc"></span>
				<span class="comp-result">$= ${ex[1].toFixed(3)}$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$e^{${sc[2].toFixed(3)}}$</span>
				<span class="comp-calc"></span>
				<span class="comp-result">$= ${ex[2].toFixed(3)}$</span>
			</div>
			<div class="comp-note">The largest input ($${sc[0].toFixed(3)}$) dominates after $\\exp$: $${ex[0].toFixed(3)} \\gg ${ex[2].toFixed(3)}$.</div>
		</div>`;
	},
	weights: () => {
		const ex = ATTN_2D.exps;
		const w = ATTN_2D.weights;
		const sum = ex.reduce((a, b) => a + b, 0);
		return `
		<div class="comp-header">▶ Currently computing: softmax (divide by the sum)</div>
		<div class="comp-body">
			<div class="comp-row">
				<span class="comp-var">$\\mathrm{Sum}$</span>
				<span class="comp-calc">$= ${ex[0].toFixed(3)} + ${ex[1].toFixed(3)} + ${ex[2].toFixed(3)}$</span>
				<span class="comp-result">$= ${sum.toFixed(3)}$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$\\alpha_1$</span>
				<span class="comp-calc">$= ${ex[0].toFixed(3)} \\,/\\, ${sum.toFixed(3)}$</span>
				<span class="comp-result">$= ${w[0].toFixed(3)}$ <span class="comp-extra">(${(w[0]*100).toFixed(1)}%)</span></span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$\\alpha_2$</span>
				<span class="comp-calc">$= ${ex[1].toFixed(3)} \\,/\\, ${sum.toFixed(3)}$</span>
				<span class="comp-result">$= ${w[1].toFixed(3)}$ <span class="comp-extra">(${(w[1]*100).toFixed(1)}%)</span></span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$\\alpha_3$</span>
				<span class="comp-calc">$= ${ex[2].toFixed(3)} \\,/\\, ${sum.toFixed(3)}$</span>
				<span class="comp-result">$= ${w[2].toFixed(3)}$ <span class="comp-extra">(${(w[2]*100).toFixed(1)}%)</span></span>
			</div>
			<div class="comp-note">Three weights sum to $100\\%$ — a probability distribution over the keys.</div>
		</div>`;
	},
	values: () => `
		<div class="comp-header">▶ Currently switching from keys to value vectors</div>
		<div class="comp-body">
			<div class="comp-row highlighted"><span class="comp-var">$\\mathbf{v}_1$</span> <span class="comp-calc">$= (0.80,\\; 0.55)$</span></div>
			<div class="comp-row highlighted"><span class="comp-var">$\\mathbf{v}_2$</span> <span class="comp-calc">$= (-0.30,\\; 0.70)$</span></div>
			<div class="comp-row highlighted"><span class="comp-var">$\\mathbf{v}_3$</span> <span class="comp-calc">$= (-0.70,\\; -0.55)$</span></div>
			<div class="comp-row" style="margin-top:8px;">
				<span class="comp-var">weights (carry over)</span>
				<span class="comp-calc">$\\alpha_1=${(ATTN_2D.weights[0]*100).toFixed(1)}\\%$, $\\alpha_2=${(ATTN_2D.weights[1]*100).toFixed(1)}\\%$, $\\alpha_3=${(ATTN_2D.weights[2]*100).toFixed(1)}\\%$</span>
			</div>
			<div class="comp-note">Keys told us <em>what</em> to attend to. Values carry the actual content.</div>
		</div>
	`,
	output: () => {
		const w = ATTN_2D.weights;
		const v = ATTN_2D.vals;
		const wv = ATTN_2D.weightedVals;
		const z = ATTN_2D.output;
		const fmt = n => (n >= 0 ? '\\,' : '') + n.toFixed(3);
		return `
		<div class="comp-header">▶ Currently computing: $\\mathbf{z} = \\sum_j \\alpha_j \\mathbf{v}_j$ (weighted sum)</div>
		<div class="comp-body">
			<div class="comp-row highlighted">
				<span class="comp-var">$\\alpha_1 \\mathbf{v}_1$</span>
				<span class="comp-calc">$= ${(w[0]*100).toFixed(1)}\\% \\times (${fmt(v[0][0])},\\; ${fmt(v[0][1])})$</span>
				<span class="comp-result">$= (${fmt(wv[0][0])},\\; ${fmt(wv[0][1])})$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$\\alpha_2 \\mathbf{v}_2$</span>
				<span class="comp-calc">$= ${(w[1]*100).toFixed(1)}\\% \\times (${fmt(v[1][0])},\\; ${fmt(v[1][1])})$</span>
				<span class="comp-result">$= (${fmt(wv[1][0])},\\; ${fmt(wv[1][1])})$</span>
			</div>
			<div class="comp-row highlighted">
				<span class="comp-var">$\\alpha_3 \\mathbf{v}_3$</span>
				<span class="comp-calc">$= ${(w[2]*100).toFixed(1)}\\% \\times (${fmt(v[2][0])},\\; ${fmt(v[2][1])})$</span>
				<span class="comp-result">$= (${fmt(wv[2][0])},\\; ${fmt(wv[2][1])})$</span>
			</div>
			<div class="comp-row" style="margin-top:10px; padding-top:8px; border-top:1px dashed #cbd5e1;">
				<span class="comp-var">$\\mathbf{z}$</span>
				<span class="comp-calc">$= (${fmt(wv[0][0])} + ${fmt(wv[1][0])} + ${fmt(wv[2][0])},\\; ${fmt(wv[0][1])} + ${fmt(wv[1][1])} + ${fmt(wv[2][1])})$</span>
				<span class="comp-result">$= \\mathbf{(${fmt(z[0])},\\; ${fmt(z[1])}}$</span>
			</div>
			<div class="comp-note">$\\mathbf{z}$ is a convex combination — it lies <b>inside the triangle</b> formed by $\\mathbf{v}_1, \\mathbf{v}_2, \\mathbf{v}_3$.</div>
		</div>`;
	}
};

// Per-step "Geometric intuition" panels. Each contains:
//   - A Temml-rendered formula (just set as innerHTML, then call render_temml())
//   - "What this does" — a plain-language explanation of the operation alone
//   - "Big picture" — how it serves the overall attention computation
const ATTN_INTUITIONS = {
	setup: () => `
		<div class="intuition-header">💡 Where do Q, K, V come from?</div>
		<div class="intuition-math">$$q_i = x_i W^Q, \\quad k_j = x_j W^K, \\quad v_j = x_j W^V$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> each token's <b>embedding</b> <i>x</i> is multiplied by three <b>learned matrices</b> to produce the query, key, and value.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> Q, K, V are three different "views" of the same token — same input, different roles. This is the first place the model <i>learns</i> anything.
		</div>
	`,
	components: () => `
		<div class="intuition-header">💡 Geometric intuition — Element-wise product</div>
		<div class="intuition-math">$$q[d] \\cdot k_1[d] \\quad d \\in \\{1, 2\\}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> per-axis product. Same sign = positive (agree); opposite sign = negative (disagree).
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> the atoms of the dot product — sum them next.
		</div>
	`,
	dot: () => `
		<div class="intuition-header">💡 Geometric intuition — The dot product</div>
		<div class="intuition-math">$$q \\cdot k_j = \\lVert q \\rVert \\cdot \\lVert k_j \\rVert \\cdot \\cos\\theta$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> add the components → one scalar per key. Positive = same direction; negative = opposite.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> the projection of <i>q</i> onto <i>k</i> — how much of <i>q</i> fits inside <i>k</i>.
		</div>
	`,
	scaled: () => `
		<div class="intuition-header">💡 Geometric intuition — Scale by √d_k</div>
		<div class="intuition-math">$$\\frac{q \\cdot k_j}{\\sqrt{d_k}}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> divide each score by √d_k.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> keeps variance at ~1 so softmax behaves at any dimension.
		</div>
	`,
	exps: () => `
		<div class="intuition-header">💡 Geometric intuition — Exponentiate</div>
		<div class="intuition-math">$$e^{\\text{score}_j}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> apply exp() — positive scores grow, negative scores shrink.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> makes softmax a <i>soft argmax</i> — biggest score wins exponentially.
		</div>
	`,
	weights: () => `
		<div class="intuition-header">💡 Geometric intuition — Normalize (softmax)</div>
		<div class="intuition-math">$$\\alpha_{ij} = \\frac{e^{\\text{score}_j}}{\\sum_n e^{\\text{score}_n}}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> divide each exp(score) by the sum.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> three weights sum to 100% — a finite resource of attention.
		</div>
	`,
	values: () => `
		<div class="intuition-header">💡 Geometric intuition — Switch to values</div>
		<div class="intuition-math">$$v_1, v_2, v_3 \\in \\mathbb{R}^{d_v}, \\quad \\alpha_{ij}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> drop the keys, bring in vⱼ — the actual content to blend.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> keys = WHAT to attend to, values = WHAT to retrieve.
		</div>
	`,
	output: () => `
		<div class="intuition-header">💡 Geometric intuition — Weighted sum</div>
		<div class="intuition-math">$$\\mathbf{z} = \\sum_j \\alpha_j \\mathbf{v}_j$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> multiply each value by its weight, then add.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> z lives inside the triangle of v₁, v₂, v₃ — only interpolation.
		</div>
	`
};

// The exact Temml formula + plain-language explanation for each arrow
// type that can appear in the 2D plot. Used by the hover tooltip.
const VECTOR_FORMULAS = {
	q: {
		name: 'q  (the query)',
		formula: 'q_i \\;=\\; x_i \\, W^Q',
		desc: 'The query of token i. Computed by multiplying the token embedding x_i by the learned query projection matrix W^Q.'
	},
	k: {
		name: 'k  (the key)',
		formula: 'k_j \\;=\\; x_j \\, W^K',
		desc: 'The key of token j. Computed by multiplying the token embedding x_j by the learned key projection matrix W^K. Used to score relevance against queries.'
	},
	v: {
		name: 'v  (the value)',
		formula: 'v_j \\;=\\; x_j \\, W^V',
		desc: 'The value of token j. The actual semantic content this token carries — what gets blended into the output.'
	},
	weightedV: {
		name: 'αⱼ · vⱼ  (attention-weighted value)',
		formula: '\\alpha_j \\, v_j, \\quad \\alpha_j \\;=\\; \\dfrac{e^{q \\cdot k_j \\,/\\, \\sqrt{d_k}}}{\\sum_n e^{q \\cdot k_n \\,/\\, \\sqrt{d_k}}}',
		desc: 'Value vⱼ scaled by its attention weight αⱼ. αⱼ is the softmax of the scaled dot product — a soft "how much does this token matter?" between 0 and 1.'
	},
	z: {
		name: 'z  (the contextualised output)',
		formula: 'z \\;=\\; \\sum_j \\alpha_j \\, v_j',
		desc: 'The contextualised output. A convex combination of all values, each weighted by its attention. Always lives inside the convex hull of the values.'
	}
};

// Pre-rendered MathML for each vector formula. Filled once by
// AttentionAnatomy._renderFormulas() so the hover tooltip can swap
// content instantly without re-running Temml on every hover.
let TEMML_RENDERED = {};

const AttentionAnatomy = {
	step: 0,

	init: function() {
		if (!document.getElementById('attn-anatomy-2d')) return;

		document.getElementById('attn-anatomy-prev').addEventListener('click', () => this.prev());
		document.getElementById('attn-anatomy-next').addEventListener('click', () => this.next());

		// Pre-render the vector formula LaTeX to MathML via Temml, once.
		// The hover tooltip then just swaps innerHTML — instant, no
		// re-render cost per hover.
		this._renderFormulas();

		// Keyboard navigation: ← / → step through. Skipped while typing
		// in form fields so this never steals input events.
		this._keyHandler = (e) => {
			const t = e.target;
			if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
			if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
			if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
		};
		document.addEventListener('keydown', this._keyHandler);

		this.render();

		if (window.__MN_DARK) {
			window.__MN_DARK.onChange(() => this.render());
		}
	},

	// Pre-render each VECTOR_FORMULAS entry's LaTeX to MathML via Temml.
	// Stored in TEMML_RENDERED (global) so wireTooltip can look it up
	// on hover. Falls back to the raw LaTeX if Temml isn't available.
	_renderFormulas: function() {
		const tmp = document.createElement('div');
		tmp.style.position = 'absolute';
		tmp.style.left = '-99999px';
		tmp.style.top = '0';
		document.body.appendChild(tmp);
		for (const key in VECTOR_FORMULAS) {
			tmp.innerHTML = `$$ ${VECTOR_FORMULAS[key].formula} $`;
			try {
				if (typeof render_temml === 'function') render_temml(tmp);
			} catch (e) {}
			TEMML_RENDERED[key] = tmp.innerHTML;
		}
		document.body.removeChild(tmp);
	},

	next: function() {
		if (this.step < ATTN_STEPS.length - 1) {
			this.step++;
			this.render();
		}
	},

	prev: function() {
		if (this.step > 0) {
			this.step--;
			this.render();
		}
	},

	goto: function(n) {
		this.step = Math.max(0, Math.min(ATTN_STEPS.length - 1, n));
		this.render();
	},

	render: function() {
		const data = ATTN_STEPS[this.step];

		// Brief opacity dip on the left column while we swap content.
		// The right column (plot/bars) just transitions its traces, no fade.
		const fadeTargets = [
			document.getElementById('attn-anatomy-equation'),
			document.getElementById('attn-anatomy-computation'),
			document.getElementById('attn-anatomy-intuition')
		].filter(Boolean);
		fadeTargets.forEach(el => { el.style.opacity = '0.35'; });

		// Header bits
		const titleEl = document.getElementById('attn-anatomy-step-title');
		const numEl   = document.getElementById('attn-anatomy-step-num');
		if (numEl)   numEl.textContent   = `Step ${this.step + 1}`;
		if (titleEl) titleEl.textContent = `— ${data.title}`;

		// Update each panel
		this.renderEquation(data);
		this.renderComputation(data);
		this.renderIntuition(data);
		this.render2D(data);

		// Temml is loaded by load_base_js(); it scans the document for
		// $...$ / $$...$$ blocks and replaces them with MathML.
		if (typeof render_temml === 'function') {
			try { render_temml(); } catch (e) { /* ignore */ }
		}

		// Fade back in on the next frame so the transition is visible.
		requestAnimationFrame(() => {
			fadeTargets.forEach(el => { el.style.opacity = ''; });
		});

		document.getElementById('attn-anatomy-prev').disabled = (this.step === 0);
		document.getElementById('attn-anatomy-next').disabled = (this.step === ATTN_STEPS.length - 1);
	},

	// Render the FULL equation as Temml / LaTeX. Active sub-expressions
	// (those listed in `data.eqActive`) are wrapped in \color{#2563eb}
	// + \mathbf{} so they appear blue and bold after Temml renders them.
	renderEquation: function(data) {
		const el = document.getElementById('attn-anatomy-equation');
		if (!el) return;

		const active = new Set(data.eqActive || []);
		// Active sub-expression gets boxed + bold blue so the user can
		// see exactly which part of the equation the current step is
		// computing. \boxed comes from amsmath; \color from xcolor.
		const hl = (latex, region) => {
			if (active.has(region)) return `\\boxed{\\color{#2563eb}\\mathbf{${latex}}}`;
			return latex;
		};

		// Output line: z_i = Σ_j α_ij · v_j
		const outputLatex =
			'z_i = ' +
			hl('\\sum_j',                'sum')   + '\\;' +
			hl('\\alpha_{ij}',           'alpha') + '\\;\\cdot\\;' +
			hl('v_j',                    'value');

		// Weight line: α_ij = exp(q_i·k_j / √d_k) ÷ Σ_n exp(q_i·k_n / √d_k)
		const weightLatex =
			'\\alpha_{ij} = ' +
			hl('\\mathrm{exp}',          'exp')   +
			'\\!\\bigl(' +
			hl('q_i \\cdot k_j',         'dot')   + '\\;/\\;' +
			hl('\\sqrt{d_k}',            'sqrt')  +
			'\\bigr)\\;\\div\\;' +
			hl('\\sum_n \\mathrm{exp}(q_i \\cdot k_n \\big/ \\sqrt{d_k})', 'denom');

		el.innerHTML =
			'<div class="eq-line" id="attn-section-output">' +
				'<div class="eq-label">Output</div>' +
				'$$ \\displaystyle ' + outputLatex + ' $$' +
			'</div>' +
			'<div class="eq-line" id="attn-section-weight">' +
				'<div class="eq-label">Weight</div>' +
				'$$ \\displaystyle ' + weightLatex + ' $$' +
			'</div>';
	},

	// Populate the "Currently computing" panel with the actual numerical
	// computation for this step. Shows real numbers so the user can see
	// exactly what the active sub-expression of the equation does.
	renderComputation: function(data) {
		const el = document.getElementById('attn-section-computation');
		if (!el) return;
		const fn = ATTN_COMPUTATIONS[data.computation];
		if (fn) el.innerHTML = fn();
		else el.innerHTML = '';
	},

	// Populate the "Geometric intuition" panel: Temml-rendered math +
	// human-readable explanation of what this step does, where it came
	// from, and how it serves the overall attention computation.
	renderIntuition: function(data) {
		const el = document.getElementById('attn-section-intuition');
		if (!el) return;
		const fn = ATTN_INTUITIONS[data.intuition];
		if (fn) el.innerHTML = fn();
		else el.innerHTML = '';
	},

	// ─── 2D vector scene ────────────────────────────────────────────
	render2D: function(data) {
		const traces = [];
		const mode   = data.mode;

		// Always draw the query unless we're in pure output mode.
		// Each arrow receives a formula key (q / k / v / weightedV / z)
		// so the hover tooltip can show its mathematical definition.
		if (mode === 'keys' || mode === 'values') {
			this.addArrow2D(traces, [0, 0], ATTN_2D.q, '#ef4444', 'q', 1.0, false, false, 'q');
		}

		if (mode === 'keys') {
			ATTN_2D.keys.forEach((k, j) => {
				const isHi = (data.highlightKey === j);
				const dim  = (data.highlightKey !== undefined && !isHi);
				const color = isHi ? '#1e3a8a' : ATTN_TOKENS[j + 1].color;
				this.addArrow2D(traces, [0, 0], k, color, `k${j+1}`, dim ? 0.35 : 1.0, false, false, 'k');
			});
		} else if (mode === 'values' || mode === 'output') {
			const valColors = ['#16a34a', '#15803d', '#166534'];
			ATTN_2D.vals.forEach((v, j) => {
				const dim = (mode === 'output');
				this.addArrow2D(traces, [0, 0], v, valColors[j], `v${j+1}`, dim ? 0.35 : 1.0, false, false, 'v');
			});

			if (mode === 'output') {
				// Weighted (scaled) value vectors from origin
				ATTN_2D.weightedVals.forEach((wv, j) => {
					this.addArrow2D(traces, [0, 0], wv, '#15803d', `α${j+1}·v${j+1}`, 0.85, /*dashed*/ true, false, 'weightedV');
				});

				// Tip-to-tail construction: α₁v₁ from origin, then α₂v₂
				// from the tip of α₁v₁, then α₃v₃ from there. These are
				// auxiliary construction lines — no formula key.
				let tip = [0, 0];
				ATTN_2D.weightedVals.forEach((wv, j) => {
					const next = [tip[0] + wv[0], tip[1] + wv[1]];
					this.addArrow2D(traces, tip, next, '#94a3b8', null, 0.65, /*dashed*/ true, /*noMarker*/ true);
					tip = next;
				});

				// Output z from origin
				this.addArrow2D(traces, [0, 0], ATTN_2D.output, '#f59e0b', 'z = output', 1.0, false, false, 'z');
			}
		}

		const layout = {
			xaxis: {
				title: { text: 'Dim 1', font: { color: themeColor('#475569'), size: 11 } },
				range: [-1.4, 1.4],
				zeroline: true, zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 2,
				gridcolor: themeColor('#e2e8f0'),
				tickfont: { color: themeColor('#94a3b8'), size: 9 },
				scaleanchor: 'y', scaleratio: 1,
				constrain: 'domain',
				automargin: true
			},
			yaxis: {
				title: { text: 'Dim 2', font: { color: themeColor('#475569'), size: 11 } },
				range: [-1.4, 1.4],
				zeroline: true, zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 2,
				gridcolor: themeColor('#e2e8f0'),
				tickfont: { color: themeColor('#94a3b8'), size: 9 },
				constrain: 'domain',
				automargin: true
			},
			paper_bgcolor: themeColor('#fff'),
			plot_bgcolor: themeColor('#fff'),
			margin: { l: 40, r: 20, t: 14, b: 40, pad: 0 },
			showlegend: false,
			// Keep the plot fully inside the container regardless of
			// grid-column width.
			autosize: true
		};

		Plotly.react('attn-anatomy-2d', traces, layout, {
			responsive: true, displaylogo: false,
			modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'lasso2d', 'select2d']
		});

		// Re-trigger size calc so the plot picks up the final column width
		// (grid columns can have 0 width at the moment Plotly first mounts).
		requestAnimationFrame(() => Plotly.relayout('attn-anatomy-2d', {}));

		// Wire up the hover tooltip: hovering an arrow (shaft or
		// arrowhead) shows its mathematical definition.
		this.wireTooltip();
	},

	// Attach plotly hover / unhover handlers that show / hide the
	// formula tooltip. Each arrow trace carries a `customdata` key
	// (e.g. 'q', 'k', 'v', 'weightedV', 'z') that indexes VECTOR_FORMULAS.
	wireTooltip: function() {
		const chart = document.getElementById('attn-anatomy-2d');
		const tip   = document.getElementById('attn-vector-tooltip');
		if (!chart || !tip) return;

		chart.removeAllListeners && chart.removeAllListeners('plotly_hover');
		chart.removeAllListeners && chart.removeAllListeners('plotly_unhover');

		chart.on('plotly_hover', (data) => {
			const cd = data.points?.[0]?.customdata;
			const key = Array.isArray(cd) ? cd[0] : cd;
			if (!key || !VECTOR_FORMULAS[key]) return;
			const info = VECTOR_FORMULAS[key];
			tip.querySelector('.tt-name').textContent = info.name;
			tip.querySelector('.tt-formula').innerHTML = TEMML_RENDERED[key] || info.formula;
			tip.querySelector('.tt-desc').textContent = info.desc;
			tip.classList.add('active');
			// Position near the cursor, but flip if too close to the
			// right/bottom edge so the tooltip stays on screen.
			const pad = 16;
			let x = data.event.clientX + pad;
			let y = data.event.clientY + pad;
			const tipRect = tip.getBoundingClientRect();
			if (x + tipRect.width  > window.innerWidth)  x = data.event.clientX - tipRect.width - pad;
			if (y + tipRect.height > window.innerHeight) y = data.event.clientY - tipRect.height - pad;
			tip.style.left = x + 'px';
			tip.style.top  = y + 'px';
		});
		chart.on('plotly_unhover', () => {
			tip.classList.remove('active');
		});
	},

	// Draw an arrow from `start` to `end` in the 2D plot. The shaft is
	// a line; the tip is a triangle-up marker rotated to point along
	// the vector direction. The label is placed PAST the tip in the
	// direction of the arrow, offset perpendicular to it, so it never
	// overlaps with the shaft.
	addArrow2D: function(traces, start, end, color, label, opacity, dashed, noMarker, formula) {
		const dx = end[0] - start[0];
		const dy = end[1] - start[1];
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len < 0.01) return;
		const op = (opacity !== undefined) ? opacity : 1.0;
		const isDashed = !!dashed;
		// `formula` is a key into VECTOR_FORMULAS (e.g. 'q', 'k', 'v',
		// 'weightedV', 'z'). When set, hovering the arrow (shaft or
		// arrowhead) triggers the tooltip that explains where that
		// vector comes from mathematically.
		const cd = formula ? [formula] : null;

		// Shaft
		traces.push({
			type: 'scatter', mode: 'lines',
			x: [start[0], end[0]], y: [start[1], end[1]],
			line: { color: color, width: 4, dash: isDashed ? 'dot' : 'solid' },
			opacity: op,
			customdata: cd,
			showlegend: false, hoverinfo: 'skip'
		});

		// Arrowhead (triangle pointing along the vector). Plotly's
		// `angle` rotates clockwise from the up direction, so the
		// conversion is `angle = 90° - atan2(dy,dx)`.
		if (!noMarker) {
			const angle = 90 - Math.atan2(dy, dx) * 180 / Math.PI;
			traces.push({
				type: 'scatter', mode: 'markers',
				x: [end[0]], y: [end[1]],
				marker: {
					symbol: 'triangle-up',
					size: 16,
					color: color,
					angle: angle,
					line: { width: 1, color: themeColor('#fff') }
				},
				opacity: op,
				customdata: cd,
				showlegend: false, hoverinfo: 'skip'
			});
		}

		// Label — placed past the tip in the arrow's direction, then
		// nudged perpendicular so the text sits next to the shaft, not
		// on top of it. Also add a subtle white background so it stays
		// readable if a later overlay draws near it.
		if (label) {
			const nx = dx / len;
			const ny = dy / len;
			// Perpendicular (rotated 90° CCW from the arrow direction)
			const perpX = -ny;
			const perpY =  nx;
			const alongDist = 0.22;   // past the arrowhead
			const perpDist  = 0.14;   // to the side of the shaft
			const labelX = end[0] + nx * alongDist + perpX * perpDist;
			const labelY = end[1] + ny * alongDist + perpY * perpDist;

			// White halo first (slightly larger), then the coloured text
			// on top. This makes the label readable when it crosses
			// other lines or the axes.
			traces.push({
				type: 'scatter', mode: 'text',
				x: [labelX], y: [labelY],
				text: [label],
				textposition: 'middle center',
				textfont: { size: 14, color: 'rgba(255,255,255,0.92)', family: 'Inter, sans-serif' },
				customdata: cd,
				showlegend: false, hoverinfo: 'skip'
			});
			traces.push({
				type: 'scatter', mode: 'text',
				x: [labelX], y: [labelY],
				text: [label],
				textposition: 'middle center',
				textfont: { size: 13, color: color, family: 'Inter, sans-serif' },
				opacity: op,
				customdata: cd,
				showlegend: false, hoverinfo: 'skip'
			});
		}
	},

	// (Old renderBars removed — the bar chart was redundant with the
	// "Currently computing" panel, which already shows the same numbers.)
	// (Old highlightEquation removed — highlighting is now done via
	// \color in the LaTeX rendered by renderEquation.)
};

function initAttentionAnatomy() {
	AttentionAnatomy.init();
}


/**
 * Lazy-loaded Q/K/V subspace projection visualization.
 * Shows how W^Q, W^K, W^V project 3D embeddings onto different 2D planes.
 * Call initQKVSubspaceViz() once after the DOM is ready.
 */
function initQKVSubspaceViz() {
	const containerId = 'qkv-subspace-projection-viz';
	const container = document.getElementById(containerId);
	if (!container) return;

	const render = () => _renderQKVSubspaceViz(containerId);

	// Re-render whenever the theme flips so colors stay in sync.
	if (window.__MN_DARK) {
		window.__MN_DARK.onChange(render);
	}

	// Lazy-load: only build the (heavy) Plotly scene when the user
	// scrolls it into view. Falls back to immediate render if the
	// container is already on screen at module-load time.
	const rect = container.getBoundingClientRect();
	const vh = window.innerHeight || document.documentElement.clientHeight;
	const alreadyVisible = rect.top < vh && rect.bottom > 0;

	if (alreadyVisible) {
		render();
		return;
	}

	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					render();
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0 });
		observer.observe(container);
	} else {
		// Old browser — just render after a tick.
		setTimeout(render, 0);
	}
}

/**
 * Internal render function — builds the Plotly 3D scene showing
 * original embeddings and their projections onto three different 2D planes.
 */
function _renderQKVSubspaceViz(containerId) {
	const container = document.getElementById(containerId);
	if (!container) return;
	container.innerHTML = '';

	// --- 1. Define sample 3D token embeddings ---
	const tokens = {
		'king':   [2.0,  1.5,  0.8],
		'queen':  [2.1,  1.6, -0.7],
		'man':    [0.5,  1.8,  1.0],
		'woman':  [0.6,  1.9, -0.5],
		'throne': [2.5,  0.3,  0.1],
		'rules':  [1.8,  0.8,  0.5],
	};

	const tokenNames = Object.keys(tokens);
	const tokenColors = [
		'#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'
	];

	// --- 2. Define three different 2×3 projection matrices (W^Q, W^K, W^V) ---
	// Each projects from 3D → 2D (simulating d_model=3, d_k=2)
	// We define them as two 3D basis vectors spanning the target plane.
	const projections = {
		Q: {
			label: 'W^Q plane',
			color: 'rgba(239,68,68,0.12)',
			borderColor: '#ef4444',
			// Plane spanned by these two orthonormal-ish basis vectors
			u: [0.8, 0.6, 0.0],
			v: [0.0, 0.0, 1.0]
		},
		K: {
			label: 'W^K plane',
			color: 'rgba(59,130,246,0.12)',
			borderColor: '#3b82f6',
			u: [0.57, -0.57, 0.57],
			v: [0.71,  0.71, 0.0]
		},
		V: {
			label: 'W^V plane',
			color: 'rgba(34,197,94,0.12)',
			borderColor: '#22c55e',
			u: [1.0, 0.0, 0.0],
			v: [0.0, 0.57, 0.82]
		}
	};

	// Normalize basis vectors
	function normalize(v) {
		const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
		return v.map(x => x / mag);
	}

	for (const key in projections) {
		projections[key].u = normalize(projections[key].u);
		projections[key].v = normalize(projections[key].v);
	}

	// Project a 3D point onto the plane spanned by u, v
	function projectOntoPlane(point, u, v) {
		const dotU = point[0]*u[0] + point[1]*u[1] + point[2]*u[2];
		const dotV = point[0]*v[0] + point[1]*v[1] + point[2]*v[2];
		return [
			dotU * u[0] + dotV * v[0],
			dotU * u[1] + dotV * v[1],
			dotU * u[2] + dotV * v[2]
		];
	}

	// --- 3. Build tab UI for Q / K / V ---
	const tabBar = document.createElement('div');
	tabBar.style.cssText = `display:flex; gap:8px; padding:10px 15px;
		background:${themeColor('#fff')}; border-bottom:1px solid ${themeColor('#e2e8f0')};`;

	const plotDiv = document.createElement('div');
	plotDiv.id = containerId + '-plot';
	plotDiv.style.cssText = `width:100%; height:480px; background:${themeColor('#fff')};`;

	const tabBtns = {};
	['Q', 'K', 'V'].forEach((key) => {
		const btn = document.createElement('button');
		btn.textContent = `W^${key} Projection`;
		btn.style.cssText = `padding:8px 20px; border-radius:8px; border:2px solid ${projections[key].borderColor};
	    background:${themeColor('#fff')};
	    color:${projections[key].borderColor};
	    font-weight:bold; cursor:pointer; font-size:0.9rem; transition:all 0.15s;`;
		btn.addEventListener('click', () => {
			Object.entries(tabBtns).forEach(([k, b]) => {
				const isActive = (k === key);
				b.style.background = isActive ? projections[k].borderColor : themeColor('#fff');
				b.style.color      = isActive ? themeColor('#fff')        : projections[k].borderColor;
			});
			renderProjection(key);
		});
		tabBar.appendChild(btn);
		tabBtns[key] = btn;
	});

	container.appendChild(tabBar);
	container.appendChild(plotDiv);

	// Mark Q as the default-active tab.
	tabBtns['Q'].style.background = projections['Q'].borderColor;
	tabBtns['Q'].style.color      = themeColor('#fff');

	function renderProjection(key) {
		const proj = projections[key];
		const traces = [];

		// --- Original 3D points (grey) ---
		traces.push({
			type: 'scatter3d',
			x: tokenNames.map(t => tokens[t][0]),
			y: tokenNames.map(t => tokens[t][1]),
			z: tokenNames.map(t => tokens[t][2]),
			mode: 'markers+text',
			text: tokenNames,
			textposition: 'top center',
			textfont: { size: 11, color: themeColor('#64748b') },
			marker: { size: 5, color: themeColor('#94a3b8'), opacity: 0.6 },
			name: 'Original (3D)',
			hovertemplate: '<b>%{text}</b><br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra>Original</extra>'
		});

		// --- Projected points + drop lines ---
		tokenNames.forEach((token, i) => {
			const orig = tokens[token];
			const projected = projectOntoPlane(orig, proj.u, proj.v);

			// Drop line from original to projected
			traces.push({
				type: 'scatter3d',
				x: [orig[0], projected[0]],
				y: [orig[1], projected[1]],
				z: [orig[2], projected[2]],
				mode: 'lines',
				line: { color: tokenColors[i], width: 2, dash: 'dot' },
				showlegend: false,
				hoverinfo: 'skip'
			});

			// Projected point
			traces.push({
				type: 'scatter3d',
				x: [projected[0]],
				y: [projected[1]],
				z: [projected[2]],
				mode: 'markers+text',
				text: [token],
				textposition: 'bottom center',
				textfont: { size: 12, color: tokenColors[i], family: 'Inter, sans-serif' },
				marker: { size: 7, color: tokenColors[i], symbol: 'diamond',
					line: { width: 1, color: themeColor('#fff') } },
				name: `${token} (${key})`,
				hovertemplate: `<b>${token}</b> projected by W<sup>${key}</sup><br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>`
			});
		});

		// --- Draw the plane as a mesh surface ---
		const planeSize = 3.5;
		const corners = [
			[ planeSize,  planeSize],
			[ planeSize, -planeSize],
			[-planeSize, -planeSize],
			[-planeSize,  planeSize]
		];
		const px = [], py = [], pz = [];
		corners.forEach(([a, b]) => {
			px.push(a * proj.u[0] + b * proj.v[0]);
			py.push(a * proj.u[1] + b * proj.v[1]);
			pz.push(a * proj.u[2] + b * proj.v[2]);
		});

		traces.push({
			type: 'mesh3d',
			x: px, y: py, z: pz,
			i: [0, 0], j: [1, 2], k: [2, 3],
			color: proj.borderColor,
			opacity: 0.1,
			name: proj.label,
			hoverinfo: 'name',
			flatshading: true
		});

		// --- Plane border outline ---
		traces.push({
			type: 'scatter3d',
			x: [...px, px[0]],
			y: [...py, py[0]],
			z: [...pz, pz[0]],
			mode: 'lines',
			line: { color: proj.borderColor, width: 3 },
			showlegend: false,
			hoverinfo: 'skip'
		});

		const layout = {
			title: {
				text: `<b>${proj.label}</b>: Projecting 3D embeddings onto a 2D subspace`,
				font: { size: 14, color: themeColor('#1e293b'), family: 'Inter, system-ui, sans-serif' }
			},
			scene: {
				xaxis: { title: 'Dim 0', range: [-4, 4],
				         gridcolor: themeColor('#e2e8f0'),
				         zerolinecolor: themeColor('#94a3b8'),
				         backgroundcolor: themeColor('#fff'),
				         tickfont: { color: themeColor('#64748b') } },
				yaxis: { title: 'Dim 1', range: [-4, 4],
				         gridcolor: themeColor('#e2e8f0'),
				         zerolinecolor: themeColor('#94a3b8'),
				         backgroundcolor: themeColor('#fff'),
				         tickfont: { color: themeColor('#64748b') } },
				zaxis: { title: 'Dim 2', range: [-4, 4],
				         gridcolor: themeColor('#e2e8f0'),
				         zerolinecolor: themeColor('#94a3b8'),
				         backgroundcolor: themeColor('#fff'),
				         tickfont: { color: themeColor('#64748b') } },
				camera: { eye: { x: 1.8, y: 1.4, z: 1.2 } },
				aspectmode: 'cube',
				bgcolor: themeColor('#fff')
			},
			paper_bgcolor: themeColor('#fff'),
			plot_bgcolor: themeColor('#fff'),
			margin: { l: 0, r: 0, b: 10, t: 45 },
			showlegend: true,
			legend: {
				orientation: 'h', x: 0.5, xanchor: 'center', y: -0.02,
				font: { size: 11, color: themeColor('#1e293b') },
				bgcolor: 'rgba(0,0,0,0)'
			},
			hoverlabel: { bgcolor: themeColor('#1e293b'), font: { color: '#fff' } }
		};

		Plotly.react(plotDiv.id, traces, layout, { responsive: true, displaylogo: false });
	}

	// Initial render with Q
	renderProjection('Q');
}

/* ═══════════════════════════════════════════════════════════════
   LONG DISTANCE DEPENDENCIES
   ═══════════════════════════════════════════════════════════════ */

// Minimal canvas text helper used by the LDD bar chart below.
function drawLabel(ctx, text, x, y, color, size, align, bold) {
	ctx.font = `${bold ? 'bold ' : ''}${size || 13}px Inter, system-ui, sans-serif`;
	ctx.fillStyle = color || themeColor('#1e293b');
	ctx.textAlign = align || 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, x, y);
}

const LDD = {
    subject: { word: 'cat', color: '#2563eb' },
    pronoun: { word: 'its', color: '#f59e0b' },
    distractors: ['that','the','dog','chased','across','the','yard',
                  'and','through','the','garden','gate','finally','climbed','the'],
    // Raw dot products q · k for the pronoun's query against each token.
    qk_subject: 3.2,
    qk_distractor: 0.2,
    qk_self: 0.5,
    // Head dimension. With h=8 heads and d_model=512, d_k = 64. The
    // paper's √d_k scaling keeps softmax inputs on a sane scale.
    d_k: 64,
    // RNN state-decay per step (multiplicative gate ≈ 0.82).
    rnn_decay: 0.82
};

function updateLDD() {
    const n = parseInt(document.getElementById('ldd-distance').value);
    document.getElementById('ldd-distance-val').innerText = n;

    // Build tokens
    const tokens = [{word:'The', type:'filler'}];
    tokens.push({word: LDD.subject.word, type:'subject'});
    for (let i = 0; i < n; i++) tokens.push({word: LDD.distractors[i % LDD.distractors.length], type:'distractor'});
    tokens.push({word: LDD.pronoun.word, type:'pronoun'});

    const subjectIdx = 1;
    const pronounIdx = tokens.length - 1;
    const distance = pronounIdx - subjectIdx;

    // ── Self-attention from the pronoun's perspective ──
    //   score_ij = q · k_j   (already scaled to a plausible 3.2/0.2/0.5 magnitude
    //   matching q,k entries ~ N(0,1) at d_k = 64)
    //   alpha_ij = softmax_j(score_ij / √d_k)
    const rawScores = tokens.map((tok, i) => {
        if (i === subjectIdx) return LDD.qk_subject;
        if (i === pronounIdx) return LDD.qk_self;
        // Tiny jitter so the distractor bars aren't perfectly equal.
        return LDD.qk_distractor + (Math.random() * 0.1 - 0.05);
    });
    const scaled = rawScores.map(s => s / Math.sqrt(LDD.d_k));
    const attn = softmax(scaled);

    // Sentence display
    const sentenceEl = document.getElementById('ldd-sentence');
    const subjBg = isDarkMode() ? '#1e3a8a' : '#dbeafe';
    const proBg  = isDarkMode() ? '#451a03' : '#fef3c7';
    sentenceEl.innerHTML = tokens.map(tok => {
        let s = 'padding:2px 4px; border-radius:3px; margin:0 1px;';
        if (tok.type === 'subject') s += `background:${subjBg}; color:${LDD.subject.color}; font-weight:bold;`;
        else if (tok.type === 'pronoun') s += `background:${proBg}; color:${LDD.pronoun.color}; font-weight:bold;`;
        else if (tok.type === 'distractor') s += `color:${themeColor('#94a3b8')};`;
        else s += `color:${themeColor('#64748b')};`;
        return `<span style="${s}">${tok.word}</span>`;
    }).join(' ') + `<br><span style="font-size:0.8rem; color:${themeColor('#64748b')}; font-style:normal;">` +
    `Distance: <b>${distance}</b> tokens between ` +
    `<span style="color:${LDD.subject.color}; font-weight:bold;">"${LDD.subject.word}"</span> and ` +
    `<span style="color:${LDD.pronoun.color}; font-weight:bold;">"${LDD.pronoun.word}"</span></span>`;

    // Canvas
    const canvas = document.getElementById('ldd-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        requestAnimationFrame(updateLDD);
        return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const padL = 50, padR = 20, padT = 30, padB = 50;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const numTokens = tokens.length;
    const gap = chartW / numTokens;
    const barW = Math.min(28, gap * 0.65);
    const maxVal = Math.max(...attn) * 1.2;
    const toY = v => padT + chartH * (1 - v / maxVal);
    const toBarX = i => padL + gap * i + gap / 2;

    // Grid
    ctx.strokeStyle = themeColor('#f1f5f9'); ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
        const gy = padT + (chartH / 4) * g;
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = themeColor('#94a3b8'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + chartH); ctx.lineTo(W - padR, padT + chartH); ctx.stroke();

    // Y ticks + axis title
    ctx.font = '10px Inter, system-ui, sans-serif'; ctx.fillStyle = themeColor('#94a3b8'); ctx.textAlign = 'right';
    for (let g = 0; g <= 4; g++) {
        const val = (maxVal / 4) * (4 - g);
        ctx.fillText((val * 100).toFixed(0) + '%', padL - 6, padT + (chartH / 4) * g + 4);
    }
    // Y-axis title (rotated, on the left)
    ctx.save();
    ctx.translate(14, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = themeColor('#475569');
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('Attention / Signal Strength (%)', 0, 0);
    ctx.restore();

    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillStyle = themeColor('#475569');
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('Token Position', padL + chartW / 2, H - 6);

    // Bars
    tokens.forEach((tok, i) => {
        const x = toBarX(i);
        const barH = (attn[i] / maxVal) * chartH;
        const barY = padT + chartH - barH;
        let color = themeColor('#e2e8f0');
        if (tok.type === 'subject') color = LDD.subject.color;
        else if (tok.type === 'pronoun') color = LDD.pronoun.color;

        ctx.globalAlpha = tok.type === 'distractor' ? 0.4 : 0.85;
        ctx.fillStyle = color;
        ctx.fillRect(x - barW / 2, barY, barW, barH);
        ctx.globalAlpha = 1;

        // Labels
        ctx.save();
        ctx.translate(x, padT + chartH + 8);
        if (numTokens > 10) ctx.rotate(-Math.PI / 4);
        const lc = tok.type === 'subject' ? LDD.subject.color : tok.type === 'pronoun' ? LDD.pronoun.color : themeColor('#94a3b8');
        drawLabel(ctx, tok.word, 0, 0, lc, numTokens > 12 ? 9 : 10, numTokens > 10 ? 'right' : 'center', tok.type !== 'distractor');
        ctx.restore();

        if (attn[i] > 0.03) drawLabel(ctx, (attn[i]*100).toFixed(0)+'%', x, barY - 8, color, 10, 'center', true);
    });

    // RNN decay curve — thick, with markers at each token. This is the
    // signal an RNN would carry forward step-by-step.
    const rnnStart = attn[subjectIdx];
    const rnnPoints = [];
    for (let i = subjectIdx; i <= pronounIdx; i++) {
        const x = toBarX(i);
        const rnnVal = rnnStart * Math.pow(LDD.rnn_decay, i - subjectIdx);
        rnnPoints.push({ x, y: toY(rnnVal) });
    }
    // Draw as a smooth curve (quadratic through points) so it pops visually
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    rnnPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
            const prev = rnnPoints[i - 1];
            const cx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
    });
    ctx.stroke();
    // Markers along the RNN curve
    rnnPoints.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
    });

    // Transformer flat line — self-attention reaches every position in
    // one step, so signal strength does NOT decay with distance.
    const tY = toY(attn[subjectIdx]);
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(toBarX(subjectIdx), tY);
    ctx.lineTo(toBarX(pronounIdx), tY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend (top-right corner of the chart)
    const legX = W - padR - 175;
    const legY = padT + 8;
    ctx.fillStyle = isDarkMode() ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(legX, legY, 170, 46);
    ctx.strokeStyle = themeColor('#cbd5e1');
    ctx.lineWidth = 1;
    ctx.strokeRect(legX, legY, 170, 46);
    // Transformer swatch
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3; ctx.setLineDash([4, 4]);
    ctx.moveTo(legX + 8, legY + 14);
    ctx.lineTo(legX + 28, legY + 14);
    ctx.stroke(); ctx.setLineDash([]);
    drawLabel(ctx, 'Transformer (flat)', legX + 34, legY + 14, themeColor('#1e293b'), 10, 'left', true);
    // RNN swatch
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.moveTo(legX + 8, legY + 34);
    ctx.lineTo(legX + 28, legY + 34);
    ctx.stroke();
    drawLabel(ctx, 'RNN (×' + LDD.rnn_decay + '/step)', legX + 34, legY + 34, themeColor('#1e293b'), 10, 'left', true);

    // Math summary
    const rnnFinal = Math.pow(LDD.rnn_decay, distance);
    const ratio = (1 / rnnFinal);
    const trBg = isDarkMode() ? 'rgba(37, 99, 235, 0.10)' : '#eff6ff';
    const rnBg = isDarkMode() ? 'rgba(239, 68, 68, 0.10)'  : '#fef2f2';
    document.getElementById('ldd-math').innerHTML = `<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
    <tr style="border-bottom:2px solid ${themeColor('#cbd5e1')}; color:${themeColor('#64748b')};">
        <th style="text-align:left; padding:3px 8px;">Model</th>
        <th style="text-align:left; padding:3px 8px;">Signal after ${distance} steps</th>
        <th style="text-align:right; padding:3px 8px;">Strength</th>
    </tr>
    <tr style="background:${trBg};">
        <td style="color:#2563eb; font-weight:bold; padding:3px 8px;">Transformer</td>
        <td style="padding:3px 8px; font-family:monospace;">softmax(q·k / √${LDD.d_k}) — distance-invariant</td>
        <td style="text-align:right; padding:3px 8px;"><b style="color:#2563eb;">${(attn[subjectIdx]*100).toFixed(1)}%</b></td>
    </tr>
    <tr style="background:${rnBg};">
        <td style="color:#ef4444; font-weight:bold; padding:3px 8px;">RNN</td>
        <td style="padding:3px 8px; font-family:monospace;">${LDD.rnn_decay}<sup>${distance}</sup> = ${rnnFinal.toFixed(4)}</td>
        <td style="text-align:right; padding:3px 8px;"><b style="color:#ef4444;">${(rnnFinal*100).toFixed(1)}%</b></td>
    </tr>
    <tr style="border-top:2px solid ${themeColor('#1e293b')};">
        <td colspan="2" style="text-align:right; padding:6px 8px; font-weight:bold;">Transformer advantage:</td>
        <td style="text-align:right; padding:6px 8px;"><b style="color:#059669; font-size:1.1rem;">${ratio.toFixed(1)}×</b></td>
    </tr></table>`;
}

// ─────────────────── INITIALIZATION ───────────────────

async function loadAttentionModule() {
	updateLoadingStatus("Loading section about activation functions...");
	SelfAttentionLab.init();
	initAttentionAnatomy();
	runUniverse();
	initQKVSubspaceViz();
	requestAnimationFrame(updateLDD);

	// Re-render the canvases / Plotly figures when the user flips
	// dark mode so themeColor() picks up the new palette.
	if (window.__MN_DARK) {
		window.__MN_DARK.onChange(() => {
			try { AttentionAnatomy.render(); } catch (e) { /* ignore */ }
			try { initQKVSubspaceViz(); }     catch (e) { /* ignore */ }
			try { updateLDD(); }              catch (e) { /* ignore */ }
			try { runUniverse(); }            catch (e) { /* ignore */ }
		});
	}

	return Promise.resolve();
}
